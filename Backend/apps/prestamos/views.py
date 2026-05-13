from decimal import Decimal
import os
from django.http import FileResponse, Http404

from django.db.models import Q, Sum, Count
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from django.utils import timezone
from datetime import timedelta

from apps.notificaciones.models import Notificacion
from apps.bitacora.utils import registrar_en_bitacora
from .models import PlanPago, Prestamo, Pago, Cuota
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
    PrestamoUpdateSerializer,
    PrestamoListSerializer,
)
from .utils_docs import generate_loan_document, save_document_to_storage

ADMIN_ROLES = {"administrador", "admin", "gerente"}
RECAUDACION_ROLES = {"administrador", "admin", "gerente", "secretaria"}


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

    # Solo administradores, gerentes y secretarias pueden ver la cartera global.
    # Cualquier otro rol (asesor, cobrador, etc.) solo ve lo suyo.
    if role_name not in RECAUDACION_ROLES:
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

    def patch(self, request, loan_id: int):
        if not has_any_permission(
            request.user,
            "crear_prestamo",
            "aprobar_prestamo",
        ):
            return Response(
                {"detail": "No tienes permiso para editar este préstamo."},
                status=status.HTTP_403_FORBIDDEN,
            )

        prestamo = Prestamo.objects.filter(pk=loan_id).first()
        if not prestamo:
            return Response(
                {"detail": "Préstamo no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PrestamoUpdateSerializer(prestamo, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        prestamo = serializer.save()

        # Log to Bitacora
        registrar_en_bitacora(
            usuario=request.user,
            categoria='prestamo',
            titulo=f'Préstamo actualizado - #{prestamo.id}',
            descripcion=f'Se actualizaron los datos del préstamo #{prestamo.id}.',
            detalles={'Préstamo': f'CR-{prestamo.id}', 'Monto': str(prestamo.monto_solicitado)}
        )

        output = PrestamoDetailSerializer(prestamo, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)


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

        # Notify the advisor
        if prestamo.cliente and prestamo.cliente.asesor:
            Notificacion.objects.create(
                usuario_destino=prestamo.cliente.asesor,
                tipo='prestamo',
                titulo='Préstamo Aprobado',
                mensaje=f'El préstamo #{prestamo.id} para el cliente {prestamo.cliente.nombre_completo} ha sido aprobado.',
            )

        # Log to Bitacora
        registrar_en_bitacora(
            usuario=request.user,
            categoria='prestamo',
            titulo=f'Préstamo aprobado - {prestamo.cliente.nombre_completo if prestamo.cliente else "N/A"}',
            descripcion=f'Se aprobó el préstamo #{prestamo.id} por un monto de {prestamo.monto_solicitado}.',
            monto=prestamo.monto_solicitado,
            detalles={'Préstamo': f'CR-{prestamo.id}', 'Cliente': prestamo.cliente.nombre_completo if prestamo.cliente else 'N/A'}
        )

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
            context={"prestamo": prestamo, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        prestamo = serializer.save()

        # Log to Bitacora
        registrar_en_bitacora(
            usuario=request.user,
            categoria='egreso',
            titulo=f'Préstamo desembolsado - {prestamo.cliente.nombre_completo if prestamo.cliente else "N/A"}',
            descripcion=f'Se realizó el desembolso del préstamo #{prestamo.id} por {prestamo.monto_solicitado}.',
            monto=prestamo.monto_solicitado,
            detalles={'Préstamo': f'CR-{prestamo.id}', 'Cliente': prestamo.cliente.nombre_completo if prestamo.cliente else 'N/A'}
        )

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

        # Log to Bitacora
        registrar_en_bitacora(
            usuario=request.user,
            categoria='pago',
            titulo=f'Pago registrado - {pago.prestamo.cliente.nombre_completo if pago.prestamo and pago.prestamo.cliente else "N/A"}',
            descripcion=f'Se registró un pago de {pago.monto_pagado} para el préstamo {pago.prestamo_id}.',
            monto=pago.monto_pagado,
            detalles={'Préstamo': f'CR-{pago.prestamo_id}', 'Método': pago.tipo_pago}
        )

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
        total_a_pagar = monto + total_interes
        cuota_estimada = total_a_pagar / Decimal(numero_cuotas)
        
        # La mora solo se calcula como referencia para "cuota con mora" si se atrasa, 
        # pero no forma parte del total inicial del préstamo.
        mora_valor = cuota_estimada * (mora / Decimal("100"))

        return Response(
            {
                "monto": monto,
                "interes": interes,
                "mora": mora,
                "numero_cuotas": numero_cuotas,
                "total_interes": total_interes,
                "total_sin_mora": total_a_pagar,
                "mora_estimada": mora_valor,
                "total_con_mora": total_a_pagar + mora_valor,
                "cuota_estimada": cuota_estimada,
            },
            status=status.HTTP_200_OK,
        )


class DailyCollectionsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if get_role_name(request.user) not in RECAUDACION_ROLES:
            return Response(
                {"detail": "No tienes permiso para ver el resumen de recaudación."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        today = timezone.localdate()
        from datetime import datetime, time
        start_of_day = timezone.make_aware(datetime.combine(today, time.min))
        end_of_day = timezone.make_aware(datetime.combine(today, time.max))

        # Agrupar pagos por asesor que estén pendientes de validación o rechazados
        pagos_hoy = Pago.objects.filter(
            fecha_pago__range=(start_of_day, end_of_day),
            estado__in=["pendiente_validacion", "rechazado"]
        ).values('usuario_registra', 'estado').annotate(
            total_monto=Sum('monto_pagado'),
            conteo_pagos=Count('id')
        )

        from apps.users.models import Usuario
        output = []
        for p in pagos_hoy:
            user_id = p['usuario_registra']
            if not user_id: continue
            
            user = Usuario.objects.get(pk=user_id)
            initials = "".join([n[0] for n in user.full_name.split() if n])[:2].upper()
            
            cartera = user.carteras_propias.first()
            ruta_nombre = cartera.nombre_cartera if cartera else "Ruta General"

            output.append({
                "id": f"coll-{user_id}",
                "advisorName": user.full_name,
                "advisorInitials": initials,
                "route": ruta_nombre,
                "amount": float(p['total_monto']),
                "clientsVisited": p['conteo_pagos'],
                "totalClients": 0, # Opcional: calcular total de la ruta
                "date": today.strftime("%Y-%m-%d"),
                "time": timezone.now().strftime("%H:%M"),
                "status": "pending" if p['estado'] == "pendiente_validacion" else "rejected"
            })

        return Response(output)


class BulkValidateCollectionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if get_role_name(request.user) not in RECAUDACION_ROLES:
            return Response(
                {"detail": "No tienes permiso para validar recaudaciones."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        advisor_ids = request.data.get("advisor_ids", [])
        if not advisor_ids:
            return Response({"detail": "No se proporcionaron IDs de asesores."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Limpiar prefijos 'coll-'
        clean_ids = [str(aid).replace("coll-", "") for aid in advisor_ids]
        
        today = timezone.localdate()
        from datetime import datetime, time
        start_of_day = timezone.make_aware(datetime.combine(today, time.min))
        end_of_day = timezone.make_aware(datetime.combine(today, time.max))

        from django.db import transaction
        from apps.pagos.models import Caja, IngresoCaja
        from apps.users.models import Usuario
        
        try:
            with transaction.atomic():
                pagos = Pago.objects.filter(
                    usuario_registra_id__in=clean_ids,
                    fecha_pago__range=(start_of_day, end_of_day),
                    estado="pendiente_validacion"
                )
                
                if not pagos.exists():
                    return Response({"detail": "No hay pagos pendientes para estos asesores."}, status=status.HTTP_404_NOT_FOUND)
                
                total_recaudado = pagos.aggregate(total=Sum('monto_pagado'))['total'] or Decimal("0.00")
                
                # Actualizar Caja
                caja = Caja.objects.first()
                if not caja:
                    return Response({"detail": "Caja no configurada."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                caja.saldo_actual += total_recaudado
                caja.save(update_fields=["saldo_actual"])
                
                # Marcar pagos como registrados
                pagos.update(estado="registrado")

                # Log to Bitacora
                registrar_en_bitacora(
                    usuario=request.user,
                    categoria='caja',
                    titulo='Recaudación validada y enviada a caja',
                    descripcion=f'Se validó la recaudación de {len(clean_ids)} asesores por un total de {total_recaudado}.',
                    monto=total_recaudado,
                    detalles={'Asesores': ", ".join(clean_ids), 'Total': str(total_recaudado)}
                )
                
                # Crear Ingreso de Caja
                IngresoCaja.objects.create(
                    caja=caja,
                    usuario_registra=request.user,
                    tipo_ingreso="Recaudación de Rutas (Validada)",
                    monto=total_recaudado,
                    descripcion=f"Liquidación múltiple de rutas - Total: Q{total_recaudado}"
                )
                
            return Response({"detail": "Recaudación enviada a caja exitosamente."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Error al procesar: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkRejectCollectionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if get_role_name(request.user) not in RECAUDACION_ROLES:
            return Response(
                {"detail": "No tienes permiso para rechazar recaudaciones."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        advisor_ids = request.data.get("advisor_ids", [])
        if not advisor_ids:
            return Response({"detail": "No se proporcionaron IDs de asesores."}, status=status.HTTP_400_BAD_REQUEST)
        
        clean_ids = [str(aid).replace("coll-", "") for aid in advisor_ids]
        
        today = timezone.localdate()
        from datetime import datetime, time
        start_of_day = timezone.make_aware(datetime.combine(today, time.min))
        end_of_day = timezone.make_aware(datetime.combine(today, time.max))

        try:
            pagos = Pago.objects.filter(
                usuario_registra_id__in=clean_ids,
                fecha_pago__range=(start_of_day, end_of_day),
                estado="pendiente_validacion"
            )
            
            if not pagos.exists():
                return Response({"detail": "No hay pagos pendientes para rechazar."}, status=status.HTTP_404_NOT_FOUND)
            
            # Marcar como rechazados
            pagos.update(estado="rechazado")

            # Log to Bitacora
            registrar_en_bitacora(
                usuario=request.user,
                categoria='caja',
                titulo='Recaudación rechazada',
                descripcion=f'Se rechazó la recaudación de {len(clean_ids)} asesores. Deberán revisarse antes de validar.',
                detalles={'Asesores': ", ".join(clean_ids)}
            )
            
            return Response({"detail": "Recaudación rechazada exitosamente."})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DailyRouteView(APIView):
    """
    Retorna los clientes que tienen pagos para el día de hoy, 
    filtrado por el asesor que hace la petición.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        loans_queryset = Prestamo.objects.filter(fecha_desembolso__isnull=False)
        role_name = get_role_name(request.user)
        if role_name not in RECAUDACION_ROLES:
            loans_queryset = loans_queryset.filter(cliente__asesor=request.user)

        
        cuotas = Cuota.objects.filter(
            prestamo__in=loans_queryset,
            fecha_vencimiento=today,
            estado_cuota__in=['pendiente', 'parcial', 'vencida']
        ).select_related('prestamo', 'prestamo__cliente').order_by('prestamo__cliente__nombres')
        
        data = []
        for c in cuotas:
            data.append({
                "id_cuota": c.id,
                "prestamo_id": c.prestamo.id,
                "cliente_id": c.prestamo.cliente.id,
                "cliente": c.prestamo.cliente.nombre_completo,
                "direccion": c.prestamo.cliente.direccion,
                "monto": float(c.saldo_cuota),
                "numero_cuota": c.numero_cuota,
                "estado": c.estado_cuota,
                "fecha_vencimiento": c.fecha_vencimiento.strftime('%Y-%m-%d')
            })
            
        return Response(data)


class ClientesAtrasadosView(APIView):
    """
    Retorna los clientes que tienen cuotas vencidas (anteriores a hoy), 
    filtrado por el asesor que hace la petición.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        loans_queryset = Prestamo.objects.filter(fecha_desembolso__isnull=False)
        role_name = get_role_name(request.user)
        if role_name not in RECAUDACION_ROLES:
            loans_queryset = loans_queryset.filter(cliente__asesor=request.user)

        
        # Vencimiento automático: Marcar como vencidas las cuotas pendientes que ya pasaron de fecha
        Cuota.objects.filter(
            prestamo__in=loans_queryset,
            fecha_vencimiento__lt=today,
            estado_cuota__in=['pendiente', 'parcial']
        ).update(estado_cuota='vencida')

        cuotas = Cuota.objects.filter(
            prestamo__in=loans_queryset,
            estado_cuota='vencida'
        ).select_related('prestamo', 'prestamo__cliente').order_by('fecha_vencimiento')
        
        data_dict = {}
        for c in cuotas:
            cliente_id = c.prestamo.cliente.id
            if cliente_id not in data_dict:
                data_dict[cliente_id] = {
                    "id_cuota": c.id,
                    "prestamo_id": c.prestamo.id,
                    "cliente_id": cliente_id,
                    "cliente": c.prestamo.cliente.nombre_completo,
                    "direccion": c.prestamo.cliente.direccion,
                    "monto": 0.0,
                    "mora": 0.0,
                    "numero_cuota": c.numero_cuota,
                    "fecha_vencimiento": c.fecha_vencimiento.strftime('%Y-%m-%d')
                }
            data_dict[cliente_id]["monto"] += float(c.saldo_cuota)
            data_dict[cliente_id]["mora"] += float(c.mora_generada)
            
        return Response(list(data_dict.values()))



from django.utils import timezone
from django.db.models import Sum

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            if not has_any_permission(
                request.user,
                "ver_cobros_dia_propio",
                "ver_cobros_globales",
                "registrar_pago_cartera_propia",
                "registrar_pago_cualquier_acreedor",
                "ver_reportes",
                "reportes_rendimiento_todos_asesores"
            ):
                return Response(
                    {"detail": "No tienes permiso para ver estadísticas del dashboard."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            hoy = timezone.localdate()
            from datetime import datetime, time
            start_of_day = timezone.make_aware(datetime.combine(hoy, time.min))
            end_of_day = timezone.make_aware(datetime.combine(hoy, time.max))

            pagos = Pago.objects.filter(fecha_pago__range=(start_of_day, end_of_day))

            role_name = get_role_name(request.user)
            if role_name not in RECAUDACION_ROLES:
                pagos = pagos.filter(usuario_registra=request.user)

            monto_total = Decimal("0.00")
            capital_total = Decimal("0.00")
            ganancia_total = Decimal("0.00")
            mora_total = Decimal("0.00")

            pagos = pagos.select_related("prestamo", "prestamo__plan")

            for pago in pagos:
                monto_pagado = pago.monto_pagado
                monto_total += monto_pagado

                prestamo = pago.prestamo
                if prestamo:
                    tasa_interes = prestamo.interes / Decimal("100")
                    tasa_mora = prestamo.plan.mora / Decimal("100") if prestamo.plan else Decimal("0.00")
                    
                    # Evitar división por cero si la tasa es -100% (caso improbable pero posible en datos corruptos)
                    divisor_interes = Decimal("1.00") + tasa_interes
                    interes_ratio = tasa_interes / divisor_interes if divisor_interes != 0 else Decimal("0.00")
                    ganancia_estimada = monto_pagado * interes_ratio
                    
                    divisor_mora = Decimal("1.00") + tasa_interes + tasa_mora
                    mora_ratio = tasa_mora / divisor_mora if divisor_mora != 0 else Decimal("0.00")
                    mora_estimada = monto_pagado * mora_ratio if tasa_mora > 0 else Decimal("0.00")
                    
                    capital_estimado = monto_pagado - ganancia_estimada - mora_estimada
                    
                    capital_total += capital_estimado
                    ganancia_total += ganancia_estimada
                    mora_total += mora_estimada
                else:
                    capital_total += monto_pagado

            # Use a simpler queryset for stats to avoid overhead
            prestamos_user = Prestamo.objects.filter(fecha_desembolso__isnull=False)
            role_name = get_role_name(request.user)
            if role_name not in RECAUDACION_ROLES:
                prestamos_user = prestamos_user.filter(cliente__asesor=request.user)
            
            por_recaudar_hoy = Cuota.objects.filter(
                prestamo__in=prestamos_user,
                fecha_vencimiento=hoy,
                estado_cuota__in=['pendiente', 'parcial', 'vencida']
            ).aggregate(total=Sum('saldo_cuota'))['total'] or Decimal("0.00")

            clientes_ruta = Cuota.objects.filter(
                prestamo__in=prestamos_user,
                fecha_vencimiento=hoy,
                estado_cuota__in=['pendiente', 'parcial', 'vencida']
            ).values('prestamo__cliente').distinct().count()

            clientes_atrasados = Cuota.objects.filter(
                prestamo__in=prestamos_user,
                fecha_vencimiento__lt=hoy,
                estado_cuota__in=['pendiente', 'parcial', 'vencida']
            ).values('prestamo__cliente').distinct().count()

            return Response({
                "monto_recaudado": round(monto_total, 2),
                "capital_recaudado": round(capital_total, 2),
                "mora_recaudada": round(mora_total, 2),
                "ganancia_recaudada": round(ganancia_total, 2),
                "monto_por_recaudar_hoy": round(por_recaudar_hoy, 2),
                "clientes_ruta": clientes_ruta,
                "clientes_atrasados": clientes_atrasados
            }, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"detail": f"Error interno en dashboard-stats: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DescargarDocumentoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def dispatch(self, request, *args, **kwargs):
        print(f"DEBUG: Dispatching {request.method} {request.path} to DescargarDocumentoView")
        return super().dispatch(request, *args, **kwargs)

    def get(self, request, loan_id=None, doc_type=None):
        try:
            print(f"DEBUG: Entering GET with loan_id={loan_id}, doc_type={doc_type}")
            out_format = request.query_params.get('format', 'docx').lower()
            if out_format not in ['docx', 'pdf']:
                return Response({"detail": "Formato no soportado. Use 'docx' o 'pdf'."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Verificar permisos
            if not has_any_permission(request.user, "ver_prestamo"):
                return Response({"detail": "No tienes permiso para ver este documento."}, status=status.HTTP_403_FORBIDDEN)

            file_path, error = generate_loan_document(loan_id, doc_type, out_format)
            
            if error:
                return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
                
            if not file_path or not os.path.exists(file_path):
                return Response({"detail": f"Error: El archivo no se generó en {file_path}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Guardar en bucket y registrar en la tabla 'documentos'
            try:
                _, storage_error = save_document_to_storage(loan_id, file_path, doc_type, out_format, request.user)
                if storage_error:
                    print(f"Error guardando documento en bucket: {storage_error}")
            except Exception as e:
                print(f"Excepción guardando documento: {str(e)}")

            content_type = 'application/pdf' if out_format == 'pdf' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            
            # Nombre del archivo para la descarga
            filename = f"{doc_type}_{loan_id}.{out_format}"
            
            response = FileResponse(open(file_path, 'rb'), content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            import traceback
            print(f"FATAL ERROR in DescargarDocumentoView: {str(e)}")
            print(traceback.format_exc())
            return Response({"detail": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def descarga_documento_fbv(request, loan_id, doc_type):
    out_format = request.GET.get('format', 'docx').lower()
    
    # Generar el documento
    file_path, error = generate_loan_document(loan_id, doc_type, out_format)
    
    if error:
        return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
        
    if not file_path or not os.path.exists(file_path):
        return Response({"detail": f"Error: El archivo no existe en {file_path}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Determinar el tipo de contenido
    content_type = 'application/pdf' if out_format == 'pdf' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    
    # Nombre del archivo para la descarga
    filename = f"{doc_type}_{loan_id}.{out_format}"
    
    response = FileResponse(open(file_path, 'rb'), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
