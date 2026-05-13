from rest_framework import serializers
from .models import Bitacora

class BitacoraSerializer(serializers.ModelSerializer):
    usuario = serializers.CharField(source='usuario.username', read_only=True)
    fecha = serializers.SerializerMethodField()
    hora = serializers.SerializerMethodField()
    detalles = serializers.SerializerMethodField()

    class Meta:
        model = Bitacora
        fields = [
            'id', 'fecha', 'hora', 'categoria', 'titulo', 
            'descripcion', 'usuario', 'monto', 
            'detalles'
        ]

    def get_fecha(self, obj):
        return obj.fecha_creacion.strftime('%d/%m/%Y')

    def get_hora(self, obj):
        return obj.fecha_creacion.strftime('%H:%M')

    def get_detalles(self, obj):
        # Convert JSON dict to list of {campo, valor} for the frontend
        if not obj.detalles:
            return []
        return [{"campo": k, "valor": v} for k, v in obj.detalles.items()]
