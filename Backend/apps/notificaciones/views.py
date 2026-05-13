from rest_framework import views, permissions, status
from rest_framework.response import Response
from .models import Notificacion
from .serializers import NotificacionSerializer

class NotificacionListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notificaciones = Notificacion.objects.filter(
            usuario_destino=request.user, 
            completada="pendiente"
        )
        serializer = NotificacionSerializer(notificaciones, many=True)
        return Response(serializer.data)

class NotificacionMarkReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notificacion = Notificacion.objects.get(pk=pk, usuario_destino=request.user)
            notificacion.completada = "leido"
            notificacion.save()
            return Response({"status": "success"})
        except Notificacion.DoesNotExist:
            return Response({"error": "Notificación no encontrada"}, status=status.HTTP_404_NOT_FOUND)
