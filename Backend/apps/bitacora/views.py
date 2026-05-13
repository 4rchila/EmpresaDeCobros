from django.db.models import Q
from rest_framework import generics, permissions
from .models import Bitacora
from .serializers import BitacoraSerializer

from apps.users.permissions import IsAdminUser

class BitacoraListView(generics.ListAPIView):
    serializer_class = BitacoraSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        queryset = Bitacora.objects.select_related('usuario').all()
        categoria = self.request.query_params.get('categoria')
        search = self.request.query_params.get('q')

        if categoria:
            queryset = queryset.filter(categoria=categoria)
        
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search) |
                Q(descripcion__icontains=search) |
                Q(usuario__username__icontains=search)
            )
            
        return queryset
