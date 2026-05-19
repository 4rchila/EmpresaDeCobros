from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Caja, IngresoCaja, EgresoCaja
from .serializers import CajaSerializer, MovimientoCajaSerializer, RegistrarEgresoSerializer
from django.db import transaction
from apps.bitacora.utils import registrar_en_bitacora

class CajaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # We assume there is a main Caja (e.g., id_caja=1). If it doesn't exist, we return an error or empty.
        caja = Caja.objects.first()
        if not caja:
            return Response({"error": "No se encontró ninguna caja fuerte configurada."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CajaSerializer(caja)
        return Response(serializer.data)


class MovimientosCajaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        caja = Caja.objects.first()
        if not caja:
            return Response([], status=status.HTTP_200_OK)

        ingresos = IngresoCaja.objects.filter(caja=caja)
        egresos = EgresoCaja.objects.filter(caja=caja)

        movimientos = []
        for ing in ingresos:
            movimientos.append({
                "id": f"ing-{ing.id_ingreso_caja}",
                "type": "ingreso",
                "amount": ing.monto,
                "date": ing.fecha_ingreso,
                "description": ing.descripcion or f"Ingreso de caja: {ing.tipo_ingreso}",
                "category": ing.tipo_ingreso,
                "usuario": f"{ing.usuario_registra.nombres} {ing.usuario_registra.apellidos}" if ing.usuario_registra else "Sistema"
            })
        
        for egr in egresos:
            movimientos.append({
                "id": f"egr-{egr.id_egreso_caja}",
                "type": "egreso",
                "amount": egr.monto,
                "date": egr.fecha_egreso,
                "description": egr.descripcion or f"Egreso de caja: {egr.tipo_egreso}",
                "category": egr.tipo_egreso,
                "usuario": f"{egr.usuario_registra.nombres} {egr.usuario_registra.apellidos}" if egr.usuario_registra else "Sistema"
            })

        # Sort by date descending
        movimientos.sort(key=lambda x: x["date"], reverse=True)
        
        serializer = MovimientoCajaSerializer(movimientos, many=True)
        return Response(serializer.data)


class RegistrarEgresoView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        caja = Caja.objects.first()
        if not caja:
            return Response({"error": "No se encontró ninguna caja fuerte."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RegistrarEgresoSerializer(data=request.data)
        if serializer.is_valid():
            monto = serializer.validated_data['monto']
            tipo_egreso = serializer.validated_data['tipo_egreso']
            descripcion = serializer.validated_data['descripcion']

            if caja.saldo_actual < monto:
                return Response({"error": "Fondos insuficientes en la caja fuerte."}, status=status.HTTP_400_BAD_REQUEST)

            # Restar del saldo de la caja
            caja.saldo_actual -= monto
            caja.save()

            # Registrar egreso
            egreso = EgresoCaja.objects.create(
                caja=caja,
                usuario_registra=request.user,
                tipo_egreso=tipo_egreso,
                monto=monto,
                descripcion=descripcion
            )

            # Log to Bitacora
            registrar_en_bitacora(
                usuario=request.user,
                categoria='egreso',
                titulo=f'Egreso manual de caja - {tipo_egreso}',
                descripcion=f'Se registró un egreso de Q{monto} de la caja fuerte. Motivo: {descripcion or tipo_egreso}.',
                monto=monto,
                detalles={'tipo_egreso': tipo_egreso, 'descripcion': descripcion, 'egreso_id': egreso.id_egreso_caja}
            )

            return Response({"message": "Egreso registrado exitosamente."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
