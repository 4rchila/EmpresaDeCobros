"""
Clasificación automática de carteras por mora.

Reglas:
  - Vencida : cliente tiene ≥1 cuota con fecha_vencimiento < hoy y saldo_cuota > 0
  - Muerta  : la última cuota venció hace > DIAS_LIMITE días SIN pagar el total
              DIAS_LIMITE = 60 si pagó ≥75 % del préstamo, 30 si pagó < 75 %
  Efecto de Muerta: el cliente entra automáticamente a lista negra.
"""

from decimal import Decimal

from django.db import transaction
from django.db.models import Max, Sum
from django.utils import timezone

from apps.bitacora.utils import registrar_en_bitacora
from apps.notificaciones.models import Notificacion

from .models import Cartera, Cliente, ListaNegra, ListaNegraCliente


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_or_create_cartera(asesor, nombre: str, estado: str) -> Cartera:
    """Obtiene o crea la cartera de un asesor con el estado indicado."""
    cartera = Cartera.objects.filter(
        usuario_responsable=asesor,
        estado=estado,
    ).first()
    if not cartera:
        cartera = Cartera.objects.create(
            usuario_responsable=asesor,
            nombre_cartera=nombre,
            estado=estado,
            fecha_inicio=timezone.localdate(),
        )
    return cartera


def _agregar_a_lista_negra(cliente, usuario_trigger=None) -> bool:
    """Agrega al cliente a la lista negra si aún no está. Retorna True si se agregó."""
    if ListaNegraCliente.objects.filter(cliente=cliente).exists():
        return False

    lista, _ = ListaNegra.objects.get_or_create(
        id=1,
        defaults={"estado": "activa", "fecha_registro": timezone.now()},
    )
    ListaNegraCliente.objects.create(
        lista_negra=lista,
        cliente=cliente,
        fecha_ingreso=timezone.now(),
    )

    registrar_en_bitacora(
        usuario=usuario_trigger,
        categoria="cliente",
        titulo=f"Lista negra automática – {cliente.nombre_completo}",
        descripcion=(
            f"El cliente {cliente.nombre_completo} fue agregado automáticamente "
            "a la lista negra por mora irrecuperable."
        ),
        detalles={"cliente_id": cliente.id, "dpi": cliente.dpi},
    )

    if cliente.asesor_id:
        Notificacion.objects.create(
            usuario_destino_id=cliente.asesor_id,
            tipo="mora",
            titulo="Cliente en Lista Negra por mora",
            mensaje=(
                f"El cliente {cliente.nombre_completo} fue movido automáticamente "
                "a Lista Negra por mora irrecuperable."
            ),
        )
    return True


# ---------------------------------------------------------------------------
# Lógica principal
# ---------------------------------------------------------------------------

def clasificar_carteras_por_mora(usuario_trigger=None) -> dict:
    """
    Clasifica clientes activos con préstamos desembolsados según su comportamiento
    de pago y los mueve a la cartera correspondiente.

    Retorna un dict con contadores de acciones realizadas.
    """
    from apps.prestamos.models import Cuota, Prestamo  # import local para evitar circular

    today = timezone.localdate()
    summary = {
        "movidos_vencida": 0,
        "movidos_muerta": 0,
        "agregados_lista_negra": 0,
        "errores": [],
    }

    # ── 1. IDs de clientes con cuotas vencidas y saldo pendiente ──────────
    clientes_mora_ids = set(
        Cuota.objects.filter(
            prestamo__fecha_desembolso__isnull=False,
            fecha_vencimiento__lt=today,
            saldo_cuota__gt=0,
            estado_cuota__in=["pendiente", "parcial", "vencida"],
        ).values_list("prestamo__cliente_id", flat=True)
    )

    if not clientes_mora_ids:
        return summary

    # Clientes activos con mora, excluyendo ya muertos
    clientes = (
        Cliente.objects.select_related("asesor", "cartera")
        .filter(id__in=clientes_mora_ids, estado_cliente="activo")
        .exclude(cartera__estado="muerta")
    )

    para_vencida: list[Cliente] = []
    para_muerta: list[Cliente] = []

    # ── 2. Clasificar cada cliente ────────────────────────────────────────
    for cliente in clientes:
        prestamos = Prestamo.objects.filter(
            cliente=cliente,
            fecha_desembolso__isnull=False,
        )

        es_muerta = False

        for prestamo in prestamos:
            cuotas_qs = prestamo.cuotas.all()
            if not cuotas_qs.exists():
                continue

            ultima_fecha = cuotas_qs.aggregate(
                m=Max("fecha_vencimiento")
            )["m"]
            if not ultima_fecha:
                continue

            dias_desde_ultima = (today - ultima_fecha).days
            if dias_desde_ultima <= 0:
                # La última cuota aún no venció → solo puede estar en vencida
                continue

            # Porcentaje pagado del préstamo
            total_monto = cuotas_qs.aggregate(t=Sum("monto_cuota"))["t"] or Decimal("0")
            total_saldo = cuotas_qs.aggregate(t=Sum("saldo_cuota"))["t"] or Decimal("0")

            if total_monto == 0:
                continue

            porcentaje_pagado = ((total_monto - total_saldo) / total_monto) * 100

            # 75 % pagado → 60 días de gracia; menos → solo 30
            dias_limite = 60 if porcentaje_pagado >= 75 else 30

            if dias_desde_ultima > dias_limite:
                es_muerta = True
                break

        if es_muerta:
            para_muerta.append(cliente)
        else:
            para_vencida.append(cliente)

    # ── 3. Mover a Cartera Vencida ────────────────────────────────────────
    with transaction.atomic():
        for cliente in para_vencida:
            if not cliente.asesor_id:
                continue
            try:
                cartera_vencida = _get_or_create_cartera(
                    asesor=cliente.asesor,
                    nombre="Cartera Vencida",
                    estado="vencida",
                )
                if cliente.cartera_id == cartera_vencida.id:
                    continue  # Ya está aquí

                cartera_anterior = (
                    cliente.cartera.nombre_cartera if cliente.cartera else "Sin cartera"
                )
                cliente.cartera = cartera_vencida
                cliente.save(update_fields=["cartera"])

                registrar_en_bitacora(
                    usuario=usuario_trigger,
                    categoria="mora",
                    titulo=f"Cliente → Cartera Vencida – {cliente.nombre_completo}",
                    descripcion=(
                        f"{cliente.nombre_completo} fue movido automáticamente "
                        f'de "{cartera_anterior}" a Cartera Vencida por cuotas vencidas.'
                    ),
                    detalles={
                        "cliente_id": cliente.id,
                        "dpi": cliente.dpi,
                        "cartera_anterior": cartera_anterior,
                    },
                )

                if cliente.asesor_id:
                    Notificacion.objects.create(
                        usuario_destino_id=cliente.asesor_id,
                        tipo="mora",
                        titulo="Cliente con cuotas vencidas",
                        mensaje=(
                            f"El cliente {cliente.nombre_completo} fue movido "
                            "a Cartera Vencida por cuotas sin pagar."
                        ),
                    )

                summary["movidos_vencida"] += 1
            except Exception as exc:
                summary["errores"].append(
                    f"Error moviendo {cliente.nombre_completo} a vencida: {exc}"
                )

    # ── 4. Mover a Cartera Muerta + Lista Negra ───────────────────────────
    with transaction.atomic():
        for cliente in para_muerta:
            if not cliente.asesor_id:
                continue
            try:
                cartera_muerta = _get_or_create_cartera(
                    asesor=cliente.asesor,
                    nombre="Cartera Muerta",
                    estado="muerta",
                )
                cartera_anterior = (
                    cliente.cartera.nombre_cartera if cliente.cartera else "Sin cartera"
                )
                cliente.cartera = cartera_muerta
                cliente.save(update_fields=["cartera"])

                registrar_en_bitacora(
                    usuario=usuario_trigger,
                    categoria="mora",
                    titulo=f"Cliente → Cartera Muerta – {cliente.nombre_completo}",
                    descripcion=(
                        f"{cliente.nombre_completo} fue movido automáticamente "
                        f'de "{cartera_anterior}" a Cartera Muerta por mora irrecuperable.'
                    ),
                    detalles={
                        "cliente_id": cliente.id,
                        "dpi": cliente.dpi,
                        "cartera_anterior": cartera_anterior,
                    },
                )
                summary["movidos_muerta"] += 1

                if _agregar_a_lista_negra(cliente, usuario_trigger=usuario_trigger):
                    summary["agregados_lista_negra"] += 1

            except Exception as exc:
                summary["errores"].append(
                    f"Error moviendo {cliente.nombre_completo} a muerta: {exc}"
                )

    return summary
