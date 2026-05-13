from django.db import models
from apps.users.models import Usuario

class Notificacion(models.Model):
    id = models.AutoField(primary_key=True, db_column="id_notificacion")
    usuario_destino = models.ForeignKey(
        Usuario, 
        on_delete=models.CASCADE, 
        related_name="notificaciones",
        db_column="id_usuario_destino"
    )
    tipo = models.CharField(max_length=50, db_column="tipo_notificacion")
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    completada = models.CharField(max_length=30, default="pendiente", db_column="estado_notificacion")
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notificaciones"
        ordering = ["-fecha_creacion"]
        managed = False

    def __str__(self):
        return f"{self.titulo} - {self.usuario_destino.username}"
