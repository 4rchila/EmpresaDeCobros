from decimal import Decimal
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.prestamos.models import Cuota, Prestamo, Pago
from apps.users.permissions import IsAdminUser


def _add_period(fecha, periodicidad: str, n: int):
    """Devuelve fecha + n períodos según la periodicidad del plan."""
    import calendar

    p = periodicidad.lower()
    if p == "diario":
        return fecha + timedelta(days=n)
    if p == "semanal":
        return fecha + timedelta(weeks=n)
    if p == "quincenal":
        return fecha + timedelta(days=15 * n)
    # mensual (default)
    month = fecha.month - 1 + n
    year  = fecha.year + month // 12
    month = month % 12 + 1
    import calendar as _cal
    day   = min(fecha.day, _cal.monthrange(year, month)[1])
    return fecha.replace(year=year, month=month, day=day)


def _calcular_mora_analitica(prestamo, cuota_base: Decimal, mora_pct: Decimal, today) -> tuple[int, Decimal]:
    """
    Calcula pagosAtrasados y mora de forma analítica cuando no hay
    registros de Cuota en la base de datos.

    Lógica:
      1. Determinar cuántas cuotas deberían haberse pagado hasta hoy.
      2. Estimar cuántas cuotas se han cubierto con el monto abonado.
      3. Diferencia = cuotas atrasadas.
      4. Mora = cuotas_atrasadas × cuota_base × mora%.
    """
    plan = prestamo.plan
    if not plan or not prestamo.fecha_desembolso or cuota_base <= Decimal("0"):
        return 0, Decimal("0")

    periodicidad = (plan.periodicidad or "mensual").lower()
    dias = (today - prestamo.fecha_desembolso).days

    if periodicidad == "diario":
        cuotas_esperadas = dias
    elif periodicidad == "semanal":
        cuotas_esperadas = dias // 7
    elif periodicidad == "quincenal":
        cuotas_esperadas = dias // 15
    else:  # mensual
        cuotas_esperadas = dias // 30

    cuotas_esperadas = min(max(cuotas_esperadas, 0), plan.numero_cuotas)

    # Cuotas totalmente cubiertas según el monto abonado
    abonado = (
        prestamo.pagos
        .filter(estado__in=["registrado", "pendiente_validacion"])
        .aggregate(Sum("monto_pagado"))["monto_pagado__sum"]
        or Decimal("0")
    )
    cuotas_pagadas = int(abonado / cuota_base) if cuota_base > 0 else 0
    pagos_atrasados = max(0, cuotas_esperadas - cuotas_pagadas)
    mora_total = Decimal(str(pagos_atrasados)) * cuota_base * mora_pct
    return pagos_atrasados, mora_total


class ReportesGeneralView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        today = timezone.localdate()

        prestamos_desembolsados = (
            Prestamo.objects
            .filter(fecha_desembolso__isnull=False)
            .select_related("plan", "cliente")
            .prefetch_related("cuotas", "pagos")
            .order_by("-id")[:100]
        )

        balance_data    = []
        total_desembolsado = Decimal("0")
        total_recaudado    = Decimal("0")
        total_mora_global  = Decimal("0")
        creditos_activos   = 0

        for p in prestamos_desembolsados:
            total_desembolsado += p.monto_solicitado

            # ── Monto total del préstamo (capital + interés) ─────────────
            monto_total  = p.monto_solicitado * (
                Decimal("1") + p.interes / Decimal("100")
            )

            # ── Abono acumulado ──────────────────────────────────────────
            abonado = (
                p.pagos
                .filter(estado__in=["registrado", "pendiente_validacion"])
                .aggregate(Sum("monto_pagado"))["monto_pagado__sum"]
                or Decimal("0")
            )
            total_recaudado += abonado

            # ── Saldos ───────────────────────────────────────────────────
            deuda_original  = monto_total
            saldo_cartera   = max(deuda_original - abonado, Decimal("0"))
            interes_monto   = p.monto_solicitado * (p.interes / Decimal("100"))
            saldo_capital   = max(p.monto_solicitado - abonado, Decimal("0"))
            saldo_interes   = max(interes_monto - max(abonado - p.monto_solicitado, Decimal("0")), Decimal("0"))

            # ── Pagos atrasados y mora ───────────────────────────────────
            plan          = p.plan
            cuota_base    = Decimal("0")
            mora_pct      = Decimal("0")
            mora_total    = Decimal("0")
            pagos_atrasados = 0

            if plan and plan.numero_cuotas:
                cuota_base = (monto_total / Decimal(plan.numero_cuotas)).quantize(
                    Decimal("0.01")
                )
                mora_pct = plan.mora / Decimal("100")

                cuotas_qs = p.cuotas.all()

                if cuotas_qs.exists():
                    # Usar cuotas reales de la base de datos
                    vencidas = cuotas_qs.filter(
                        fecha_vencimiento__lt=today,
                        estado_cuota__in=["pendiente", "parcial", "vencida"],
                    )
                    pagos_atrasados = vencidas.count()
                    mora_total = Decimal(str(pagos_atrasados)) * cuota_base * mora_pct
                else:
                    # Fallback analítico para préstamos anteriores sin cuotas
                    pagos_atrasados, mora_total = _calcular_mora_analitica(
                        p, cuota_base, mora_pct, today
                    )

            saldo_cartera_mora = saldo_cartera + mora_total
            total_mora_global  += mora_total

            if saldo_cartera > 0:
                creditos_activos += 1

            # ── Fecha fin estimada ───────────────────────────────────────
            fecha_fin = ""
            if plan and plan.numero_cuotas and p.fecha_desembolso:
                fecha_fin_dt = _add_period(
                    p.fecha_desembolso,
                    plan.periodicidad or "mensual",
                    plan.numero_cuotas,
                )
                fecha_fin = fecha_fin_dt.strftime("%d/%m/%Y")

            balance_data.append({
                "id":               f"CR-{p.id}",
                "cliente":          p.cliente.nombre_completo if p.cliente else "N/A",
                "fechaInicio":      p.fecha_desembolso.strftime("%d/%m/%Y") if p.fecha_desembolso else "",
                "fechaFin":         fecha_fin,
                "desembolso":       float(p.monto_solicitado),
                "interes":          float(p.interes),
                "deudaOriginal":    float(deuda_original),
                "montoAbonado":     float(abonado),
                "saldoCapital":     float(saldo_capital),
                "saldoInteres":     float(saldo_interes),
                "saldoCartera":     float(saldo_cartera),
                "saldoCarteraMora": float(saldo_cartera_mora),
                "pagosAtrasados":   pagos_atrasados,
                "mora":             float(mora_total),
            })

        # ── Rendimiento mensual (últimos 5 meses) ────────────────────────
        rendimiento_mensual = []
        hoy = timezone.now()

        for i in range(4, -1, -1):
            first_day = (hoy.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            mes_nombre = first_day.strftime("%b")
            mes  = first_day.month
            anio = first_day.year

            recaudado_mes = (
                Pago.objects.filter(
                    fecha_pago__month=mes,
                    fecha_pago__year=anio,
                    estado__in=["registrado", "pendiente_validacion"],
                ).aggregate(Sum("monto_pagado"))["monto_pagado__sum"]
                or Decimal("0")
            )
            desembolsado_mes = (
                Prestamo.objects.filter(
                    fecha_desembolso__month=mes,
                    fecha_desembolso__year=anio,
                ).aggregate(Sum("monto_solicitado"))["monto_solicitado__sum"]
                or Decimal("0")
            )

            # Interés real: suma de (monto_solicitado × interes%) de los
            # préstamos desembolsados ese mes
            prestamos_mes = Prestamo.objects.filter(
                fecha_desembolso__month=mes,
                fecha_desembolso__year=anio,
            ).values_list("monto_solicitado", "interes")

            interes_mes = sum(
                m * (i_pct / Decimal("100")) for m, i_pct in prestamos_mes
            ) if prestamos_mes.exists() else Decimal("0")

            # Mora del mes: suma de mora_generada en cuotas que vencieron ese mes
            mora_mes = (
                Cuota.objects.filter(
                    fecha_vencimiento__month=mes,
                    fecha_vencimiento__year=anio,
                    estado_cuota__in=["parcial", "vencida"],
                ).aggregate(Sum("mora_generada"))["mora_generada__sum"]
                or Decimal("0")
            )

            ganancia = recaudado_mes - desembolsado_mes

            rendimiento_mensual.append({
                "mes":        mes_nombre,
                "desembolso": float(desembolsado_mes),
                "recaudado":  float(recaudado_mes),
                "interes":    float(interes_mes),
                "mora":       float(mora_mes),
                "ganancia":   float(ganancia),
            })

        return Response({
            "kpis": {
                "total_desembolsado": float(total_desembolsado),
                "total_recaudado":    float(total_recaudado),
                "total_mora":         float(total_mora_global),
                "creditos_activos":   creditos_activos,
            },
            "balance":     balance_data,
            "rendimiento": rendimiento_mensual,
        })
