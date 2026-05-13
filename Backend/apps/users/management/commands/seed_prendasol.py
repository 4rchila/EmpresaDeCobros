from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from apps.users.models import Role, Usuario
from apps.users.permissions_map import ROLE_PERMISSIONS, sync_permissions_to_database


class Command(BaseCommand):
    help = "Crea roles, permisos base y usuarios de prueba para el login de PrendaSol"

    def handle(self, *args, **options):
        # 1. Sync Roles and Permissions
        roles = {}
        for role_name in ROLE_PERMISSIONS.keys():
            role, _ = Role.objects.get_or_create(name=role_name)
            roles[role_name] = role

        sync_permissions_to_database()

        # 2. Sync Demo Users
        demo_users = [
            {
                "username": "gerente",
                "password": "Gerente123*",
                "nombres": "Admin",
                "apellidos": "PrendaSol",
                "email": "gerente@prendasol.local",
                "role": roles["Gerente"],
                "estado": "activo",
                "fecha_creacion": timezone.now(),
            },
            {
                "username": "secretaria",
                "password": "Secretaria123*",
                "nombres": "Secretaria",
                "apellidos": "PrendaSol",
                "email": "secretaria@prendasol.local",
                "role": roles["Secretaria"],
                "estado": "activo",
                "fecha_creacion": timezone.now(),
            },
            {
                "username": "asesor",
                "password": "Asesor123*",
                "nombres": "Asesor",
                "apellidos": "PrendaSol",
                "email": "asesor@prendasol.local",
                "role": roles["Asesor"],
                "estado": "activo",
                "fecha_creacion": timezone.now(),
            },
        ]

        for data in demo_users:
            password = data.pop("password")
            username = data["username"]
            
            user, created = Usuario.objects.get_or_create(
                username=username, 
                defaults={**data, "password_hash": make_password(password)}
            )
            
            if not created:
                # Update fields if user already exists
                for key, value in data.items():
                    setattr(user, key, value)
                user.password_hash = make_password(password)
                user.save()
            
            action = "creado" if created else "actualizado"
            self.stdout.write(self.style.SUCCESS(f"Usuario {username} {action}"))
