from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Usuario
from .serializers import LoginSerializer, SessionUserSerializer


def build_access_token(user: Usuario) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "type": "access",
        "sub": str(user.id),
        "email": user.email,
        "role": user.role_name,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=8)).timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def build_refresh_token(user: Usuario) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "type": "refresh",
        "sub": str(user.id),
        "email": user.email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def password_matches(raw_password: str, stored_password_hash: str) -> bool:
    if not stored_password_hash:
        return False

    # intento principal: hash compatible con Django
    if check_password(raw_password, stored_password_hash):
        return True

    # respaldo temporal para pruebas locales si algún dato quedó en texto plano
    return raw_password == stored_password_hash


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        password = serializer.validated_data["password"]

        user = (
            Usuario.objects.select_related("empleado", "role")
            .filter(email__iexact=email)
            .first()
        )

        if not user:
            return Response(
                {"detail": "Credenciales inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "La cuenta está inactiva."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not password_matches(password, user.password_hash):
            return Response(
                {"detail": "Credenciales inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        session_user = SessionUserSerializer(user).data
        access = build_access_token(user)
        refresh = build_refresh_token(user)

        return Response(
            {
                "access": access,
                "refresh": refresh,
                "user": session_user,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = SessionUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)