import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from .models import Usuario


class CustomJWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode("utf-8")

        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2 or parts[0] != self.keyword:
            raise exceptions.AuthenticationFailed("Encabezado de autorización inválido.")

        token = parts[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("El token ha expirado.")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Token inválido.")

        if payload.get("type") != "access":
            raise exceptions.AuthenticationFailed("Tipo de token no permitido.")

        user_id = payload.get("sub")
        if not user_id:
            raise exceptions.AuthenticationFailed("Token sin identificador de usuario.")

        user = (
            Usuario.objects.select_related("empleado", "role")
            .filter(pk=user_id)
            .first()
        )

        if not user:
            raise exceptions.AuthenticationFailed("Usuario no encontrado.")

        if not user.is_active:
            raise exceptions.AuthenticationFailed("Usuario inactivo.")

        return (user, token)