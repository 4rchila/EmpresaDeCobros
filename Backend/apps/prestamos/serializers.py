from decimal import Decimal
from typing import Any

from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.clientes.models import Cartera, Cliente
from apps.users.models import Usuario
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
        archivo = self.validated_data["archivo"]
        filename = default_storage.save(f"garantias/{archivo.name}", archivo)
        ruta_archivo = default_storage.url(filename)
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
        path = obj.ruta_archivo
        if not path:
            return None

        if path.startswith("http://") or path.startswith("https://"):
            return path

        request = self.context.get("request")
        if request and path.startswith("/"):
            return request.build_absolute_uri(path)

        return path


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

            if cliente.cartera_id != cartera_principal.id:
                cliente.cartera = cartera_principal
                cliente.save(update_fields=["cartera"])

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

        prestamo.fecha_desembolso = timezone.localdate()
        prestamo.save(update_fields=["fecha_desembolso"])
        return prestamo


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

        prestamo = Prestamo.objects.get(pk=validated_data["prestamo_id"])

        pago = Pago.objects.create(
            prestamo=prestamo,
            usuario_registra=user,
            fecha_pago=timezone.now(),
            monto_pagado=validated_data["monto_pagado"],
            tipo_pago=validated_data["tipo_pago"],
            estado="registrado",
            observaciones=(validated_data.get("observaciones") or "").strip() or None,
        )

        ultimo_saldo = (
            prestamo.movimientos_hoja_cuenta.order_by("-id")
            .values_list("saldo_actual", flat=True)
            .first()
        )
        saldo_base = ultimo_saldo if ultimo_saldo is not None else prestamo.monto_solicitado
        saldo_actual = Decimal(saldo_base) - validated_data["monto_pagado"]

        HojaCuenta.objects.create(
            prestamo=prestamo,
            pago=pago,
            fecha_registro=timezone.now(),
            detalle=f"Pago registrado: {validated_data['tipo_pago']}",
            saldo_actual=saldo_actual,
        )

        return pago


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