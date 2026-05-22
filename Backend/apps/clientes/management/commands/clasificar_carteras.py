from django.core.management.base import BaseCommand

from apps.clientes.classification import clasificar_carteras_por_mora


class Command(BaseCommand):
    help = (
        "Clasifica automáticamente las carteras de clientes según comportamiento "
        "de pago: mueve a Cartera Vencida o Cartera Muerta y agrega a lista negra."
    )

    def handle(self, *args, **options):
        self.stdout.write("▶ Iniciando clasificación de carteras por mora...")

        result = clasificar_carteras_por_mora(usuario_trigger=None)

        self.stdout.write(
            self.style.SUCCESS(
                f"✔ Movidos a Cartera Vencida  : {result['movidos_vencida']}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"✔ Movidos a Cartera Muerta   : {result['movidos_muerta']}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"✔ Agregados a Lista Negra    : {result['agregados_lista_negra']}"
            )
        )

        if result["errores"]:
            self.stdout.write(self.style.WARNING("⚠ Errores encontrados:"))
            for err in result["errores"]:
                self.stderr.write(f"  - {err}")
        else:
            self.stdout.write(self.style.SUCCESS("✔ Sin errores."))
