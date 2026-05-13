from decimal import Decimal
from typing import Any

from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from django.conf import settings
from apps.clientes.models import Cartera, Cliente
from apps.users.models import Usuario
from apps.pagos.models import Caja, IngresoCaja
from .models import (
    Cuota,
    EvaluacionGarantia,
    FotoGarantia,
    Garantia,
    HojaCuenta,
    Pago,
    PlanPago,
    Prestamo,
)
from apps.pagos.models import Caja, Desembolso, EgresoCaja


class PrestamoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prestamo
        fields = [
            "monto_solicitado",
            "interes",
            "destino_uso",
            "plan",
        ]

    def validate(self, data):
        if self.instance.fecha_desembolso:
            raise serializers.ValidationError("No se puede editar un préstamo ya desembolsado.")
        return data




class PlanPagoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanPago
        fields = [
            "id",
            "nombre_plan",
            "periodicidad",
            "numero_cuotas",
            "interes",
            "mora",
            "monto_base",
            "estado",
        ]


class PlanPagoCreateSerializer(serializers.Serializer):
    nombre_plan = serializers.CharField(max_length=120)
    periodicidad = serializers.CharField(max_length=50)
    numero_cuotas = serializers.IntegerField(min_value=1)
    interes = serializers.DecimalField(max_digits=8, decimal_places=2)
    mora = serializers.DecimalField(max_digits=8, decimal_places=2)
    monto_base = serializers.DecimalField(max_digits=12, decimal_places=2)
    estado = serializers.CharField(max_length=30, required=False, default="vigente")

    def create(self, validated_data):
        return PlanPago.objects.create(**validated_data)


class GarantiaPhotoUploadSerializer(serializers.Serializer):
    archivo = serializers.FileField(required=True)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    es_principal = serializers.BooleanField(required=False, default=False)

    def save(self, **kwargs):
        from config.storage_backends import GarantiasStorage
        storage = GarantiasStorage()
        archivo = self.validated_data["archivo"]
        filename = storage.save(archivo.name, archivo)
        ruta_archivo = storage.url(filename)
        return {
            "ruta_archivo": ruta_archivo,
            "descripcion": (self.validated_data.get("descripcion") or "").strip() or None,
            "es_principal": self.validated_data.get("es_principal", False),
        }


class FotoGarantiaSerializer(serializers.ModelSerializer):
    ruta_archivo = serializers.SerializerMethodField()

    class Meta:
        model = FotoGarantia
        fields = [
            "id",
            "ruta_archivo",
            "descripcion",
            "es_principal",
            "fecha_subida",
        ]

    def get_ruta_archivo(self, obj: FotoGarantia):
        value = obj.ruta_archivo
        if not value:
            return None

        # Si ya es una URL completa (S3/Supabase), devolverla tal cual
        if isinstance(value, str) and (value.startswith("http://") or value.startswith("https://") or value.startswith("data:")):
            return value

        request = self.context.get("request")
        media_prefix = settings.MEDIA_URL or "/media/"
        
        # Construir ruta relativa limpia
        clean_path = str(value).lstrip('/')
        if not clean_path.startswith("media/"):
             # Si no tiene el prefijo de media en el string, aseguramos que esté en el path final
             full_path = f"{media_prefix}{clean_path}"
        else:
             # Si ya lo tiene, solo aseguramos el leading slash si es para absolute_uri
             full_path = f"/{clean_path}"

        return request.build_absolute_uri(full_path) if request else full_path


class EvaluacionGarantiaSerializer(serializers.ModelSerializer):
    usuario_evalua_nombre = serializers.SerializerMethodField()

    class Meta:
        model = EvaluacionGarantia
        fields = [
            "id",
            "fecha_evaluacion",
            "resultado",
            "valor_aceptado",
            "observaciones",
            "usuario_evalua_nombre",
        ]

    def get_usuario_evalua_nombre(self, obj: EvaluacionGarantia):
        if not obj.usuario_evalua_id:
            return None
        return obj.usuario_evalua.full_name


class GarantiaListSerializer(serializers.ModelSerializer):
    fotos = serializers.SerializerMethodField()
    evaluaciones = EvaluacionGarantiaSerializer(many=True, read_only=True)

    class Meta:
        model = Garantia
        fields = [
            "id",
            "tipo_garantia",
            "descripcion",
            "valor_estimado",
            "estado_garantia",
            "fecha_registro",
            "observaciones",
            "fotos",
            "evaluaciones",
        ]

    def get_fotos(self, obj: Garantia):
        queryset = obj.fotos.all()
        return FotoGarantiaSerializer(
            queryset,
            many=True,
            context=self.context,
        ).data


class CuotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuota
        fields = [
            "id",
            "numero_cuota",
            "fecha_vencimiento",
            "monto_cuota",
            "saldo_cuota",
            "mora_generada",
            "estado_cuota",
        ]


class PagoSerializer(serializers.ModelSerializer):
    usuario_registra_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Pago
        fields = [
            "id",
            "fecha_pago",
            "monto_pagado",
            "tipo_pago",
            "estado",
            "observaciones",
            "usuario_registra_nombre",
        ]

    def get_usuario_registra_nombre(self, obj: Pago):
        if not obj.usuario_registra_id:
            return None
        return obj.usuario_registra.full_name


class HojaCuentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = HojaCuenta
        fields = [
            "id",
            "fecha_registro",
            "detalle",
            "saldo_actual",
        ]


class PrestamoListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    cliente_dpi = serializers.SerializerMethodField()
    plan_nombre = serializers.SerializerMethodField()
    periodicidad = serializers.SerializerMethodField()
    numero_cuotas = serializers.SerializerMethodField()
    estado_flujo = serializers.SerializerMethodField()

    class Meta:
        model = Prestamo
        fields = [
            "id",
            "cliente_nombre",
            "cliente_dpi",
            "plan_nombre",
            "periodicidad",
            "numero_cuotas",
            "monto_solicitado",
            "interes",
            "destino_uso",
            "fecha_solicitud",
            "fecha_aprobacion",
            "fecha_desembolso",
            "estado_flujo",
        ]

    def get_cliente_nombre(self, obj: Prestamo):
        return obj.cliente.nombre_completo

    def get_cliente_dpi(self, obj: Prestamo):
        return obj.cliente.dpi

    def get_plan_nombre(self, obj: Prestamo):
        return obj.plan.nombre_plan if obj.plan_id else None

    def get_periodicidad(self, obj: Prestamo):
        return obj.plan.periodicidad if obj.plan_id else None

    def get_numero_cuotas(self, obj: Prestamo):
        return obj.plan.numero_cuotas if obj.plan_id else None

    def get_estado_flujo(self, obj: Prestamo):
        if obj.fecha_desembolso:
            # Revisar si el saldo ya llegó a 0
            ultimo_mov = obj.movimientos_hoja_cuenta.order_by("-id").first()
            if ultimo_mov and ultimo_mov.saldo_actual <= 0:
                return "finalizado"
            return "desembolsado"
        if obj.fecha_aprobacion:
            return "aprobado_pendiente_desembolso"
        return "pendiente_aprobacion"


class PrestamoDetailSerializer(PrestamoListSerializer):
    cuotas = CuotaSerializer(many=True, read_only=True)
    pagos = PagoSerializer(many=True, read_only=True)
    hoja_cuenta = serializers.SerializerMethodField()
    garantias = serializers.SerializerMethodField()
    admin_aprobador_nombre = serializers.SerializerMethodField()
    cliente_telefono = serializers.SerializerMethodField()
    monto_total = serializers.SerializerMethodField()
    mora = serializers.SerializerMethodField()
    cliente_informacion_laboral = serializers.SerializerMethodField()
    cliente_fotos = serializers.SerializerMethodField()

    class Meta(PrestamoListSerializer.Meta):
        fields = PrestamoListSerializer.Meta.fields + [
            "admin_aprobador_nombre",
            "cuotas",
            "pagos",
            "hoja_cuenta",
            "garantias",
            "cliente_telefono",
            "monto_total",
            "mora",
            "cliente_informacion_laboral",
            "cliente_fotos",
        ]
    
    def get_cliente_telefono(self, obj):
        telefono = obj.cliente.telefonos.first()
        return telefono.numero if telefono else None


    def get_monto_total(self, obj):
        monto = obj.monto_solicitado or 0
        interes = obj.interes or 0
        return monto + (monto * interes / 100)


    def get_mora(self, obj):
        if obj.plan:
            return obj.plan.mora
        return None

    def get_admin_aprobador_nombre(self, obj: Prestamo):
        if not obj.admin_aprobador_id:
            return None
        return obj.admin_aprobador.full_name

    def get_hoja_cuenta(self, obj: Prestamo):
        movimientos = obj.movimientos_hoja_cuenta.all().order_by("-id")
        return HojaCuentaSerializer(movimientos, many=True).data

    def get_garantias(self, obj: Prestamo):
        queryset = obj.garantias.all()
        return GarantiaListSerializer(
            queryset,
            many=True,
            context=self.context,
        ).data

    def get_cliente_informacion_laboral(self, obj: Prestamo):
        from apps.clientes.serializers import ClienteDetailSerializer
        serializer = ClienteDetailSerializer(obj.cliente, context=self.context)
        return serializer.get_informacion_laboral(obj.cliente)

    def get_cliente_fotos(self, obj: Prestamo):
        from apps.clientes.serializers import ClienteDetailSerializer
        serializer = ClienteDetailSerializer(obj.cliente, context=self.context)
        return serializer.get_fotos(obj.cliente)


class GarantiaFotoInputSerializer(serializers.Serializer):
    ruta_archivo = serializers.CharField()
    descripcion = serializers.CharField(required=False, allow_blank=True)
    es_principal = serializers.BooleanField(required=False, default=False)


class GarantiaInputSerializer(serializers.Serializer):
    tipo_garantia = serializers.CharField(max_length=80)
    descripcion = serializers.CharField()
    valor_estimado = serializers.DecimalField(max_digits=12, decimal_places=2)
    estado_garantia = serializers.CharField(max_length=30)
    observaciones = serializers.CharField(required=False, allow_blank=True)
    fotos = GarantiaFotoInputSerializer(many=True, required=False)


class PrestamoCreateSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField()
    plan_id = serializers.IntegerField(required=False, allow_null=True)

    periodicidad = serializers.CharField(max_length=50, required=False, allow_blank=True)
    numero_cuotas = serializers.IntegerField(required=False, min_value=1)
    mora = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        required=False,
        default=Decimal("0.00"),
    )

    monto_solicitado = serializers.DecimalField(max_digits=12, decimal_places=2)
    interes = serializers.DecimalField(max_digits=8, decimal_places=2)
    destino_uso = serializers.CharField(required=False, allow_blank=True)

    garantias = GarantiaInputSerializer(many=True, required=False)

    def validate_cliente_id(self, value: int):
        if not Cliente.objects.filter(pk=value).exists():
            raise serializers.ValidationError("El cliente no existe.")
        return value

    def validate(self, attrs: dict[str, Any]):
        plan_id = attrs.get("plan_id")
        periodicidad = (attrs.get("periodicidad") or "").strip()
        numero_cuotas = attrs.get("numero_cuotas")

        if not plan_id and (not periodicidad or not numero_cuotas):
            raise serializers.ValidationError(
                "Debes enviar plan_id o bien periodicidad y numero_cuotas."
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        cliente_id = validated_data["cliente_id"]
        plan_id = validated_data.get("plan_id")
        periodicidad = (validated_data.get("periodicidad") or "").strip()
        numero_cuotas = validated_data.get("numero_cuotas")
        mora = validated_data.get("mora", Decimal("0.00"))
        monto_solicitado = validated_data["monto_solicitado"]
        interes = validated_data["interes"]
        destino_uso = (validated_data.get("destino_uso") or "").strip()
        garantias_data = validated_data.get("garantias", [])

        if plan_id:
          plan = PlanPago.objects.get(pk=plan_id)
        else:
            nombre_plan = f"Plan {periodicidad.title()} {numero_cuotas}"
            plan, _ = PlanPago.objects.get_or_create(
                nombre_plan=nombre_plan,
                periodicidad=periodicidad,
                numero_cuotas=numero_cuotas,
                interes=interes,
                mora=mora,
                monto_base=monto_solicitado,
                defaults={"estado": "vigente"},
            )

        prestamo = Prestamo.objects.create(
            cliente_id=cliente_id,
            plan=plan,
            admin_aprobador=None,
            monto_solicitado=monto_solicitado,
            interes=interes,
            destino_uso=destino_uso or None,
            fecha_solicitud=timezone.localdate(),
            fecha_aprobacion=None,
            fecha_desembolso=None,
        )

        for garantia_data in garantias_data:
            fotos_data = garantia_data.pop("fotos", [])
            garantia = Garantia.objects.create(
                prestamo=prestamo,
                tipo_garantia=garantia_data["tipo_garantia"],
                descripcion=garantia_data["descripcion"],
                valor_estimado=garantia_data["valor_estimado"],
                estado_garantia=garantia_data["estado_garantia"],
                fecha_registro=timezone.now(),
                observaciones=(garantia_data.get("observaciones") or "").strip() or None,
            )

            for foto_data in fotos_data:
                ruta_archivo = (foto_data.get("ruta_archivo") or "").strip()
                if not ruta_archivo:
                    continue

                if not ruta_archivo.startswith("/") and not ruta_archivo.startswith("http"):
                    ruta_archivo = f"/media/garantias/{ruta_archivo}"

                FotoGarantia.objects.create(
                    garantia=garantia,
                    ruta_archivo=ruta_archivo,
                    descripcion=(foto_data.get("descripcion") or "").strip() or None,
                    es_principal=foto_data.get("es_principal", False),
                    fecha_subida=timezone.now(),
                )

        return prestamo


class PrestamoAprobacionSerializer(serializers.Serializer):
    observaciones = serializers.CharField(required=False, allow_blank=True)

    @transaction.atomic
    def save(self, **kwargs):
        prestamo: Prestamo = self.context["prestamo"]
        user: Usuario = self.context["user"]

        cliente = prestamo.cliente
        asesor = cliente.asesor

        cartera_principal = None

        if asesor:
            cartera_principal = (
                Cartera.objects.filter(
                    usuario_responsable=asesor,
                    nombre_cartera__iexact="Cartera Principal",
                )
                .order_by("id")
                .first()
            )

            if not cartera_principal:
                cartera_principal = Cartera.objects.create(
                    usuario_responsable=asesor,
                    nombre_cartera="Cartera Principal",
                    estado="activa",
                    fecha_inicio=timezone.localdate(),
                )

            if cliente.cartera_id != cartera_principal.id or cliente.estado_cliente != "activo":
                cliente.cartera = cartera_principal
                cliente.estado_cliente = "activo"
                cliente.save(update_fields=["cartera", "estado_cliente"])

        prestamo.admin_aprobador = user
        prestamo.fecha_aprobacion = timezone.localdate()
        prestamo.save(
            update_fields=[
                "admin_aprobador",
                "fecha_aprobacion",
            ]
        )
        return prestamo


class PrestamoDesembolsoSerializer(serializers.Serializer):
    observaciones = serializers.CharField(required=False, allow_blank=True)

    @transaction.atomic
    def save(self, **kwargs):
        prestamo: Prestamo = self.context["prestamo"]
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Check caja balance
        caja = Caja.objects.first()
        if not caja:
            raise serializers.ValidationError({"detail": "No se encontró caja fuerte configurada."})

        if caja.saldo_actual < prestamo.monto_solicitado:
            raise serializers.ValidationError({"detail": "Fondos insuficientes en caja fuerte para este desembolso."})

        prestamo.fecha_desembolso = timezone.localdate()
        prestamo.save(update_fields=["fecha_desembolso"])

        # Update Caja and register Desembolso
        caja.saldo_actual -= prestamo.monto_solicitado
        caja.save(update_fields=["saldo_actual"])

        desembolso = Desembolso.objects.create(
            prestamo=prestamo,
            usuario_entrega=user,
            monto_desembolsado=prestamo.monto_solicitado,
            metodo_desembolso="efectivo",
            observaciones=self.validated_data.get("observaciones", "")
        )

        EgresoCaja.objects.create(
            caja=caja,
            usuario_registra=user,
            desembolso=desembolso,
            tipo_egreso="Desembolso de Préstamo",
            monto=prestamo.monto_solicitado,
            descripcion=f"Desembolso para préstamo #{prestamo.id} - {prestamo.cliente.nombre_completo}"
        )

        # ── Generar cuotas del préstamo ─────────────────────────────────
        self._crear_cuotas(prestamo)

        return prestamo

    # ------------------------------------------------------------------
    @staticmethod
    def _add_period(fecha, periodicidad: str, n: int):
        """Devuelve fecha + n períodos según la periodicidad del plan."""
        from datetime import timedelta
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
        day   = min(fecha.day, calendar.monthrange(year, month)[1])
        return fecha.replace(year=year, month=month, day=day)

    def _crear_cuotas(self, prestamo: Prestamo):
        """Crea el calendario de cuotas para el préstamo recién desembolsado."""
        plan = prestamo.plan
        if not plan:
            return

        num_cuotas = plan.numero_cuotas
        if not num_cuotas or num_cuotas <= 0:
            return

        # Monto total = capital + interés
        monto_total = prestamo.monto_solicitado * (
            Decimal("1") + prestamo.interes / Decimal("100")
        )
        cuota_base = (monto_total / Decimal(num_cuotas)).quantize(Decimal("0.01"))

        # Eliminar cuotas anteriores por si acaso
        Cuota.objects.filter(prestamo=prestamo).delete()

        periodicidad = plan.periodicidad or "mensual"
        # El primer pago es exactamente al mes del desembolso
        fecha_primera_cuota = self._add_period(prestamo.fecha_desembolso, "mensual", 1)

        cuotas = []
        for i in range(1, num_cuotas + 1):
            if i == 1:
                fecha_vencimiento = fecha_primera_cuota
            else:
                # Las siguientes cuotas se calculan a partir de la primera
                fecha_vencimiento = self._add_period(fecha_primera_cuota, periodicidad, i - 1)
            
            cuotas.append(
                Cuota(
                    plan=plan,
                    prestamo=prestamo,
                    numero_cuota=i,
                    fecha_vencimiento=fecha_vencimiento,
                    monto_cuota=cuota_base,
                    saldo_cuota=cuota_base,
                    mora_generada=Decimal("0.00"),
                    estado_cuota="pendiente",
                )
            )
        Cuota.objects.bulk_create(cuotas)


class PagoCreateSerializer(serializers.Serializer):
    prestamo_id = serializers.IntegerField()
    monto_pagado = serializers.DecimalField(max_digits=12, decimal_places=2)
    tipo_pago = serializers.CharField(max_length=50)
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate_prestamo_id(self, value: int):
        if not Prestamo.objects.filter(pk=value).exists():
            raise serializers.ValidationError("El préstamo no existe.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        prestamo = Prestamo.objects.select_related("plan").get(
            pk=validated_data["prestamo_id"]
        )
        monto_pagado: Decimal = validated_data["monto_pagado"]

        pago = Pago.objects.create(
            prestamo=prestamo,
            usuario_registra=user,
            fecha_pago=timezone.now(),
            monto_pagado=monto_pagado,
            tipo_pago=validated_data["tipo_pago"],
            estado="pendiente_validacion",
            observaciones=(validated_data.get("observaciones") or "").strip() or None,
        )

        # ── Actualizar Hoja de Cuenta ───────────────────────────────────
        ultimo_saldo = (
            prestamo.movimientos_hoja_cuenta.order_by("-id")
            .values_list("saldo_actual", flat=True)
            .first()
        )
        if ultimo_saldo is not None:
            saldo_base = Decimal(ultimo_saldo)
        else:
            interes_monto = prestamo.monto_solicitado * (prestamo.interes / Decimal("100"))
            saldo_base = prestamo.monto_solicitado + interes_monto

        saldo_actual = saldo_base - monto_pagado

        HojaCuenta.objects.create(
            prestamo=prestamo,
            pago=pago,
            fecha_registro=timezone.now(),
            detalle=f"Pago registrado: {validated_data['tipo_pago']}",
            saldo_actual=saldo_actual,
        )

        # ── Aplicar pago a cuotas ───────────────────────────────────────
        self._aplicar_a_cuotas(prestamo, monto_pagado)

        return pago

    # ------------------------------------------------------------------
    @staticmethod
    def _aplicar_a_cuotas(prestamo: Prestamo, monto_pagado: Decimal):
        """
        Distribuye el monto pagado contra las cuotas pendientes ordenadas
        por número de cuota (FIFO).  Reglas:
          - Si la cuota queda saldada → estado_cuota = 'pagada'.
          - Si la cuota queda parcialmente saldada → estado_cuota = 'parcial',
            y a la siguiente cuota se le suma el saldo restante MÁS la mora
            (mora% × cuota_base).
          - Mora siempre se calcula sobre cuota_base (monto original por cuota),
            no sobre el saldo restante.
        """
        plan = prestamo.plan
        if not plan:
            return

        # Cuota base original (sin mora acumulada)
        monto_total = prestamo.monto_solicitado * (
            Decimal("1") + prestamo.interes / Decimal("100")
        )
        cuota_base = (monto_total / Decimal(plan.numero_cuotas)).quantize(
            Decimal("0.01")
        )
        mora_pct = plan.mora / Decimal("100")

        cuotas = list(
            Cuota.objects.filter(
                prestamo=prestamo,
                estado_cuota__in=["pendiente", "parcial", "vencida"],
            ).order_by("numero_cuota")
        )

        restante = monto_pagado

        for idx, cuota in enumerate(cuotas):
            if restante <= Decimal("0"):
                break

            if restante >= cuota.saldo_cuota:
                # Pago completo de esta cuota
                restante -= cuota.saldo_cuota
                cuota.saldo_cuota = Decimal("0")
                cuota.estado_cuota = "pagada"
                cuota.save(update_fields=["saldo_cuota", "estado_cuota"])
            else:
                # Pago parcial: saldo pendiente + mora van a la siguiente cuota
                saldo_pendiente = cuota.saldo_cuota - restante
                mora_generada  = cuota_base * mora_pct  # siempre sobre cuota_base

                cuota.saldo_cuota   = Decimal("0")
                cuota.mora_generada = mora_generada
                cuota.estado_cuota  = "parcial"
                cuota.save(
                    update_fields=["saldo_cuota", "mora_generada", "estado_cuota"]
                )

                # Sumar saldo + mora a la siguiente cuota pendiente
                prox = cuotas[idx + 1] if idx + 1 < len(cuotas) else None
                if prox is None:
                    prox = (
                        Cuota.objects.filter(
                            prestamo=prestamo,
                            numero_cuota__gt=cuota.numero_cuota,
                            estado_cuota__in=["pendiente", "parcial"],
                        )
                        .order_by("numero_cuota")
                        .first()
                    )

                if prox:
                    prox.monto_cuota += saldo_pendiente + mora_generada
                    prox.saldo_cuota += saldo_pendiente + mora_generada
                    prox.save(update_fields=["monto_cuota", "saldo_cuota"])

                restante = Decimal("0")


class LoanSimulationSerializer(serializers.Serializer):
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    interes = serializers.DecimalField(max_digits=8, decimal_places=2, required=True)
    mora = serializers.DecimalField(max_digits=8, decimal_places=2, required=True)
    numero_cuotas = serializers.IntegerField(required=True)

    def validate_monto(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor que 0.")
        return value

    def validate_interes(self, value):
        if value <= 0:
            raise serializers.ValidationError("El interés debe ser mayor que 0.")
        return value

    def validate_mora(self, value):
        if value <= 0:
            raise serializers.ValidationError("La mora debe ser mayor que 0.")
        return value

    def validate_numero_cuotas(self, value):
        if value <= 0:
            raise serializers.ValidationError("El número de cuotas debe ser mayor que 0.")
        return value

    def validate(self, attrs):
        for campo in ("monto", "interes", "mora", "numero_cuotas"):
            valor = attrs.get(campo)
            if valor is None or valor == "":
                raise serializers.ValidationError(
                    {campo: "Este campo es obligatorio."}
                )
        return attrs