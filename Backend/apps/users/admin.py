from django.contrib import admin

from .models import Empleado, Permission, Role, RolePermission, Usuario


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description")
    search_fields = ("name",)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "description")
    search_fields = ("code",)


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("id", "role", "permission")
    list_select_related = ("role", "permission")
    search_fields = ("role__name", "permission__code")


@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ("id", "nombres", "apellidos", "puesto", "estado_laboral")
    search_fields = ("nombres", "apellidos", "puesto")


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "role", "empleado", "estado", "fecha_creacion")
    list_select_related = ("role", "empleado")
    search_fields = ("email", "empleado__nombres", "empleado__apellidos", "role__name")
    list_filter = ("estado", "role__name")