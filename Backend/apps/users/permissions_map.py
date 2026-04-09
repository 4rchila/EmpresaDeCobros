from __future__ import annotations

from typing import Dict, List

PERMISSION_DEFINITIONS: Dict[str, str] = {
    "crear_acreedor": "Crear nuevos acreedores.",
    "buscar_acreedor": "Buscar y consultar acreedores.",
    "validar_lista_negra": "Validar si un acreedor existe en lista negra sin ver el catálogo completo.",
    "ver_lista_negra": "Consultar el catálogo completo de lista negra.",
    "aprobar_acreedor_precalificacion": "Aprobar solicitudes en precalificación.",
    "aprobar_acreedor_final": "Aprobar solicitudes finales de acreedores.",
    "autorizar_desembolso": "Autorizar el desembolso de préstamos.",
    "crear_prestamo": "Crear solicitudes o préstamos.",
    "ver_solicitudes_globales": "Ver solicitudes pendientes de todos los asesores.",
    "crear_planes_cobro": "Crear planes de cobro.",
    "asignar_lista_negra": "Agregar acreedores a lista negra.",
    "transferir_cartera_entre_asesores": "Transferir carteras entre asesores.",
    "transferir_entre_carteras_propias": "Mover registros dentro de una cartera permitida.",
    "registrar_pago_cartera_propia": "Registrar pagos solo en cartera propia.",
    "registrar_pago_cualquier_acreedor": "Registrar pagos de cualquier acreedor.",
    "ver_cobros_dia_propio": "Ver cobros del día de la cartera propia.",
    "ver_cobros_globales": "Ver cobros globales de todos los asesores.",
    "ingresar_recaudo_caja": "Registrar ingreso de recaudo a caja.",
    "aprobar_recaudo_caja": "Aprobar ingresos de caja.",
    "registrar_egresos_caja_fuerte": "Registrar egresos de caja fuerte.",
    "ver_historial_caja_fuerte": "Consultar historial de caja fuerte.",
    "reportes_cartera_global": "Ver reportes globales de cartera.",
    "reportes_rendimiento_todos_asesores": "Ver reportes de rendimiento de todos los asesores.",
    "ver_acreedores_globales": "Ver acreedores de todos los asesores.",
    "simulador_pagos": "Usar el simulador de pagos.",
    "crear_cuentas_asesores": "Crear cuentas de usuarios y asesores.",
    "bitacora_sistema_lectura": "Consultar la bitácora del sistema.",
    "ver_cumpleanios_y_prestamos": "Ver recordatorios de cumpleaños y préstamos.",
    "ruta_cobro_propia": "Ver la ruta de cobro propia.",
}

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "Gerente": [
        "crear_acreedor",
        "buscar_acreedor",
        "validar_lista_negra",
        "ver_lista_negra",
        "asignar_lista_negra",
        "aprobar_acreedor_precalificacion",
        "aprobar_acreedor_final",
        "autorizar_desembolso",
        "crear_prestamo",
        "ver_solicitudes_globales",
        "crear_planes_cobro",
        "transferir_cartera_entre_asesores",
        "transferir_entre_carteras_propias",
        "registrar_pago_cartera_propia",
        "registrar_pago_cualquier_acreedor",
        "ver_cobros_dia_propio",
        "ver_cobros_globales",
        "ingresar_recaudo_caja",
        "aprobar_recaudo_caja",
        "registrar_egresos_caja_fuerte",
        "ver_historial_caja_fuerte",
        "reportes_cartera_global",
        "reportes_rendimiento_todos_asesores",
        "ver_acreedores_globales",
        "simulador_pagos",
        "crear_cuentas_asesores",
        "bitacora_sistema_lectura",
        "ver_cumpleanios_y_prestamos",
        "ruta_cobro_propia",
    ],
    "Secretaria": [
        "crear_acreedor",
        "buscar_acreedor",
        "crear_prestamo",
        "registrar_pago_cualquier_acreedor",
        "ver_cobros_dia_propio",
        "ingresar_recaudo_caja",
        "ver_cumpleanios_y_prestamos",
        "ruta_cobro_propia",
    ],
    "Asesor": [
        "crear_acreedor",
        "buscar_acreedor",
        "validar_lista_negra",
        "crear_prestamo",
        "registrar_pago_cartera_propia",
        "ver_cobros_dia_propio",
        "ver_cumpleanios_y_prestamos",
        "ruta_cobro_propia",
    ],
}


def get_all_permission_codes() -> List[str]:
    return sorted(PERMISSION_DEFINITIONS.keys())


def get_permissions_for_role_name(role_name: str | None) -> List[str]:
    return sorted(set(ROLE_PERMISSIONS.get(role_name or "", [])))


def sync_permissions_to_database() -> None:
    from .models import Permission, Role, RolePermission

    permission_cache = {}
    for code, description in PERMISSION_DEFINITIONS.items():
        permission, _ = Permission.objects.update_or_create(
            code=code,
            defaults={"description": description},
        )
        permission_cache[code] = permission

    for role_name, permission_codes in ROLE_PERMISSIONS.items():
        role, _ = Role.objects.get_or_create(name=role_name)
        desired_codes = set(permission_codes)
        current_codes = set(
            RolePermission.objects.filter(role=role).values_list("permission__code", flat=True)
        )

        for code in desired_codes - current_codes:
            RolePermission.objects.create(role=role, permission=permission_cache[code])

        RolePermission.objects.filter(role=role).exclude(
            permission__code__in=desired_codes
        ).delete()


def get_permissions_for_user(user) -> List[str]:
    if not getattr(user, "is_authenticated", False):
        return []

    if getattr(user, "is_superuser", False):
        return get_all_permission_codes()

    role = getattr(user, "role", None)
    role_name = getattr(role, "name", None)
    if not role_name:
        return []

    try:
        from .models import RolePermission

        db_permissions = list(
            RolePermission.objects.filter(role=role)
            .select_related("permission")
            .values_list("permission__code", flat=True)
        )
        if db_permissions:
            return sorted(set(db_permissions))
    except Exception:
        pass

    return get_permissions_for_role_name(role_name)


def user_has_permission(user, permission_code: str) -> bool:
    return permission_code in get_permissions_for_user(user)
