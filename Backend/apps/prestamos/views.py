from decimal import Decimal

from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PlanPago, Prestamo
from .serializers import (
    GarantiaPhotoUploadSerializer,
    LoanSimulationSerializer,
    PagoCreateSerializer,
    PagoSerializer,
    PlanPagoCreateSerializer,
    PlanPagoListSerializer,
    PrestamoAprobacionSerializer,
    PrestamoCreateSerializer,
    PrestamoDesembolsoSerializer,
    PrestamoDetailSerializer,
    PrestamoListSerializer,
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


def get_prestamos_queryset_for_user(user):
    queryset = (
        Prestamo.objects.select_related(
            "cliente",
            "cliente__asesor",
            "plan",
            "admin_aprobador",
        )
        .prefetch_related(
            "cuotas",
            "pagos",
            "movimientos_hoja_cuenta",
            "garantias",
            "garantias__fotos",
            "garantias__evaluaciones",
            "garantias__evaluaciones__usuario_evalua",
        )
        .order_by("-id")
    )

    role_name = get_role_name(user)

    if role_name == "asesor":
        return queryset.filter(cliente__asesor=user)

    return queryset


class GarantiaPhotoUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not has_any_permission(request.user, "crear_prestamo"):
            return Response(
                {"detail": "No tienes permiso para subir fotos de garantías."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GarantiaPhotoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_201_CREATED)


class LoansCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not has_any_permission(request.user, "crear_prestamo"):
            return Response(
                {"detail": "No tienes permiso para crear préstamos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PrestamoCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        prestamo = serializer.save()

        output = PrestamoDetailSerializer(prestamo, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class LoansPendingListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_any_permission(
            request.user,
            "aprobar_acreedor_precalificacion",
            "aprobar_acreedor_final",
            "ver_solicitudes_globales",
            "aprobar_prestamo",
        ):
            return Response(
                {"detail": "No tienes permiso para ver solicitudes pendientes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        q = (request.query_params.get("q") or "").strip()

        queryset = get_prestamos_queryset_for_user(request.user).filter(
            fecha_aprobacion__isnull=True
        )

        if q:
            queryset = queryset.filter(
                Q(cliente__nombres__icontains=q)
                | Q(cliente__apellidos__icontains=q)
                | Q(cliente__dpi__icontains=q)
                | Q(id__icontains=q)
            )

        serializer = PrestamoListSerializer(queryset[:50], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoansDisbursementPendingListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        role_name = get_role_name(request.user)

        if role_name in {"secretaria", "asesor"}:
            return Response(
                {"detail": "No tienes permiso para ver desembolsos pendientes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not has_any_permission(request.user, "autorizar_desembolso", "registrar_desembolso"):
            return Response(
                {"detail": "No tienes permiso para ver desembolsos pendientes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        q = (request.query_params.get("q") or "").strip()

        queryset = get_prestamos_queryset_for_user(request.user).filter(
            fecha_aprobacion__isnull=False,
            fecha_desembolso__isnull=True,
        )

        if q:
            queryset = queryset.filter(
                Q(cliente__nombres__icontains=q)
                | Q(cliente__apellidos__icontains=q)
                | Q(cliente__dpi__icontains=q)
                | Q(id__icontains=q)
            )

        serializer = PrestamoListSerializer(queryset[:50], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoansListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_any_permission(
            request.user,
            "crear_prestamo",
            "ver_prestamo",
            "aprobar_prestamo",
            "registrar_pago",
        ):
            return Response(
                {"detail": "No tienes permiso para ver préstamos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        q = (request.query_params.get("q") or "").strip()
        estado = (request.query_params.get("estado") or "").strip().lower()

        queryset = get_prestamos_queryset_for_user(request.user)

        if estado == "pendiente":
            queryset = queryset.filter(fecha_aprobacion__isnull=True)
        elif estado == "aprobado":
            queryset = queryset.filter(
                fecha_aprobacion__isnull=False,
                fecha_desembolso__isnull=True,
            )
        elif estado == "desembolsado":
            queryset = queryset.filter(fecha_desembolso__isnull=False)

        if q:
            queryset = queryset.filter(
                Q(cliente__nombres__icontains=q)
                | Q(cliente__apellidos__icontains=q)
                | Q(cliente__dpi__icontains=q)
                | Q(id__icontains=q)
            )

        serializer = PrestamoListSerializer(queryset[:100], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoanDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, loan_id: int):
        if not has_any_permission(
            request.user,
            "crear_prestamo",
            "ver_prestamo",
            "aprobar_prestamo",
            "registrar_pago",
        ):
            return Response(
                {"detail": "No tienes permiso para ver este préstamo."},
                status=status.HTTP_403_FORBIDDEN,
            )

        prestamo = get_prestamos_queryset_for_user(request.user).filter(pk=loan_id).first()

        if not prestamo:
            return Response(
                {"detail": "Préstamo no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PrestamoDetailSerializer(prestamo, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoanApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, loan_id: int):
        if not has_any_permission(
            request.user,
            "aprobar_acreedor_precalificacion",
            "aprobar_acreedor_final",
            "aprobar_prestamo",
        ):
            return Response(
                {"detail": "No tienes permiso para aprobar préstamos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        prestamo = Prestamo.objects.select_related(
            "cliente",
            "cliente__asesor",
            "plan",
        ).filter(pk=loan_id).first()

        if not prestamo:
            return Response(
                {"detail": "Préstamo no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if prestamo.fecha_aprobacion:
            return Response(
                {"detail": "El préstamo ya fue aprobado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PrestamoAprobacionSerializer(
            data=request.data,
            context={"prestamo": prestamo, "user": request.user},
        )
        serializer.is_valid(raise_exception=True)
        prestamo = serializer.save()

        output = PrestamoDetailSerializer(prestamo, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)


class LoanDisburseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, loan_id: int):
        role_name = get_role_name(request.user)

        if role_name in {"secretaria", "asesor"}:
            return Response(
                {"detail": "No tienes permiso para desembolsar préstamos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not has_any_permission(request.user, "autorizar_desembolso", "registrar_desembolso"):
            return Response(
                {"detail": "No tienes permiso para desembolsar préstamos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        prestamo = Prestamo.objects.select_related("cliente", "plan").filter(pk=loan_id).first()

        if not prestamo:
            return Response(
                {"detail": "Préstamo no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not prestamo.fecha_aprobacion:
            return Response(
                {"detail": "No se puede desembolsar un préstamo no aprobado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if prestamo.fecha_desembolso:
            return Response(
                {"detail": "El préstamo ya fue desembolsado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PrestamoDesembolsoSerializer(
            data=request.data,
            context={"prestamo": prestamo},
        )
        serializer.is_valid(raise_exception=True)
        prestamo = serializer.save()

        output = PrestamoDetailSerializer(prestamo, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)


class PlansView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_any_permission(
            request.user,
            "crear_plan_pago",
            "editar_plan_pago",
            "crear_planes_cobro",
            "crear_prestamo",
            "ver_prestamo",
        ):
            return Response(
                {"detail": "No tienes permiso para ver planes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        q = (request.query_params.get("q") or "").strip()
        queryset = PlanPago.objects.all().order_by("id")

        if q:
            queryset = queryset.filter(
                Q(nombre_plan__icontains=q)
                | Q(periodicidad__icontains=q)
            )

        serializer = PlanPagoListSerializer(queryset[:100], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        role_name = get_role_name(request.user)

        if role_name in {"secretaria", "asesor"}:
            return Response(
                {"detail": "No tienes permiso para crear planes personalizados."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not has_any_permission(
            request.user,
            "crear_plan_pago",
            "editar_plan_pago",
            "crear_planes_cobro",
        ):
            return Response(
                {"detail": "No tienes permiso para crear planes personalizados."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PlanPagoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.save()

        output = PlanPagoListSerializer(plan)
        return Response(output.data, status=status.HTTP_201_CREATED)


class LoanPaymentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not has_any_permission(
            request.user,
            "registrar_pago",
            "registrar_pago_cartera_propia",
            "registrar_pago_cualquier_acreedor",
        ):
            return Response(
                {"detail": "No tienes permiso para registrar pagos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PagoCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        pago = serializer.save()

        output = PagoSerializer(pago)
        return Response(output.data, status=status.HTTP_201_CREATED)


class LoanSimulationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        role_name = get_role_name(request.user)

        if role_name in {"secretaria", "asesor"}:
            return Response(
                {"detail": "No tienes permiso para usar el simulador de pagos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not has_any_permission(request.user, "simulador_pagos"):
            return Response(
                {"detail": "No tienes permiso para usar el simulador de pagos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = LoanSimulationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        monto = serializer.validated_data["monto"]
        interes = serializer.validated_data["interes"]
        mora = serializer.validated_data["mora"]
        numero_cuotas = serializer.validated_data["numero_cuotas"]

        total_interes = monto * (interes / Decimal("100"))
        total_sin_mora = monto + total_interes
        cuota_estimada = total_sin_mora / Decimal(numero_cuotas)
        mora_estimada = cuota_estimada * (mora / Decimal("100"))
        total_con_mora = total_sin_mora + mora_estimada

        return Response(
            {
                "monto": monto,
                "interes": interes,
                "mora": mora,
                "numero_cuotas": numero_cuotas,
                "total_interes": total_interes,
                "total_sin_mora": total_sin_mora,
                "mora_estimada": mora_estimada,
                "total_con_mora": total_con_mora,
                "cuota_estimada": cuota_estimada,
            },
            status=status.HTTP_200_OK,
        )