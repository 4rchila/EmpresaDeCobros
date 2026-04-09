from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.users.models import Role
from apps.users.permissions_map import ROLE_PERMISSIONS, sync_permissions_to_database


class Command(BaseCommand):
    help = "Crea roles, permisos base y usuarios de prueba para el login de PrendaSol"

    def handle(self, *args, **options):
        roles = {}
        for role_name in ROLE_PERMISSIONS.keys():
            role, _ = Role.objects.get_or_create(name=role_name)
            roles[role_name] = role

        sync_permissions_to_database()

        User = get_user_model()
        demo_users = [
            {
                "username": "gerente",
                "password": "Gerente123*",
                "first_name": "Admin",
                "last_name": "PrendaSol",
                "email": "gerente@prendasol.local",
                "role": roles["Gerente"],
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "username": "secretaria",
                "password": "Secretaria123*",
                "first_name": "Secretaria",
                "last_name": "PrendaSol",
                "email": "secretaria@prendasol.local",
                "role": roles["Secretaria"],
                "is_staff": True,
                "is_superuser": False,
            },
            {
                "username": "asesor",
                "password": "Asesor123*",
                "first_name": "Asesor",
                "last_name": "PrendaSol",
                "email": "asesor@prendasol.local",
                "role": roles["Asesor"],
                "is_staff": False,
                "is_superuser": False,
            },
        ]

        for data in demo_users:
            password = data.pop("password")
            user, created = User.objects.get_or_create(username=data["username"], defaults=data)
            for key, value in data.items():
                setattr(user, key, value)
            user.set_password(password)
            user.save()
            action = "creado" if created else "actualizado"
            self.stdout.write(self.style.SUCCESS(f"Usuario {user.username} {action}"))
