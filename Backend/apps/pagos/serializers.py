from rest_framework import serializers
from .models import Caja, IngresoCaja, EgresoCaja, Desembolso
from apps.users.serializers import UsuarioListSerializer
from apps.prestamos.serializers import PrestamoListSerializer

class CajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caja
        fields = '__all__'

class IngresoCajaSerializer(serializers.ModelSerializer):
    usuario_registra_info = UsuarioListSerializer(source='usuario_registra', read_only=True)
    
    class Meta:
        model = IngresoCaja
        fields = '__all__'

class EgresoCajaSerializer(serializers.ModelSerializer):
    usuario_registra_info = UsuarioListSerializer(source='usuario_registra', read_only=True)

    class Meta:
        model = EgresoCaja
        fields = '__all__'

class MovimientoCajaSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    date = serializers.DateTimeField()
    description = serializers.CharField()
    category = serializers.CharField()
    usuario = serializers.CharField(allow_null=True, required=False)

class RegistrarEgresoSerializer(serializers.Serializer):
    monto = serializers.DecimalField(max_digits=12, decimal_places=2)
    tipo_egreso = serializers.CharField(max_length=50)
    descripcion = serializers.CharField()

class DesembolsoSerializer(serializers.ModelSerializer):
    prestamo_info = PrestamoListSerializer(source='prestamo', read_only=True)
    
    class Meta:
        model = Desembolso
        fields = '__all__'
