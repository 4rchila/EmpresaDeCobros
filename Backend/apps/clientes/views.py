from django.conf import settings
from django.db.models import Prefetch, Q
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from apps.prestamos.models import Prestamo
from apps.notificaciones.models import Notificacion
from apps.bitacora.utils import registrar_en_bitacora
from .models import Cartera, Cliente, InformeNuevoCliente, ListaNegraCliente
from .serializers import (
    CarteraCreateSerializer,
    CarteraUpdateSerializer,
    ClienteCreateSerializer,
    ClienteUpdateSerializer,
    ClienteDetailSerializer,
    ClientePhotoUploadSerializer,
    ClienteListSerializer,
    InformeNuevoClienteDetailSerializer,
    InformeNuevoClienteListSerializer,
    ListaNegraAddSerializer,
    ListaNegraItemSerializer,
    MoverClienteCarteraSerializer,
    PortafolioCarteraSerializer,
    PortafolioClienteSerializer,
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


def is_admin_user(user) -> bool:
    return get_role_name(user) in ADMIN_ROLES


class ClientePhotoUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not has_any_permission(request.user, "crear_cliente"):
            return Response(
                {"detail": "No tienes permiso para subir fotos de clientes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ClientePhotoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_201_CREATED)


def get_creditor_queryset_for_user(user):
    queryset = (
        Cliente.objects.select_related("asesor", "cartera", "cartera__usuario_responsable")
        .prefetch_related(
            "telefonos",
            "referencias",
            "fotos",
            "registros_lista_negra",
            "informacion_laboral",
        )
        .order_by("-id")
    )

    if is_admin_user(user):
        return queryset

    return queryset.filter(Q(asesor=user) | Q(cartera__usuario_responsable=user)).distinct()


def get_portafolio_client_queryset_for_user(user):
    queryset = (
        Cliente.objects.select_related("asesor", "cartera", "cartera__usuario_responsable")
        .prefetch_related(
            "telefonos",
            Prefetch(
                "prestamos",
                queryset=Prestamo.objects.select_related("plan").prefetch_related(
                    "garantias",
                    "garantias__fotos",
                    "garantias__evaluaciones",
                ),
            ),
        )
        .filter(
            estado_cliente="activo",
            prestamos__isnull=False,
        )
        .order_by("id")
        .distinct()
    )

    return queryset.filter(
        Q(asesor=user) | Q(cartera__usuario_responsable=user)
    ).distinct()

class CreditorsCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not has_any_permission(
            request.user,
            "crear_acreedor",
            "crear_cliente",
        ):
            return Response(
                {"detail": "No tienes permiso para registrar clientes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ClienteCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        cliente = serializer.save()

        # Log to Bitacora
        registrar_en_bitacora(
            usuario=request.user,
            categoria='cliente',
            titulo=f'Nuevo cliente registrado - {cliente.nombre_completo}',
            descripcion=f'Se registró al cliente {cliente.nombre_completo} con DPI {cliente.dpi}.',
            detalles={'DPI': cliente.dpi, 'Teléfono': cliente.telefonos.first().numero if cliente.telefonos.exists() else 'N/A'}
        )

        output = ClienteDetailSerializer(cliente)
        return Response(output.data, status=status.HTTP_201_CREATED)


class CreditorsSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_any_permission(
            request.user,
            "buscar_acreedor",
            "buscar_cliente",
            "ver_acreedor",
            "ver_cliente",
            "ver_acreedores_globales",
        ):
            return Response(
                {"detail": "No tienes permiso para buscar clientes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        q = (request.query_params.get("q") or "").strip()

        queryset = get_creditor_queryset_for_user(request.user).filter(
            estado_cliente="activo"
        )

        if q:
            queryset = queryset.filter(
                Q(nombres__icontains=q)
                | Q(apellidos__icontains=q)
                | Q(dpi__icontains=q)
                | Q(nit__icontains=q)
            )

        serializer = ClienteListSerializer(queryset[:100], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreditorDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, creditor_id: int):
        if not has_any_permission(
            request.user,
            "ver_acreedor",
            "ver_cliente",
            "buscar_acreedor",
            "buscar_cliente",
        ):
            return Response(
                {"detail": "No tienes permiso para ver este cliente."},
                status=status.HTTP_403_FORBIDDEN,
            )

        cliente = get_creditor_queryset_for_user(request.user).filter(pk=creditor_id).first()

        if not cliente:
            return Response(
                {"detail": "Cliente no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ClienteDetailSerializer(cliente)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, creditor_id: int):
        if not has_any_permission(
            request.user,
            "crear_acreedor",
            "crear_cliente",
        ):
            return Response(
                {"detail": "No tienes permiso para editar clientes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        cliente = Cliente.objects.filter(pk=creditor_id).first()
        if not cliente:
            return Response(
                {"detail": "Cliente no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ClienteUpdateSerializer(cliente, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        cliente = serializer.save()

        # Log to Bitacora
        registrar_en_bitacora(
            usuario=request.user,
            categoria='cliente',
            titulo=f'Cliente actualizado - {cliente.nombre_completo}',
            descripcion=f'Se actualizaron los datos del cliente {cliente.nombre_completo}.',
            detalles={'DPI': cliente.dpi}
        )

        output = ClienteDetailSerializer(cliente, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)


class PendingPrequalificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not is_admin_user(request.user):
            return Response(
                {"detail": "No tienes permiso para ver pendientes de precalificación."},
                status=status.HTTP_403_FORBIDDEN,
            )

        q = (request.query_params.get("q") or "").strip()

        queryset = (
            InformeNuevoCliente.objects.select_related(
                "cliente",
                "cliente__asesor",
                "cliente__cartera",
                "usuario_creador",
            )
            .prefetch_related(
                "cliente__telefonos",
                "cliente__referencias",
                "cliente__fotos",
                "cliente__informacion_laboral",
            )
            .filter(estado_revision="pendiente")
            .order_by("-id")
        )

        if q:
            queryset = queryset.filter(
                Q(cliente__nombres__icontains=q)
                | Q(cliente__apellidos__icontains=q)
                | Q(cliente__dpi__icontains=q)
            )

        serializer = InformeNuevoClienteListSerializer(queryset[:100], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PendingPrequalificationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, informe_id: int):
        if not is_admin_user(request.user):
            return Response(
                {"detail": "No tienes permiso para ver este informe."},
                status=status.HTTP_403_FORBIDDEN,
            )

        informe = (
            InformeNuevoCliente.objects.select_related(
                "cliente",
                "cliente__asesor",
                "cliente__cartera",
                "usuario_creador",
            )
            .prefetch_related(
                "cliente__telefonos",
                "cliente__referencias",
                "cliente__fotos",
                "cliente__informacion_laboral",
            )
            .filter(pk=informe_id)
            .first()
        )

        if not informe:
            return Response(
                {"detail": "Informe no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = InformeNuevoClienteDetailSerializer(informe)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BlacklistListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        role_name = get_role_name(request.user)

        if role_name in {"secretaria", "asesor"}:
            return Response(
                {"detail": "No tienes permiso para ver la lista negra."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not has_any_permission(
            request.user,
            "ver_lista_negra",
            "validar_lista_negra",
            "agregar_lista_negra",
        ):
            return Response(
                {"detail": "No tienes permiso para ver la lista negra."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = (
            ListaNegraCliente.objects.select_related(
                "cliente",
                "cliente__asesor",
            )
            .prefetch_related("cliente__telefonos", "cliente__registros_lista_negra")
            .order_by("-id")
        )

        serializer = ListaNegraItemSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BlacklistAddView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        role_name = get_role_name(request.user)

        if role_name in {"secretaria", "asesor"}:
            return Response(
                {"detail": "No tienes permiso para modificar la lista negra."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not has_any_permission(
            request.user,
            "agregar_lista_negra",
            "validar_lista_negra",
            "ver_lista_negra",
        ):
            return Response(
                {"detail": "No tienes permiso para modificar la lista negra."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ListaNegraAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()

        output = ListaNegraItemSerializer(item)
        return Response(output.data, status=status.HTTP_201_CREATED)


class BlacklistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        view = BlacklistListView()
        view.request = request
        view.args = ()
        view.kwargs = {}
        return view.get(request)

    def post(self, request):
        view = BlacklistAddView()
        view.request = request
        view.args = ()
        view.kwargs = {}
        return view.post(request)


class PortfolioBoardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        try:
            # Permitimos a cualquier usuario autenticado ver sus propias carteras.
            today = timezone.localdate()

            # 1. Asegurarnos de que exista una cartera "Vencida" para el usuario
            # Usamos .filter().first() en lugar de get_or_create para evitar MultipleObjectsReturned
            cartera_vencida = Cartera.objects.filter(
                usuario_responsable=request.user,
                estado='vencida'
            ).first()

            if not cartera_vencida:
                try:
                    cartera_vencida = Cartera.objects.create(
                        usuario_responsable=request.user,
                        nombre_cartera='Cartera Vencida',
                        estado='vencida'
                    )
                except Exception as e:
                    print(f"Error creando cartera vencida: {e}")
                    # Si falla la creación, simplemente no movemos clientes hoy
                    cartera_vencida = None

            # 2. Identificar clientes del usuario con cuotas vencidas (saldo > 0 y fecha < hoy)
            if cartera_vencida:
                from apps.prestamos.models import Cuota
                clientes_mora_ids = Cuota.objects.filter(
                    prestamo__cliente__asesor=request.user,
                    fecha_vencimiento__lt=today,
                    saldo_cuota__gt=0,
                    estado_cuota__in=['pendiente', 'parcial', 'vencida']
                ).values_list('prestamo__cliente_id', flat=True).distinct()

                # 3. Mover esos clientes a la cartera vencida si no están ya en una vencida/muerta
                if clientes_mora_ids:
                    Cliente.objects.filter(
                        id__in=clientes_mora_ids
                    ).exclude(
                        cartera__estado__in=['vencida', 'muerta']
                    ).update(cartera=cartera_vencida)

            client_queryset = get_portafolio_client_queryset_for_user(request.user)
            carteras_queryset = Cartera.objects.filter(usuario_responsable=request.user).order_by("nombre_cartera")
            
            carteras_data = PortafolioCarteraSerializer(
                carteras_queryset,
                many=True,
                context={"request": request},
            ).data

            clientes_por_cartera = {}
            for cliente in client_queryset:
                cartera_key = cliente.cartera_id
                serialized_cliente = PortafolioClienteSerializer(
                    cliente,
                    context={"request": request},
                ).data

                if cartera_key is None:
                    clientes_por_cartera.setdefault("sin_cartera", []).append(serialized_cliente)
                else:
                    clientes_por_cartera.setdefault(cartera_key, []).append(serialized_cliente)

            result_carteras = []
            for cartera in carteras_data:
                result_carteras.append(
                    {
                        **cartera,
                        "clientes": clientes_por_cartera.get(cartera["id"], []),
                    }
                )

            return Response(
                {
                    "carteras": result_carteras,
                    "sin_cartera": clientes_por_cartera.get("sin_cartera", []),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            import traceback
            print("!!! ERROR EN PORTFOLIO BOARD VIEW !!!")
            print(traceback.format_exc())
            return Response(
                {"detail": f"Error interno al cargar el portafolio: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PortfolioCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Permitimos a cualquier usuario autenticado crear sus propias carteras.

        serializer = CarteraCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        cartera = serializer.save()

        output = PortafolioCarteraSerializer(cartera, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class PortfolioDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, cartera_id: int):
        # Permitimos a cualquier usuario autenticado editar sus propias carteras.

        cartera = Cartera.objects.select_related("usuario_responsable").filter(pk=cartera_id).first()

        if not cartera:
            return Response(
                {"detail": "Cartera no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if cartera.usuario_responsable_id != request.user.id:
            return Response(
                {"detail": "Solo puedes editar tus propias carteras."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CarteraUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cartera = serializer.update(cartera, serializer.validated_data)

        output = PortafolioCarteraSerializer(cartera, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)

    def delete(self, request, cartera_id: int):
        # Permitimos a cualquier usuario autenticado eliminar sus propias carteras.

        cartera = Cartera.objects.select_related("usuario_responsable").filter(pk=cartera_id).first()

        if not cartera:
            return Response(
                {"detail": "Cartera no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if cartera.usuario_responsable_id != request.user.id:
            return Response(
                {"detail": "Solo puedes eliminar tus propias carteras."},
                status=status.HTTP_403_FORBIDDEN,
            )

        clientes_asociados = Cliente.objects.filter(cartera_id=cartera.id).count()
        if clientes_asociados > 0:
            return Response(
                {"detail": "No puedes eliminar una cartera que todavía tiene clientes asignados."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cartera.delete()
        return Response(
            {"detail": "Cartera eliminada correctamente."},
            status=status.HTTP_200_OK,
        )





class MoveClientPortfolioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Permitimos a cualquier usuario autenticado mover sus clientes entre carteras.
        # El serializador ya valida que las carteras pertenezcan al usuario.

        serializer = MoverClienteCarteraSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        cliente = serializer.save()
        output = PortafolioClienteSerializer(cliente)
        return Response(output.data, status=status.HTTP_200_OK)

class PendingPrequalificationApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, informe_id: int):
        if not is_admin_user(request.user):
            return Response(
                {"detail": "No tienes permiso para aprobar precalificación."},
                status=status.HTTP_403_FORBIDDEN,
            )

        informe = (
            InformeNuevoCliente.objects.select_related("cliente")
            .filter(pk=informe_id)
            .first()
        )

        if not informe:
            return Response(
                {"detail": "Informe no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if informe.estado_revision == "aprobado":
            return Response(
                {"detail": "El informe ya fue aprobado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cliente = informe.cliente
        cliente.estado_cliente = "activo"
        
        # Asignar cartera principal del asesor si no tiene una
        if cliente.asesor and not cliente.cartera:
            cartera_principal = Cartera.objects.filter(
                usuario_responsable=cliente.asesor,
                nombre_cartera__iexact="Cartera Principal"
            ).first()
            
            if not cartera_principal:
                cartera_principal = Cartera.objects.create(
                    usuario_responsable=cliente.asesor,
                    nombre_cartera="Cartera Principal",
                    estado="activa",
                    fecha_inicio=timezone.localdate()
                )
            cliente.cartera = cartera_principal
            cliente.save(update_fields=["estado_cliente", "cartera"])
        else:
            cliente.save(update_fields=["estado_cliente"])

        informe.estado_revision = "aprobado"
        informe.observaciones = (
            (informe.observaciones or "").strip() + "\nPrecalificación aprobada."
        ).strip()
        informe.save(update_fields=["estado_revision", "observaciones"])

        # Notify the advisor
        if cliente.asesor:
            Notificacion.objects.create(
                usuario_destino=cliente.asesor,
                tipo='precalificacion',
                titulo='Cliente Aprobado',
                mensaje=f'La precalificación del cliente {cliente.nombre_completo} ha sido aprobada.',
            )

        # Log to Bitacora
        registrar_en_bitacora(
            usuario=request.user,
            categoria='sistema',
            titulo=f'Precalificación aprobada - {cliente.nombre_completo}',
            descripcion=f'Se aprobó la precalificación del cliente {cliente.nombre_completo}.',
            detalles={'Cliente': cliente.nombre_completo, 'DPI': cliente.dpi}
        )

        return Response(
            {
                "detail": "Precalificación aprobada correctamente.",
                "cliente_id": cliente.id,
                "estado_cliente": cliente.estado_cliente,
                "estado_revision": informe.estado_revision,
            },
            status=status.HTTP_200_OK,
        )