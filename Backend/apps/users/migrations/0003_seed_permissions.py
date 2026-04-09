from django.db import migrations


PERMISSIONS = {
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

ROLE_PERMISSIONS = {
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


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model("users", "Permission")
    Role = apps.get_model("users", "Role")
    RolePermission = apps.get_model("users", "RolePermission")

    permission_map = {}
    for code, description in PERMISSIONS.items():
        permission, _ = Permission.objects.get_or_create(code=code, defaults={"description": description})
        if permission.description != description:
            permission.description = description
            permission.save(update_fields=["description"])
        permission_map[code] = permission

    for role_name, codes in ROLE_PERMISSIONS.items():
        role, _ = Role.objects.get_or_create(name=role_name)
        desired = set(codes)
        current = set(
            RolePermission.objects.filter(role=role).values_list("permission__code", flat=True)
        )

        for code in desired - current:
            RolePermission.objects.create(role=role, permission=permission_map[code])

        RolePermission.objects.filter(role=role).exclude(permission__code__in=desired).delete()


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("users", "Permission")
    RolePermission = apps.get_model("users", "RolePermission")
    codes = list(PERMISSIONS.keys())
    RolePermission.objects.filter(permission__code__in=codes).delete()
    Permission.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):
    dependencies = [("users", "0002_seed_roles")]

    operations = [migrations.RunPython(seed_permissions, unseed_permissions)]
