from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import Usuario
from .models import Acreedor, ListaNegraAcreedor
from .serializers import (
    AcreedorCreateSerializer,
    AcreedorDetailSerializer,
    AcreedorListSerializer,
    ListaNegraAddSerializer,
    ListaNegraItemSerializer,
)


ADMIN_ROLES = {"administrador", "admin", "gerente"}


def get_role_name(user) -> str:
    return getattr(user, "role_name", getattr(user, "role", "") or "").strip().lower()


def get_permission_codes(user) -> set[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return set()

    if hasattr(user, "get_permission_codes"):
        return set(user.get_permission_codes())

    return set()


def has_any_permission(user, *required_permissions: str) -> bool:
    role_name = get_role_name(user)

    if role_name in ADMIN_ROLES:
        return True

    permissions_set = get_permission_codes(user)
    return any(permission in permissions_set for permission in required_permissions)


def get_creditors_queryset_for_user(user):
    queryset = Acreedor.objects.select_related("asesor", "cartera").prefetch_related(
        "telefonos",
        "referencias",
        "fotos",
        "registros_lista_negra",
    )

    role_name = get_role_name(user)

    if role_name == "asesor":
        return queryset.filter(asesor=user)

    return queryset


class CreditorsCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not has_any_permission(request.user, "crear_acreedor"):
            return Response(
                {"detail": "No tienes permiso para crear acreedores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AcreedorCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        acreedor = serializer.save()

        output = AcreedorDetailSerializer(acreedor)
        return Response(output.data, status=status.HTTP_201_CREATED)


class CreditorsSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_any_permission(
            request.user,
            "buscar_acreedor",
            "crear_acreedor",
            "ver_acreedores_globales",
            "ver_acreedor",
        ):
            return Response(
                {"detail": "No tienes permiso para buscar acreedores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        q = (request.query_params.get("q") or "").strip()

        queryset = get_creditors_queryset_for_user(request.user)

        if q:
            queryset = queryset.filter(
                Q(dpi__icontains=q)
                | Q(nombres__icontains=q)
                | Q(apellidos__icontains=q)
                | Q(nit__icontains=q)
                | Q(telefonos__numero__icontains=q)
            ).distinct()

        serializer = AcreedorListSerializer(queryset[:50], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreditorsDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, creditor_id: int):
        if not has_any_permission(
            request.user,
            "buscar_acreedor",
            "crear_acreedor",
            "ver_acreedores_globales",
            "ver_acreedor",
        ):
            return Response(
                {"detail": "No tienes permiso para ver acreedores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = get_creditors_queryset_for_user(request.user)
        acreedor = queryset.filter(pk=creditor_id).first()

        if not acreedor:
            return Response(
                {"detail": "Acreedor no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AcreedorDetailSerializer(acreedor)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BlacklistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_any_permission(request.user, "ver_lista_negra"):
            return Response(
                {"detail": "No tienes permiso para ver la lista negra."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = ListaNegraAcreedor.objects.select_related(
            "acreedor",
            "acreedor__asesor",
            "acreedor__cartera",
        ).prefetch_related(
            "acreedor__telefonos",
            "acreedor__registros_lista_negra",
        )

        q = (request.query_params.get("q") or "").strip()
        if q:
            queryset = queryset.filter(
                Q(acreedor__dpi__icontains=q)
                | Q(acreedor__nombres__icontains=q)
                | Q(acreedor__apellidos__icontains=q)
            )

        serializer = ListaNegraItemSerializer(queryset[:50], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if not has_any_permission(
            request.user,
            "asignar_lista_negra",
            "agregar_lista_negra",
        ):
            return Response(
                {"detail": "No tienes permiso para agregar acreedores a la lista negra."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ListaNegraAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registro = serializer.save()

        output = ListaNegraItemSerializer(registro)
        return Response(output.data, status=status.HTTP_201_CREATED)


class CreditorsHealthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user if isinstance(request.user, Usuario) else None
        return Response(
            {
                "ok": True,
                "message": "Módulo de acreedores activo.",
                "user": {
                    "id": user.id if user else None,
                    "role": user.role_name if user else None,
                },
            },
            status=status.HTTP_200_OK,
        )