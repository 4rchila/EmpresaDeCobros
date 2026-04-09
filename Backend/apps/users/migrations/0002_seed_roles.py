from django.db import migrations


ROLES = ["Gerente", "Secretaria", "Asesor"]


def seed_roles(apps, schema_editor):
    Role = apps.get_model("users", "Role")
    for name in ROLES:
        Role.objects.get_or_create(name=name)


def unseed_roles(apps, schema_editor):
    Role = apps.get_model("users", "Role")
    Role.objects.filter(name__in=ROLES).delete()


class Migration(migrations.Migration):
    dependencies = [("users", "0001_initial")]

    operations = [migrations.RunPython(seed_roles, unseed_roles)]
