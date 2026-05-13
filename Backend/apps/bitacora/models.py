from django.db import models
from apps.users.models import Usuario

class Bitacora(models.Model):
    CATEGORIAS = [
        ('ingreso', 'Ingreso'),
        ('egreso', 'Egreso'),
        ('prestamo', 'Préstamo'),
        ('pago', 'Pago'),
        ('cliente', 'Cliente'),
        ('asesor', 'Asesor'),
        ('garantia', 'Garantía'),
        ('caja', 'Caja Fuerte'),
        ('sistema', 'Sistema'),
        ('mora', 'Mora'),
    ]

    usuario = models.ForeignKey(
        Usuario, 
        on_delete=models.SET_NULL, 
        null=True, 
        db_column="id_usuario"
    )
    categoria = models.CharField(max_length=20, choices=CATEGORIAS)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    monto = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    detalles = models.JSONField(default=dict, blank=True) # Para almacenar pares campo-valor

    class Meta:
        db_table = "bitacora"
        ordering = ["-fecha_creacion"]

    def __str__(self):
        return f"[{self.categoria}] {self.titulo} - {self.fecha_creacion}"
