"""
Este archivo queda como compatibilidad temporal.

La lógica real de autenticación y emisión de tokens ahora vive en:
- apps.users.views
- apps.users.authentication
"""

from .views import build_access_token, build_refresh_token

__all__ = ["build_access_token", "build_refresh_token"]