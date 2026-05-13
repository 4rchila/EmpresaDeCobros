from rest_framework.permissions import BasePermission

from .permissions_map import user_has_permission


class IsActiveAuthenticated(BasePermission):
    message = "Debes iniciar sesión con una cuenta activa."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_active)


class HasAppPermission(BasePermission):
    required_permission = None
    message = "No tienes permisos para realizar esta acción."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated or not user.is_active:
            return False

        required = getattr(view, "required_permission", None) or self.required_permission
        if not required:
            return False

        return user_has_permission(user, required)


def require_app_permission(permission_code: str):
    class _RequireAppPermission(HasAppPermission):
        required_permission = permission_code

    _RequireAppPermission.__name__ = f"RequirePermission_{permission_code}"
    return _RequireAppPermission


class IsAdminUser(BasePermission):
    message = "Esta sección es exclusiva para administradores."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated or not user.is_active:
            return False

        return getattr(user, "is_staff", False)
