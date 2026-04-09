from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.users.models import Usuario
from .models import (
    Acreedor,
    Cartera,
    FotoAcreedor,
    InformacionLaboral,
    InformeNuevoCliente,
    ListaNegra,
    ListaNegraAcreedor,
    ReferenciaAcreedor,
    TelefonoAcreedor,
)


class ReferenciaInputSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=150)
    apellidos = serializers.CharField(max_length=150, required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    parentesco = serializers.CharField(max_length=100, required=False, allow_blank=True)
    direccion = serializers.CharField(required=False, allow_blank=True)


class AcreedorCreateSerializer(serializers.Serializer):
    # Información personal
    nombres = serializers.CharField(max_length=100)
    apellidos = serializers.CharField(max_length=100)
    dpi = serializers.CharField(max_length=25)
    nit = serializers.CharField(max_length=25, required=False, allow_blank=True)
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)

    # Teléfonos
    telefono_principal = serializers.CharField(max_length=20)
    telefono_secundario = serializers.CharField(max_length=20, required=False, allow_blank=True)
    telefono_trabajo = serializers.CharField(max_length=20, required=False, allow_blank=True)

    # Ubicación
    direccion = serializers.CharField()
    departamento = serializers.CharField(max_length=100)
    municipio = serializers.CharField(max_length=100)
    distrito = serializers.CharField(max_length=100)

    # Laboral / financiera
    lugar_trabajo = serializers.CharField(max_length=150, required=False, allow_blank=True)
    direccion_trabajo = serializers.CharField(required=False, allow_blank=True)
    puesto = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tiempo_laborando = serializers.CharField(max_length=100, required=False, allow_blank=True)
    ingresos_mensuales = serializers.DecimalField(max_digits=12, decimal_places=2)
    egreso_aproximado_mensual = serializers.DecimalField(max_digits=12, decimal_places=2)
    otras_fuentes_ingreso = serializers.CharField(required=False, allow_blank=True)

    # Archivos/rutas
    foto_vivienda = serializers.CharField(required=False, allow_blank=True)
    foto_recibo_luz = serializers.CharField(required=False, allow_blank=True)

    # Extras
    cartera_id = serializers.IntegerField(required=False, allow_null=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)
    referencias = ReferenciaInputSerializer(many=True)

    def validate_dpi(self, value: str) -> str:
        value = value.strip()
        if Acreedor.objects.filter(dpi=value).exists():
            raise serializers.ValidationError("Ya existe un acreedor con ese DPI.")
        return value

    def validate_referencias(self, value):
        if not value:
            raise serializers.ValidationError("Debes enviar al menos una referencia.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        referencias_data = validated_data.pop("referencias", [])
        cartera_id = validated_data.pop("cartera_id", None)
        observaciones = validated_data.pop("observaciones", "")
        telefono_principal = validated_data.pop("telefono_principal")
        telefono_secundario = validated_data.pop("telefono_secundario", "")
        telefono_trabajo = validated_data.pop("telefono_trabajo", "")
        foto_vivienda = validated_data.pop("foto_vivienda", "")
        foto_recibo_luz = validated_data.pop("foto_recibo_luz", "")

        request = self.context.get("request")
        current_user = getattr(request, "user", None)

        cartera = None
        if cartera_id:
            cartera = Cartera.objects.filter(pk=cartera_id).first()

        asesor = current_user if isinstance(current_user, Usuario) else None

        now = timezone.now()

        acreedor = Acreedor.objects.create(
            cartera=cartera,
            asesor=asesor,
            nombres=validated_data["nombres"].strip(),
            apellidos=validated_data["apellidos"].strip(),
            dpi=validated_data["dpi"].strip(),
            nit=validated_data.get("nit", "").strip() or None,
            direccion=validated_data["direccion"].strip(),
            municipio=validated_data["municipio"].strip(),
            distrito=validated_data["distrito"].strip(),
            departamento=validated_data["departamento"].strip(),
            ingresos_mensuales=validated_data["ingresos_mensuales"],
            egreso_aproximado_mensual=validated_data["egreso_aproximado_mensual"],
            fecha_nacimiento=validated_data.get("fecha_nacimiento"),
            fecha_registro=now,
            estado_cliente="activo",
        )

        TelefonoAcreedor.objects.create(
            acreedor=acreedor,
            numero=telefono_principal.strip(),
            orden=1,
            tipo="principal",
        )

        if telefono_secundario and telefono_secundario.strip():
            TelefonoAcreedor.objects.create(
                acreedor=acreedor,
                numero=telefono_secundario.strip(),
                orden=2,
                tipo="secundario",
            )

        if telefono_trabajo and telefono_trabajo.strip():
            TelefonoAcreedor.objects.create(
                acreedor=acreedor,
                numero=telefono_trabajo.strip(),
                orden=3,
                tipo="trabajo",
            )

        InformacionLaboral.objects.create(
            acreedor=acreedor,
            lugar_trabajo=validated_data.get("lugar_trabajo", "").strip() or None,
            direccion_trabajo=validated_data.get("direccion_trabajo", "").strip() or None,
            puesto=validated_data.get("puesto", "").strip() or None,
            tiempo_laborando=validated_data.get("tiempo_laborando", "").strip() or None,
            ingreso_mensual=validated_data["ingresos_mensuales"],
            egreso_mensual=validated_data["egreso_aproximado_mensual"],
            otras_fuentes_ingreso=validated_data.get("otras_fuentes_ingreso", "").strip() or None,
            foto_recibo_luz=foto_recibo_luz.strip() or None,
        )

        if foto_vivienda and foto_vivienda.strip():
            FotoAcreedor.objects.create(
                acreedor=acreedor,
                ruta_archivo=foto_vivienda.strip(),
                descripcion="foto_vivienda",
            )

        for referencia in referencias_data:
            nombre_ref = f"{referencia.get('nombres', '').strip()} {referencia.get('apellidos', '').strip()}".strip()
            ReferenciaAcreedor.objects.create(
                acreedor=acreedor,
                nombres=nombre_ref,
                telefono=referencia.get("telefono", "").strip() or None,
                parentesco=referencia.get("parentesco", "").strip() or None,
                direccion=referencia.get("direccion", "").strip() or None,
            )

        if isinstance(current_user, Usuario):
            InformeNuevoCliente.objects.create(
                acreedor=acreedor,
                usuario_creador=current_user,
                fecha_generacion=now,
                observaciones=observaciones.strip() or None,
                estado_revision="pendiente",
            )

        return acreedor


class AcreedorListSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(read_only=True)
    telefonos = serializers.SerializerMethodField()
    en_lista_negra = serializers.SerializerMethodField()
    asesor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Acreedor
        fields = [
            "id",
            "nombre_completo",
            "nombres",
            "apellidos",
            "dpi",
            "nit",
            "direccion",
            "municipio",
            "distrito",
            "departamento",
            "estado_cliente",
            "fecha_registro",
            "telefonos",
            "en_lista_negra",
            "asesor_nombre",
        ]

    def get_telefonos(self, obj: Acreedor):
        return list(
            obj.telefonos.order_by("orden").values("id", "numero", "orden", "tipo")
        )

    def get_en_lista_negra(self, obj: Acreedor) -> bool:
        return obj.registros_lista_negra.exists()

    def get_asesor_nombre(self, obj: Acreedor):
        if obj.asesor_id:
            return obj.asesor.full_name
        return None


class AcreedorDetailSerializer(AcreedorListSerializer):
    informacion_laboral = serializers.SerializerMethodField()
    referencias = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()

    class Meta(AcreedorListSerializer.Meta):
        fields = AcreedorListSerializer.Meta.fields + [
            "ingresos_mensuales",
            "egreso_aproximado_mensual",
            "fecha_nacimiento",
            "informacion_laboral",
            "referencias",
            "fotos",
        ]

    def get_informacion_laboral(self, obj: Acreedor):
        info = getattr(obj, "informacion_laboral", None)
        if not info:
            return None

        return {
            "lugar_trabajo": info.lugar_trabajo,
            "direccion_trabajo": info.direccion_trabajo,
            "puesto": info.puesto,
            "tiempo_laborando": info.tiempo_laborando,
            "ingreso_mensual": str(info.ingreso_mensual),
            "egreso_mensual": str(info.egreso_mensual),
            "otras_fuentes_ingreso": info.otras_fuentes_ingreso,
            "foto_recibo_luz": info.foto_recibo_luz,
        }

    def get_referencias(self, obj: Acreedor):
        return list(
            obj.referencias.values("id", "nombres", "telefono", "parentesco", "direccion")
        )

    def get_fotos(self, obj: Acreedor):
        return list(
            obj.fotos.values("id", "ruta_archivo", "descripcion")
        )


class AcreedorSearchSerializer(serializers.Serializer):
    q = serializers.CharField()


class ListaNegraAddSerializer(serializers.Serializer):
    acreedor_id = serializers.IntegerField()

    def validate_acreedor_id(self, value: int) -> int:
        if not Acreedor.objects.filter(pk=value).exists():
            raise serializers.ValidationError("El acreedor no existe.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        acreedor = Acreedor.objects.get(pk=validated_data["acreedor_id"])
        lista, _ = ListaNegra.objects.get_or_create(
            id=1,
            defaults={
                "estado": "activa",
                "fecha_registro": timezone.now(),
            },
        )

        registro, _ = ListaNegraAcreedor.objects.get_or_create(
            lista_negra=lista,
            acreedor=acreedor,
            defaults={"fecha_ingreso": timezone.now()},
        )
        return registro


class ListaNegraItemSerializer(serializers.ModelSerializer):
    acreedor = AcreedorListSerializer(read_only=True)

    class Meta:
        model = ListaNegraAcreedor
        fields = ["id", "fecha_ingreso", "acreedor"]