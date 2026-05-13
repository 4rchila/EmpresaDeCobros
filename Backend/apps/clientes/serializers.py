from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
import re
from django.conf import settings

from apps.users.models import Usuario
from apps.prestamos.models import Prestamo
from apps.prestamos.serializers import GarantiaListSerializer
from .models import (
    Cartera,
    Cliente,
    FotoCliente,
    InformacionLaboral,
    InformeNuevoCliente,
    ListaNegra,
    ListaNegraCliente,
    ReferenciaCliente,
    TelefonoCliente,
)


class ClientePhotoUploadSerializer(serializers.Serializer):
    archivo = serializers.FileField(required=True)
    descripcion = serializers.CharField(required=False, allow_blank=True)

    def save(self, **kwargs):
        from config.storage_backends import ClientesStorage
        storage = ClientesStorage()
        archivo = self.validated_data["archivo"]
        # Usar timestamp para evitar colisiones de nombres
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        name = f"{timestamp}_{archivo.name}"
        filename = storage.save(name, archivo)
        ruta_archivo = storage.url(filename)
        return {
            "ruta_archivo": ruta_archivo,
            "descripcion": (self.validated_data.get("descripcion") or "").strip() or None,
        }


class ClienteUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = [
            "nombres",
            "apellidos",
            "dpi",
            "nit",
            "direccion",
            "municipio",
            "distrito",
            "departamento",
            "fecha_nacimiento",
            "ingresos_mensuales",
            "egreso_aproximado_mensual",
            "estado_cliente",
        ]

    def validate_dpi(self, value):
        value = re.sub(r"\D", "", value or "")
        if len(value) != 13:
            raise serializers.ValidationError("El DPI debe contener exactamente 13 dígitos.")
        
        # Validar unicidad excluyendo al cliente actual
        if Cliente.objects.filter(dpi=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Ya existe un cliente con ese DPI.")
        return value

    def validate_nit(self, value):
        if not value or not value.strip():
            return None
        cleaned = re.sub(r"\s+", "", value)
        if not re.fullmatch(r"[A-Za-z0-9]{1,13}", cleaned):
             raise serializers.ValidationError("El NIT debe ser alfanumérico.")
        return cleaned



class ReferenciaInputSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=150)
    apellidos = serializers.CharField(max_length=150, required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    parentesco = serializers.CharField(max_length=100, required=False, allow_blank=True)
    direccion = serializers.CharField(required=False, allow_blank=True)

    def _contains_digit(self, s: str) -> bool:
        return bool(re.search(r'\d', s or ''))

    def validate_nombres(self, value: str) -> str:
        if self._contains_digit(value):
            raise serializers.ValidationError("El nombre de la referencia no puede contener números.")
        return value.strip()

    def validate_apellidos(self, value: str) -> str:
        if value and self._contains_digit(value):
            raise serializers.ValidationError("Los apellidos de la referencia no pueden contener números.")
        return value.strip()

    def validate_parentesco(self, value: str) -> str:
        if value and self._contains_digit(value):
            raise serializers.ValidationError("El parentesco no puede contener números.")
        return value.strip()

    def validate_telefono(self, value: str) -> str:
        if value:
            digits = re.sub(r'\D', '', value)
            if len(digits) != 8:
                raise serializers.ValidationError("El teléfono debe contener exactamente 8 dígitos.")
            return digits
        return value


class ClienteCreateSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=100)
    apellidos = serializers.CharField(max_length=100)
    dpi = serializers.CharField(max_length=25)
    nit = serializers.CharField(max_length=25, required=False, allow_blank=True)
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)

    telefono_principal = serializers.CharField(max_length=20)
    telefono_secundario = serializers.CharField(max_length=20, required=False, allow_blank=True)
    telefono_trabajo = serializers.CharField(max_length=20, required=False, allow_blank=True)

    direccion = serializers.CharField()
    departamento = serializers.CharField(max_length=100)
    municipio = serializers.CharField(max_length=100)
    distrito = serializers.CharField(max_length=100)

    lugar_trabajo = serializers.CharField(max_length=150, required=False, allow_blank=True)
    direccion_trabajo = serializers.CharField(required=False, allow_blank=True)
    puesto = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tiempo_laborando = serializers.CharField(max_length=100, required=False, allow_blank=True)
    ingresos_mensuales = serializers.DecimalField(max_digits=12, decimal_places=2)
    egreso_aproximado_mensual = serializers.DecimalField(max_digits=12, decimal_places=2)
    otras_fuentes_ingreso = serializers.CharField(required=False, allow_blank=True)

    foto_vivienda = serializers.CharField(required=False, allow_blank=True)
    foto_recibo_luz = serializers.CharField(required=False, allow_blank=True)

    cartera_id = serializers.IntegerField(required=False, allow_null=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)
    referencias = ReferenciaInputSerializer(many=True)

    def _contains_digit(self, s: str) -> bool:
        return bool(re.search(r'\d', s or ''))

    def validate_nombres(self, value: str) -> str:
        if self._contains_digit(value):
            raise serializers.ValidationError("El nombre no puede contener números.")
        return value.strip()

    def validate_apellidos(self, value: str) -> str:
        if self._contains_digit(value):
            raise serializers.ValidationError("Los apellidos no pueden contener números.")
        return value.strip()

    def validate_lugar_trabajo(self, value: str) -> str:
        if value and self._contains_digit(value):
            raise serializers.ValidationError("El lugar de trabajo no puede contener números.")
        return value.strip() or None

    def validate_puesto(self, value: str) -> str:
        if value and self._contains_digit(value):
            raise serializers.ValidationError("El puesto no puede contener números.")
        return value.strip() or None

    def validate_dpi(self, value: str) -> str:
        value = re.sub(r'\D', '', value or '')
        if len(value) != 13:
            raise serializers.ValidationError("El DPI debe contener exactamente 13 dígitos.")
        if Cliente.objects.filter(dpi=value).exists():
            raise serializers.ValidationError("Ya existe un cliente con ese DPI.")
        return value

    def validate_nit(self, value: str) -> str:
        # permitir vacío
        if not value or not value.strip():
            return value.strip()
        cleaned = re.sub(r'\s+', '', value or '')
        if not re.fullmatch(r'[A-Za-z0-9]{13}', cleaned):
            raise serializers.ValidationError(
                "El NIT debe contener exactamente 13 caracteres alfanuméricos (sin espacios)."
            )
        return cleaned

    def _validate_phone_field(self, value: str, required: bool = True) -> str:
        if not value:
            if required:
                raise serializers.ValidationError("El teléfono principal es obligatorio y debe tener 8 dígitos.")
            return ''
        digits = re.sub(r'\D', '', value)
        if len(digits) != 8:
            raise serializers.ValidationError("El teléfono debe contener exactamente 8 dígitos.")
        return digits

    def validate_telefono_principal(self, value: str) -> str:
        return self._validate_phone_field(value, required=True)

    def validate_telefono_secundario(self, value: str) -> str:
        # secundario opcional
        if not value:
            return ''
        return self._validate_phone_field(value, required=False)

    def validate_telefono_trabajo(self, value: str) -> str:
        if not value:
            return ''
        return self._validate_phone_field(value, required=False)

    def validate_referencias(self, value):
        if not value:
            raise serializers.ValidationError("Debes enviar al menos una referencia.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        referencias_data = validated_data.pop("referencias", [])
        validated_data.pop("cartera_id", None)  # No se asigna cartera al crear el cliente, se hará al aprobarlo
        observaciones = validated_data.pop("observaciones", "")
        telefono_principal = validated_data.pop("telefono_principal")
        telefono_secundario = validated_data.pop("telefono_secundario", "")
        telefono_trabajo = validated_data.pop("telefono_trabajo", "")
        foto_vivienda = validated_data.pop("foto_vivienda", "")
        foto_recibo_luz = validated_data.pop("foto_recibo_luz", "")

        request = self.context.get("request")
        current_user = getattr(request, "user", None)

        cartera = None
        asesor = current_user if isinstance(current_user, Usuario) else None
        now = timezone.now()

        cliente = Cliente.objects.create(
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
            estado_cliente="inactivo",
        )

        TelefonoCliente.objects.create(
            cliente=cliente,
            numero=telefono_principal.strip(),
            orden=1,
            tipo="principal",
        )

        if telefono_secundario and telefono_secundario.strip():
            TelefonoCliente.objects.create(
                cliente=cliente,
                numero=telefono_secundario.strip(),
                orden=2,
                tipo="secundario",
            )

        if telefono_trabajo and telefono_trabajo.strip():
            TelefonoCliente.objects.create(
                cliente=cliente,
                numero=telefono_trabajo.strip(),
                orden=3,
                tipo="trabajo",
            )

        InformacionLaboral.objects.create(
            cliente=cliente,
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
            FotoCliente.objects.create(
                cliente=cliente,
                ruta_archivo=foto_vivienda.strip(),
                descripcion="foto_vivienda",
            )

        for referencia in referencias_data:
            nombre_ref = f"{referencia.get('nombres', '').strip()} {referencia.get('apellidos', '').strip()}".strip()
            ReferenciaCliente.objects.create(
                cliente=cliente,
                nombres=nombre_ref,
                telefono=referencia.get("telefono", "").strip() or None,
                parentesco=referencia.get("parentesco", "").strip() or None,
                direccion=referencia.get("direccion", "").strip() or None,
            )

        if isinstance(current_user, Usuario):
            InformeNuevoCliente.objects.update_or_create(
                cliente=cliente,
                defaults={
                    "usuario_creador": current_user,
                    "fecha_generacion": now,
                    "observaciones": observaciones.strip() or None,
                    "estado_revision": "pendiente",
                },
            )

        return cliente


class ClienteListSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(read_only=True)
    telefonos = serializers.SerializerMethodField()
    en_lista_negra = serializers.SerializerMethodField()
    asesor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
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

    def get_telefonos(self, obj: Cliente):
        return list(
            obj.telefonos.order_by("orden").values("id", "numero", "orden", "tipo")
        )

    def get_en_lista_negra(self, obj: Cliente) -> bool:
        return obj.registros_lista_negra.exists()

    def get_asesor_nombre(self, obj: Cliente):
        return obj.asesor.full_name if obj.asesor_id else None


class ClienteDetailSerializer(ClienteListSerializer):
    informacion_laboral = serializers.SerializerMethodField()
    referencias = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()

    class Meta(ClienteListSerializer.Meta):
        fields = ClienteListSerializer.Meta.fields + [
            "ingresos_mensuales",
            "egreso_aproximado_mensual",
            "fecha_nacimiento",
            "informacion_laboral",
            "referencias",
            "fotos",
        ]

    def get_informacion_laboral(self, obj: Cliente):
        info = getattr(obj, "informacion_laboral", None)
        if not info:
            return None

        # normalizar ruta de foto_recibo_luz a URL absoluta cuando sea necesario
        foto = info.foto_recibo_luz
        request = self.context.get("request", None)
        if foto:
            if isinstance(foto, str) and (foto.startswith("http://") or foto.startswith("https://") or foto.startswith("data:")):
                foto_url = foto
            else:
                media_prefix = settings.MEDIA_URL or "/media/"
                foto_url = request.build_absolute_uri(f"{media_prefix}{str(foto).lstrip('/')}") if request else f"{media_prefix}{str(foto).lstrip('/')}"
        else:
            foto_url = None

        return {
            "lugar_trabajo": info.lugar_trabajo,
            "direccion_trabajo": info.direccion_trabajo,
            "puesto": info.puesto,
            "tiempo_laborando": info.tiempo_laborando,
            "ingreso_mensual": str(info.ingreso_mensual),
            "egreso_mensual": str(info.egreso_mensual),
            "otras_fuentes_ingreso": info.otras_fuentes_ingreso,
            "foto_recibo_luz": foto_url,
        }

    def get_referencias(self, obj: Cliente):
        return list(
            obj.referencias.values("id", "nombres", "telefono", "parentesco", "direccion")
        )

    def get_fotos(self, obj: Cliente):
        fotos = list(obj.fotos.values("id", "ruta_archivo", "descripcion"))
        request = self.context.get("request", None)
        media_prefix = settings.MEDIA_URL or "/media/"
        for f in fotos:
            ruta = f.get("ruta_archivo")
            if not ruta:
                continue
            if isinstance(ruta, str) and (ruta.startswith("http://") or ruta.startswith("https://") or ruta.startswith("data:")):
                f["ruta_archivo"] = ruta
            else:
                f["ruta_archivo"] = request.build_absolute_uri(f"{media_prefix}{ruta.lstrip('/')}") if request else f"{media_prefix}{ruta.lstrip('/')}"
        return fotos


class InformeNuevoClienteListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    cliente_dpi = serializers.SerializerMethodField()
    usuario_creador_nombre = serializers.SerializerMethodField()

    class Meta:
        model = InformeNuevoCliente
        fields = [
            "id",
            "fecha_generacion",
            "observaciones",
            "estado_revision",
            "cliente_id",
            "usuario_creador_id",
            "cliente_nombre",
            "cliente_dpi",
            "usuario_creador_nombre",
        ]

    def get_cliente_nombre(self, obj: InformeNuevoCliente):
        if not obj.cliente_id:
            return None
        return obj.cliente.nombre_completo

    def get_cliente_dpi(self, obj: InformeNuevoCliente):
        if not obj.cliente_id:
            return None
        return obj.cliente.dpi

    def get_usuario_creador_nombre(self, obj: InformeNuevoCliente):
        if not obj.usuario_creador_id:
            return None
        return obj.usuario_creador.full_name


class InformeNuevoClienteDetailSerializer(serializers.ModelSerializer):
    cliente = serializers.SerializerMethodField()
    telefonos = serializers.SerializerMethodField()
    informacion_laboral = serializers.SerializerMethodField()
    referencias = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()
    usuario_creador_nombre = serializers.SerializerMethodField()

    class Meta:
        model = InformeNuevoCliente
        fields = [
            "id",
            "fecha_generacion",
            "observaciones",
            "estado_revision",
            "usuario_creador_id",
            "usuario_creador_nombre",
            "cliente",
            "telefonos",
            "informacion_laboral",
            "referencias",
            "fotos",
        ]

    def get_usuario_creador_nombre(self, obj: InformeNuevoCliente):
        if not obj.usuario_creador_id:
            return None
        return obj.usuario_creador.full_name

    def get_cliente(self, obj: InformeNuevoCliente):
        cliente = obj.cliente
        if not cliente:
            return None

        return {
            "id": cliente.id,
            "nombre_completo": cliente.nombre_completo,
            "nombres": cliente.nombres,
            "apellidos": cliente.apellidos,
            "dpi": cliente.dpi,
            "nit": cliente.nit,
            "fecha_nacimiento": cliente.fecha_nacimiento,
            "direccion": cliente.direccion,
            "departamento": cliente.departamento,
            "municipio": cliente.municipio,
            "distrito": cliente.distrito,
            "ingresos_mensuales": cliente.ingresos_mensuales,
            "egreso_aproximado_mensual": cliente.egreso_aproximado_mensual,
            "estado_cliente": cliente.estado_cliente,
            "fecha_registro": cliente.fecha_registro,
            "asesor_id": cliente.asesor_id,
            "asesor_nombre": cliente.asesor.full_name if cliente.asesor_id else None,
            "cartera_id": cliente.cartera_id,
            "cartera_nombre": cliente.cartera.nombre_cartera if cliente.cartera_id else None,
        }

    def get_telefonos(self, obj: InformeNuevoCliente):
        return list(
            obj.cliente.telefonos.order_by("orden").values("id", "numero", "orden", "tipo")
        )

    def get_informacion_laboral(self, obj: InformeNuevoCliente):
        info = getattr(obj.cliente, "informacion_laboral", None)
        if not info:
            return None

        # normalizar foto_recibo_luz a URL absoluta
        foto = info.foto_recibo_luz
        request = self.context.get("request", None)
        if foto:
            if isinstance(foto, str) and (foto.startswith("http://") or foto.startswith("https://") or foto.startswith("data:")):
                foto_url = foto
            else:
                media_prefix = settings.MEDIA_URL or "/media/"
                foto_url = request.build_absolute_uri(f"{media_prefix}{str(foto).lstrip('/')}") if request else f"{media_prefix}{str(foto).lstrip('/')}"
        else:
            foto_url = None

        return {
            "lugar_trabajo": info.lugar_trabajo,
            "direccion_trabajo": info.direccion_trabajo,
            "puesto": info.puesto,
            "tiempo_laborando": info.tiempo_laborando,
            "ingreso_mensual": str(info.ingreso_mensual),
            "egreso_mensual": str(info.egreso_mensual),
            "otras_fuentes_ingreso": info.otras_fuentes_ingreso,
            "foto_recibo_luz": foto_url,
        }

    def get_referencias(self, obj: InformeNuevoCliente):
        return list(
            obj.cliente.referencias.values("id", "nombres", "telefono", "parentesco", "direccion")
        )

    def get_fotos(self, obj: InformeNuevoCliente):
        fotos = list(obj.cliente.fotos.values("id", "ruta_archivo", "descripcion"))
        request = self.context.get("request", None)
        media_prefix = settings.MEDIA_URL or "/media/"
        for f in fotos:
            ruta = f.get("ruta_archivo")
            if not ruta:
                continue
            if isinstance(ruta, str) and (ruta.startswith("http://") or ruta.startswith("https://") or ruta.startswith("data:")):
                f["ruta_archivo"] = ruta
            else:
                f["ruta_archivo"] = request.build_absolute_uri(f"{media_prefix}{ruta.lstrip('/')}") if request else f"{media_prefix}{ruta.lstrip('/')}"
        return fotos


class ListaNegraAddSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField()

    def validate_cliente_id(self, value: int) -> int:
        if not Cliente.objects.filter(pk=value).exists():
            raise serializers.ValidationError("El cliente no existe.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        cliente = Cliente.objects.get(pk=validated_data["cliente_id"])
        lista, _ = ListaNegra.objects.get_or_create(
            id=1,
            defaults={
                "estado": "activa",
                "fecha_registro": timezone.now(),
            },
        )

        registro, _ = ListaNegraCliente.objects.get_or_create(
            lista_negra=lista,
            cliente=cliente,
            defaults={"fecha_ingreso": timezone.now()},
        )
        return registro


class ListaNegraItemSerializer(serializers.ModelSerializer):
    acreedor = ClienteListSerializer(source="cliente", read_only=True)

    class Meta:
        model = ListaNegraCliente
        fields = ["id", "fecha_ingreso", "acreedor"]


class PortafolioLoanListSerializer(serializers.ModelSerializer):
    monto_total = serializers.SerializerMethodField()
    periodicidad = serializers.SerializerMethodField()
    cuotas = serializers.SerializerMethodField()
    mora = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    garantias = serializers.SerializerMethodField()

    class Meta:
        model = Prestamo
        fields = [
            "id",
            "monto_solicitado",
            "interes",
            "monto_total",
            "destino_uso",
            "periodicidad",
            "cuotas",
            "mora",
            "status",
            "date",
            "garantias",
        ]

    def get_monto_total(self, obj: Prestamo):
        monto = float(obj.monto_solicitado or 0)
        interes = float(obj.interes or 0)
        return round(monto + (monto * interes / 100), 2)
    
    def get_garantias(self, obj: Prestamo):
        return GarantiaListSerializer(
            obj.garantias.all(),
            many=True,
            context=self.context,
    ).data

    def get_periodicidad(self, obj: Prestamo):
        return obj.plan.periodicidad if obj.plan_id else None

    def get_cuotas(self, obj: Prestamo):
        return obj.plan.numero_cuotas if obj.plan_id else None

    def get_mora(self, obj: Prestamo):
        return obj.plan.mora if obj.plan_id else None

    def get_status(self, obj: Prestamo):
        if obj.fecha_desembolso:
            return "desembolsado"
        if obj.fecha_aprobacion:
            return "aprobado"
        return "pendiente"

    def get_date(self, obj: Prestamo):
        return obj.fecha_solicitud


class PortafolioClienteSerializer(serializers.ModelSerializer):
    phone = serializers.SerializerMethodField()
    loans = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    carteraId = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = [
            "id",
            "carteraId",
            "name",
            "dpi",
            "phone",
            "loans",
        ]

    def get_phone(self, obj: Cliente):
        telefono = obj.telefonos.order_by("orden").first()
        return telefono.numero if telefono else None

    def get_loans(self, obj: Cliente):
        # Usamos los préstamos ya precargados si existen para evitar N+1
        prestamos = getattr(obj, 'prestamos', None)
        if prestamos is None:
            prestamos = (
                obj.prestamos.select_related("plan")
                .prefetch_related("garantias", "garantias__fotos", "garantias__evaluaciones")
                .all()
            )
        
        return PortafolioLoanListSerializer(
            prestamos,
            many=True,
            context=self.context,
        ).data

    def get_name(self, obj: Cliente):
        return obj.nombre_completo

    def get_carteraId(self, obj: Cliente):
        return obj.cartera_id


class PortafolioCarteraSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="nombre_cartera")
    status = serializers.CharField(source="estado")
    clientes_count = serializers.SerializerMethodField()
    usuario_responsable_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cartera
        fields = [
            "id",
            "name",
            "status",
            "fecha_inicio",
            "fecha_fin",
            "clientes_count",
            "usuario_responsable_id",
        ]

    def get_clientes_count(self, obj: Cartera):
        return obj.clientes.count()


class CarteraCreateSerializer(serializers.Serializer):
    nombre_cartera = serializers.CharField(max_length=120)
    estado = serializers.CharField(max_length=30, required=False, default="activa")

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        return Cartera.objects.create(
            usuario_responsable=user,
            nombre_cartera=validated_data["nombre_cartera"],
            estado=validated_data.get("estado", "activa"),
        )


class CarteraUpdateSerializer(serializers.Serializer):
    nombre_cartera = serializers.CharField(max_length=120, required=False)
    estado = serializers.CharField(max_length=30, required=False)

    def update(self, instance: Cartera, validated_data):
        if "nombre_cartera" in validated_data:
            instance.nombre_cartera = validated_data["nombre_cartera"]
        if "estado" in validated_data:
            instance.estado = validated_data["estado"]
        instance.save()
        return instance


class MoverClienteCarteraSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField()
    cartera_destino_id = serializers.IntegerField()

    def validate_cliente_id(self, value):
        if not Cliente.objects.filter(pk=value).exists():
            raise serializers.ValidationError("El cliente no existe.")
        return value

    def validate_cartera_destino_id(self, value):
        if not Cartera.objects.filter(pk=value).exists():
            raise serializers.ValidationError("La cartera destino no existe.")
        return value

    def save(self, **kwargs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user:
            raise serializers.ValidationError("Usuario no autenticado.")

        cliente = Cliente.objects.filter(pk=self.validated_data["cliente_id"]).first()
        if not cliente:
            raise serializers.ValidationError("El cliente no existe.")

        # Verificar permisos: Administradores pueden todo, asesores solo lo suyo
        from apps.clientes.views import get_role_name
        role_name = get_role_name(user)
        is_admin = role_name in {"administrador", "admin", "gerente"}

        if not is_admin and cliente.asesor_id != user.id:
            raise serializers.ValidationError("No tienes permiso para mover un cliente que no te pertenece.")

        cartera_destino = Cartera.objects.filter(pk=self.validated_data["cartera_destino_id"]).first()
        if not cartera_destino:
            raise serializers.ValidationError("La cartera destino no existe.")

        if not is_admin and cartera_destino.usuario_responsable_id != user.id:
            raise serializers.ValidationError("No tienes permiso para mover clientes a una cartera que no gestionas.")

        if cliente.estado_cliente != "activo":
            raise serializers.ValidationError("No puedes mover un cliente que aún no fue aprobado.")

        if not cliente.prestamos.exists():
            raise serializers.ValidationError("No puedes mover un cliente sin préstamos.")

        cliente.cartera_id = cartera_destino.id
        cliente.save(update_fields=["cartera_id"])
        return cliente