from datetime import timedelta
from pathlib import Path
import uuid

import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Role, Usuario
from .serializers import (
    CarteraResumenSerializer,
    LoginSerializer,
    RoleSerializer,
    SessionUserSerializer,
    TransferenciaCarteraSerializer,
    UsernameUpdateSerializer,
    UsuarioCreateSerializer,
    UsuarioEstadoSerializer,
    UsuarioListSerializer,
)
from apps.bitacora.utils import registrar_en_bitacora

ADMIN_ROLES = {"administrador", "admin", "gerente"}


def get_role_name(user) -> str:
    if not user:
        return ""
    return getattr(user, "role_name", "") or ""


def get_permission_codes(user) -> set[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return set()

    if hasattr(user, "get_permission_codes"):
        return set(user.get_permission_codes())

    return set()


def has_any_permission(user, *required_permissions: str) -> bool:
    role_name = get_role_name(user).strip().lower()

    if role_name in ADMIN_ROLES:
        return True

    permissions_set = get_permission_codes(user)
    return any(permission in permissions_set for permission in required_permissions)


def is_admin_user(user) -> bool:
    return get_role_name(user).strip().lower() in ADMIN_ROLES


def password_matches(raw_password: str, stored_password_hash: str) -> bool:
    if not stored_password_hash:
        return False

    if raw_password == stored_password_hash:
        return True

    try:
        return check_password(raw_password, stored_password_hash)
    except Exception:
        return False


def build_token(user: Usuario, token_type: str) -> str:
    now = timezone.now()

    if token_type == "access":
        exp = now + timedelta(hours=8)
    else:
        exp = now + timedelta(days=7)

    payload = {
        "type": token_type,
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.name if user.role_id else None,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"].strip()
        password = serializer.validated_data["password"]

        user = (
            Usuario.objects.select_related("role")
            .filter(username__iexact=username)
            .first()
        )

        if not user:
            registrar_en_bitacora(
                usuario=None,
                categoria='sistema',
                titulo='Intento de login fallido',
                descripcion=f'Usuario no encontrado: "{username}".',
                detalles={'username': username}
            )
            return Response(
                {"detail": "Credenciales incorrectas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password_matches(password, user.password_hash):
            registrar_en_bitacora(
                usuario=user,
                categoria='sistema',
                titulo='Intento de login fallido',
                descripcion=f'Contraseña incorrecta para el usuario "{username}".',
                detalles={'username': username}
            )
            return Response(
                {"detail": "Credenciales incorrectas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not getattr(user, "is_active", True):
            return Response(
                {"detail": "El usuario está inactivo."},
                status=status.HTTP_403_FORBIDDEN,
            )

        access = build_token(user, "access")
        refresh = build_token(user, "refresh")
        session_user = SessionUserSerializer(user, context={"request": request}).data

        registrar_en_bitacora(
            usuario=user,
            categoria='sistema',
            titulo='Inicio de sesión',
            descripcion=f'El usuario "{user.username}" inició sesión correctamente.',
            detalles={'username': user.username, 'rol': user.role.name if user.role_id else 'Sin rol'}
        )

        return Response(
            {
                "access": access,
                "refresh": refresh,
                "user": session_user,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = SessionUserSerializer(request.user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class MeUsernameUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = UsernameUpdateSerializer(
            data=request.data,
            context={"user": request.user},
        )
        serializer.is_valid(raise_exception=True)

        request.user.username = serializer.validated_data["username"]
        request.user.save(update_fields=["username"])

        registrar_en_bitacora(
            usuario=request.user,
            categoria='sistema',
            titulo='Username actualizado',
            descripcion=f'El usuario cambió su nombre de usuario a "{request.user.username}".',
            detalles={'nuevo_username': request.user.username}
        )

        output = SessionUserSerializer(request.user, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)

class MePasswordUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        current_password = (request.data.get("current_password") or "").strip()
        new_password = (request.data.get("new_password") or "").strip()
        confirm_password = (request.data.get("confirm_password") or "").strip()

        if not current_password:
            return Response(
                {"detail": "Debes ingresar tu contraseña actual."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not new_password:
            return Response(
                {"detail": "Debes ingresar la nueva contraseña."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 6:
            return Response(
                {"detail": "La nueva contraseña debe tener al menos 6 caracteres."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"detail": "Las contraseñas nuevas no coinciden."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password_matches(current_password, request.user.password_hash):
            return Response(
                {"detail": "La contraseña actual es incorrecta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.password_hash = make_password(new_password)
        request.user.save(update_fields=["password_hash"])

        registrar_en_bitacora(
            usuario=request.user,
            categoria='sistema',
            titulo='Contraseña actualizada',
            descripcion=f'El usuario "{request.user.username}" cambió su contraseña.',
            detalles={'username': request.user.username}
        )

        return Response(
            {"detail": "Contraseña actualizada correctamente."},
            status=status.HTTP_200_OK,
        )

class MePhotoUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        photo = request.FILES.get("photo")
        if not photo:
            return Response(
                {"detail": "Debes enviar una imagen en el campo photo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not getattr(photo, "content_type", "").startswith("image/"):
            return Response(
                {"detail": "El archivo enviado no es una imagen válida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from config.storage_backends import AvatarsStorage
        storage = AvatarsStorage()
        
        extension = Path(photo.name).suffix or ".jpg"
        filename = f"{request.user.id}_{uuid.uuid4().hex}{extension}"
        
        saved_name = storage.save(filename, photo)
        full_url = storage.url(saved_name)

        request.user.ruta_foto_perfil = full_url
        request.user.save(update_fields=["ruta_foto_perfil"])

        output = SessionUserSerializer(request.user, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)


class RolesListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not is_admin_user(request.user) and not has_any_permission(
            request.user,
            "crear_usuario",
            "editar_usuario",
            "ver_usuario",
            "asignar_roles",
        ):
            return Response(
                {"detail": "No tienes permiso para ver roles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        roles = Role.objects.all().order_by("name")
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UsersListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not is_admin_user(request.user) and not has_any_permission(
            request.user,
            "ver_usuario",
            "editar_usuario",
            "crear_usuario",
        ):
            return Response(
                {"detail": "No tienes permiso para ver usuarios."},
                status=status.HTTP_403_FORBIDDEN,
            )

        q = (request.query_params.get("q") or "").strip()
        role_filter = (request.query_params.get("role") or "").strip()
        estado = (request.query_params.get("estado") or "").strip()

        queryset = Usuario.objects.select_related("role").all().order_by("-id")

        if q:
            queryset = queryset.filter(
                Q(username__icontains=q)
                | Q(nombres__icontains=q)
                | Q(apellidos__icontains=q)
                | Q(email__icontains=q)
            )

        if role_filter:
            queryset = queryset.filter(role__name__iexact=role_filter)

        if estado:
            queryset = queryset.filter(estado__iexact=estado)

        serializer = UsuarioListSerializer(queryset[:100], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if not is_admin_user(request.user) and not has_any_permission(
            request.user,
            "crear_usuario",
            "asignar_roles",
        ):
            return Response(
                {"detail": "No tienes permiso para crear usuarios."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UsuarioCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        registrar_en_bitacora(
            usuario=request.user,
            categoria='asesor',
            titulo=f'Nuevo usuario creado - {usuario.full_name}',
            descripcion=f'Se creó el usuario "{usuario.username}" con rol {usuario.role.name if usuario.role_id else "Sin rol"}.',
            detalles={'username': usuario.username, 'rol': usuario.role.name if usuario.role_id else 'Sin rol', 'email': usuario.email}
        )

        output = UsuarioListSerializer(usuario)
        return Response(output.data, status=status.HTTP_201_CREATED)


class UserStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, user_id: int):
        if not is_admin_user(request.user) and not has_any_permission(
            request.user,
            "editar_usuario",
        ):
            return Response(
                {"detail": "No tienes permiso para cambiar el estado del usuario."},
                status=status.HTTP_403_FORBIDDEN,
            )

        usuario = Usuario.objects.select_related("role").filter(pk=user_id).first()

        if not usuario:
            return Response(
                {"detail": "Usuario no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UsuarioEstadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario.estado = serializer.validated_data["estado"]
        usuario.save(update_fields=["estado"])

        registrar_en_bitacora(
            usuario=request.user,
            categoria='asesor',
            titulo=f'Estado de usuario actualizado - {usuario.full_name}',
            descripcion=f'El usuario "{usuario.username}" fue marcado como "{usuario.estado}".',
            detalles={'username': usuario.username, 'nuevo_estado': usuario.estado}
        )

        output = UsuarioListSerializer(usuario)
        return Response(output.data, status=status.HTTP_200_OK)


class AdvisorsSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not is_admin_user(request.user) and not has_any_permission(
            request.user,
            "ver_usuario",
            "editar_usuario",
            "crear_usuario",
        ):
            return Response(
                {"detail": "No tienes permiso para buscar asesores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        q = (request.query_params.get("q") or "").strip()

        queryset = (
            Usuario.objects.select_related("role")
            .filter(role__name__iexact="Asesor")
            .order_by("nombres", "apellidos")
        )

        if q:
            queryset = queryset.filter(
                Q(username__icontains=q)
                | Q(nombres__icontains=q)
                | Q(apellidos__icontains=q)
                | Q(email__icontains=q)
            )

        serializer = UsuarioListSerializer(queryset[:100], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdvisorCarterasView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, advisor_id: int):
        if not is_admin_user(request.user):
            return Response(
                {"detail": "No tienes permiso para ver las carteras del asesor."},
                status=status.HTTP_403_FORBIDDEN,
            )

        asesor = (
            Usuario.objects.select_related("role")
            .filter(pk=advisor_id, role__name__iexact="Asesor")
            .first()
        )

        if not asesor:
            return Response(
                {"detail": "Asesor no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cartera_ids = (
            asesor.clientes_asignados.filter(cartera__isnull=False)
            .values_list("cartera_id", flat=True)
            .distinct()
        )

        from apps.clientes.models import Cartera

        carteras = Cartera.objects.filter(id__in=cartera_ids).order_by("nombre_cartera")
        serializer = CarteraResumenSerializer(carteras, many=True)

        return Response(
            {
                "asesor": UsuarioListSerializer(asesor).data,
                "carteras": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class TransferCarteraView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not is_admin_user(request.user):
            return Response(
                {"detail": "No tienes permiso para transferir carteras entre asesores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TransferenciaCarteraSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        registrar_en_bitacora(
            usuario=request.user,
            categoria='asesor',
            titulo='Transferencia de cartera realizada',
            descripcion='Se transfirió una cartera entre asesores.',
            detalles=result if isinstance(result, dict) else {}
        )

        return Response(result, status=status.HTTP_200_OK)