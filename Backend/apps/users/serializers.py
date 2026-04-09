from rest_framework import serializers

from .models import Usuario


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class SessionUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="role_name", read_only=True)
    full_name = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id",
            "email",
            "role",
            "full_name",
            "first_name",
            "last_name",
            "permissions",
            "estado",
            "fecha_creacion",
        ]

    def get_permissions(self, obj: Usuario) -> list[str]:
        return obj.get_permission_codes()