from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from rest_framework import serializers

from apps.clientes.models import Cartera, Cliente
from .models import Permission, Role, Usuario


class PermissionSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="code", read_only=True)
    descripcion = serializers.CharField(source="description", read_only=True)

    class Meta:
        model = Permission
        fields = ["id", "nombre", "descripcion"]


class RoleSerializer(serializers.ModelSerializer):
    nombre_rol = serializers.CharField(source="name", read_only=True)
    descripcion = serializers.CharField(source="description", read_only=True)

    class Meta:
        model = Role
        fields = ["id", "nombre_rol", "descripcion"]


class SessionUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    first_name = serializers.CharField(source="nombres", read_only=True)
    last_name = serializers.CharField(source="apellidos", read_only=True)
    ruta_foto_perfil = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "email",
            "role",
            "full_name",
            "first_name",
            "last_name",
            "ruta_foto_perfil",
            "permissions",
            "estado",
            "fecha_creacion",
        ]

    def get_role(self, obj: Usuario):
        if not obj.role_id:
            return None
        return obj.role.name

    def get_permissions(self, obj: Usuario):
        if hasattr(obj, "get_permission_codes"):
            return list(obj.get_permission_codes())
        return []

    def get_full_name(self, obj: Usuario):
        if hasattr(obj, "full_name"):
            return obj.full_name
        return f"{obj.nombres} {obj.apellidos}".strip()

    def get_ruta_foto_perfil(self, obj: Usuario):
        value = getattr(obj, "ruta_foto_perfil", None)
        if not value:
            return None

        # Si ya es una URL completa (S3), devolverla tal cual
        if isinstance(value, str) and (value.startswith("http://") or value.startswith("https://") or value.startswith("data:")):
            return value

        request = self.context.get("request")
        media_prefix = settings.MEDIA_URL or "/media/"
        
        # Si empieza con slash, ya es una ruta absoluta en el servidor
        if isinstance(value, str) and value.startswith("/"):
             return request.build_absolute_uri(value) if request else value
        
        # Si es una ruta relativa, añadir el prefijo de media
        path = f"{media_prefix}{str(value).lstrip('/')}"
        return request.build_absolute_uri(path) if request else path


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class UsuarioListSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    total_clientes = serializers.SerializerMethodField()
    total_carteras = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "email",
            "nombres",
            "apellidos",
            "full_name",
            "telefono",
            "direccion",
            "estado",
            "fecha_creacion",
            "role",
            "permissions",
            "total_clientes",
            "total_carteras",
        ]

    def get_role(self, obj: Usuario):
        if not obj.role_id:
            return None
        return obj.role.name

    def get_full_name(self, obj: Usuario):
        if hasattr(obj, "full_name"):
            return obj.full_name
        return f"{obj.nombres} {obj.apellidos}".strip()

    def get_permissions(self, obj: Usuario):
        if hasattr(obj, "get_permission_codes"):
            return list(obj.get_permission_codes())
        return []

    def get_total_clientes(self, obj: Usuario):
        return Cliente.objects.filter(asesor_id=obj.id).count()

    def get_total_carteras(self, obj: Usuario):
        return Cartera.objects.filter(usuario_responsable_id=obj.id).count()


class UsuarioCreateSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=100)
    apellidos = serializers.CharField(max_length=100)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField(max_length=150)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    rol_id = serializers.IntegerField(required=False, allow_null=True)
    rol_nombre = serializers.CharField(required=False, allow_blank=True)
    direccion = serializers.CharField(required=False, allow_blank=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value: str):
        value = value.strip()
        if Usuario.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Ese username ya existe.")
        return value

    def validate_email(self, value: str):
        value = value.strip().lower()
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ese email ya existe.")
        return value

    def validate(self, attrs):
        password = attrs.get("password", "")
        confirm_password = attrs.get("confirm_password", "")

        if password != confirm_password:
            raise serializers.ValidationError(
                {"confirm_password": ["Las contraseñas no coinciden."]}
            )

        rol_id = attrs.get("rol_id")
        rol_nombre = (attrs.get("rol_nombre") or "").strip()

        if not rol_id and not rol_nombre:
            raise serializers.ValidationError("Debes enviar rol_id o rol_nombre.")

        role = None
        if rol_id:
            role = Role.objects.filter(pk=rol_id).first()
        elif rol_nombre:
            role = Role.objects.filter(name__iexact=rol_nombre).first()

        if not role:
            raise serializers.ValidationError("El rol enviado no existe.")

        attrs["role_instance"] = role
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.pop("role_instance")
        validated_data.pop("confirm_password", None)
        validated_data.pop("rol_id", None)
        validated_data.pop("rol_nombre", None)
        validated_data.pop("observaciones", None)

        password = validated_data.pop("password")

        usuario = Usuario.objects.create(
            role=role,
            username=validated_data["username"].strip(),
            email=validated_data["email"].strip().lower(),
            password_hash=make_password(password),
            nombres=validated_data["nombres"].strip(),
            apellidos=validated_data["apellidos"].strip(),
            telefono=(validated_data.get("telefono") or "").strip() or None,
            direccion=(validated_data.get("direccion") or "").strip() or None,
            fecha_creacion=timezone.now(),
            estado="activo",
        )

        for nombre_cartera, estado in [
            ("Cartera Principal", "activa"),
            ("Cartera Vencida", "vencida"),
            ("Cartera Muerta", "muerta"),
        ]:
            Cartera.objects.get_or_create(
                usuario_responsable=usuario,
                nombre_cartera=nombre_cartera,
                defaults={"estado": estado},
            )

        return usuario


class UsuarioEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=["activo", "inactivo"])


class CarteraResumenSerializer(serializers.ModelSerializer):
    total_clientes = serializers.SerializerMethodField()

    class Meta:
        model = Cartera
        fields = [
            "id",
            "nombre_cartera",
            "fecha_inicio",
            "fecha_fin",
            "estado",
            "total_clientes",
        ]

    def get_total_clientes(self, obj: Cartera):
        return Cliente.objects.filter(cartera_id=obj.id).count()


class TransferenciaCarteraSerializer(serializers.Serializer):
    asesor_origen_id = serializers.IntegerField()
    asesor_destino_id = serializers.IntegerField()
    cartera_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
    )
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        origen = Usuario.objects.select_related("role").filter(
            pk=attrs["asesor_origen_id"]
        ).first()
        destino = Usuario.objects.select_related("role").filter(
            pk=attrs["asesor_destino_id"]
        ).first()

        if not origen:
            raise serializers.ValidationError("El asesor de origen no existe.")

        if not destino:
            raise serializers.ValidationError("El asesor de destino no existe.")

        if origen.id == destino.id:
            raise serializers.ValidationError(
                "El asesor de origen y destino no pueden ser el mismo."
            )

        carteras = list(Cartera.objects.filter(id__in=attrs["cartera_ids"]))

        if not carteras:
            raise serializers.ValidationError(
                "Debes seleccionar al menos una cartera válida."
            )

        carteras_origen_count = (
            Cliente.objects.filter(
                asesor_id=origen.id,
                cartera_id__in=[c.id for c in carteras],
            )
            .values("cartera_id")
            .distinct()
            .count()
        )

        if carteras_origen_count == 0:
            raise serializers.ValidationError(
                "El asesor de origen no tiene clientes en las carteras seleccionadas."
            )

        attrs["asesor_origen"] = origen
        attrs["asesor_destino"] = destino
        attrs["carteras"] = carteras
        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        origen = self.validated_data["asesor_origen"]
        destino = self.validated_data["asesor_destino"]
        carteras = self.validated_data["carteras"]

        cartera_ids = [c.id for c in carteras]

        clientes_qs = Cliente.objects.filter(
            asesor_id=origen.id,
            cartera_id__in=cartera_ids,
        )

        total_clientes = clientes_qs.count()
        clientes_qs.update(asesor=destino)

        return {
            "asesor_origen": {
                "id": origen.id,
                "username": origen.username,
                "nombre_completo": getattr(
                    origen, "full_name", f"{origen.nombres} {origen.apellidos}".strip()
                ),
            },
            "asesor_destino": {
                "id": destino.id,
                "username": destino.username,
                "nombre_completo": getattr(
                    destino, "full_name", f"{destino.nombres} {destino.apellidos}".strip()
                ),
            },
            "carteras_transferidas": [
                {
                    "id": cartera.id,
                    "nombre_cartera": cartera.nombre_cartera,
                }
                for cartera in carteras
            ],
            "total_clientes_transferidos": total_clientes,
            "observaciones": self.validated_data.get("observaciones", ""),
        }


class UsernameUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)

    def validate_username(self, value: str):
        value = value.strip()

        if not value:
            raise serializers.ValidationError("El username no puede ir vacío.")

        user = self.context.get("user")
        exists = Usuario.objects.filter(username__iexact=value).exclude(pk=user.id).exists()
        if exists:
            raise serializers.ValidationError("Ese username ya existe.")

        return value


class UsuarioSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "email",
            "nombres",
            "apellidos",
            "telefono",
            "direccion",
            "estado",
            "fecha_creacion",
            "role",
            "permissions",
            "avatar_url",
        ]

    def get_avatar_url(self, obj):
        # intenta detectar varios nombres comunes de campo de imagen
        candidate = getattr(obj, "avatar", None) or getattr(obj, "foto", None) or getattr(obj, "imagen", None)
        if not candidate:
            return None
        # si ya es URL completa devuélvelo tal cual
        if isinstance(candidate, str) and (candidate.startswith("http://") or candidate.startswith("https://") or candidate.startswith("data:")):
            return candidate
        # si es FieldFile de Django, usar url si existe
        try:
            url = candidate.url  # funciona si es ImageField/FileField
        except Exception:
            # candidate puede ser nombre de archivo
            url = str(candidate)
        request = self.context.get("request")
        if not url:
            return None
        if url.startswith("http://") or url.startswith("https://"):
            return url
        # construir URL absoluta usando MEDIA_URL
        media_prefix = settings.MEDIA_URL or "/media/"
        if request:
            return request.build_absolute_uri(f"{media_prefix}{url.lstrip('/')}")