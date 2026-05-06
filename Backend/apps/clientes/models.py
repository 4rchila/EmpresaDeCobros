from django.db import models

from apps.users.models import Usuario


class Cartera(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_cartera")
    usuario_responsable = models.ForeignKey(
        Usuario,
        on_delete=models.DO_NOTHING,
        db_column="id_usuario_responsable",
        related_name="carteras_propias",
        null=True,
        blank=True,
    )
    nombre_cartera = models.CharField(max_length=120, db_column="nombre_cartera")
    fecha_inicio = models.DateField(null=True, blank=True, db_column="fecha_inicio")
    fecha_fin = models.DateField(null=True, blank=True, db_column="fecha_fin")
    estado = models.CharField(max_length=30, db_column="estado")

    class Meta:
        db_table = "cartera"
        managed = False
        ordering = ["id"]

    def __str__(self):
        return self.nombre_cartera


class Cliente(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_cliente")
    cartera = models.ForeignKey(
        Cartera,
        on_delete=models.DO_NOTHING,
        db_column="id_cartera",
        related_name="clientes",
        null=True,
        blank=True,
    )
    asesor = models.ForeignKey(
        Usuario,
        on_delete=models.DO_NOTHING,
        db_column="id_asesor",
        related_name="clientes_asignados",
        null=True,
        blank=True,
    )
    nombres = models.CharField(max_length=100, db_column="nombres")
    apellidos = models.CharField(max_length=100, db_column="apellidos")
    dpi = models.CharField(max_length=25, db_column="dpi", null=True, blank=True)
    nit = models.CharField(max_length=25, db_column="nit", null=True, blank=True)
    direccion = models.TextField(db_column="direccion", null=True, blank=True)
    municipio = models.CharField(max_length=100, db_column="municipio", null=True, blank=True)
    distrito = models.CharField(max_length=100, db_column="distrito", null=True, blank=True)
    departamento = models.CharField(max_length=100, db_column="departamento", null=True, blank=True)
    ingresos_mensuales = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="ingresos_mensuales",
        default=0,
    )
    egreso_aproximado_mensual = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="egreso_aproximado_mensual",
        default=0,
    )
    fecha_nacimiento = models.DateField(db_column="fecha_nacimiento", null=True, blank=True)
    fecha_registro = models.DateTimeField(db_column="fecha_registro")
    estado_cliente = models.CharField(max_length=30, db_column="estado_cliente")

    class Meta:
        db_table = "clientes"
        managed = False
        ordering = ["-id"]

    def __str__(self):
        return self.nombre_completo

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombres} {self.apellidos}".strip()


class TelefonoCliente(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_telefono")
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.DO_NOTHING,
        db_column="id_cliente",
        related_name="telefonos",
    )
    numero = models.CharField(max_length=20, db_column="numero")
    orden = models.SmallIntegerField(db_column="orden", default=1)
    tipo = models.CharField(max_length=30, db_column="tipo", null=True, blank=True)

    class Meta:
        db_table = "telefonos_cliente"
        managed = False
        ordering = ["cliente_id", "orden"]

    def __str__(self):
        return self.numero


class FotoCliente(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_foto_cliente")
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.DO_NOTHING,
        db_column="id_cliente",
        related_name="fotos",
    )
    ruta_archivo = models.TextField(db_column="ruta_archivo")
    descripcion = models.TextField(db_column="descripcion", null=True, blank=True)

    class Meta:
        db_table = "fotos_cliente"
        managed = False
        ordering = ["id"]

    def __str__(self):
        return self.ruta_archivo


class InformacionLaboral(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_info_laboral")
    cliente = models.OneToOneField(
        Cliente,
        on_delete=models.DO_NOTHING,
        db_column="id_cliente",
        related_name="informacion_laboral",
    )
    lugar_trabajo = models.CharField(max_length=150, db_column="lugar_trabajo", null=True, blank=True)
    direccion_trabajo = models.TextField(db_column="direccion_trabajo", null=True, blank=True)
    puesto = models.CharField(max_length=100, db_column="puesto", null=True, blank=True)
    tiempo_laborando = models.CharField(max_length=100, db_column="tiempo_laborando", null=True, blank=True)
    ingreso_mensual = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="ingreso_mensual",
        default=0,
    )
    egreso_mensual = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="egreso_mensual",
        default=0,
    )
    otras_fuentes_ingreso = models.TextField(db_column="otras_fuentes_ingreso", null=True, blank=True)
    foto_recibo_luz = models.TextField(db_column="foto_recibo_luz", null=True, blank=True)

    class Meta:
        db_table = "informacion_laboral"
        managed = False

    def __str__(self):
        return f"Laboral de {self.cliente}"


class ReferenciaCliente(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_referencia")
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.DO_NOTHING,
        db_column="id_cliente",
        related_name="referencias",
    )
    nombres = models.CharField(max_length=150, db_column="nombres")
    telefono = models.CharField(max_length=20, db_column="telefono", null=True, blank=True)
    parentesco = models.CharField(max_length=100, db_column="parentesco", null=True, blank=True)
    direccion = models.TextField(db_column="direccion", null=True, blank=True)

    class Meta:
        db_table = "referencias_cliente"
        managed = False
        ordering = ["id"]

    def __str__(self):
        return self.nombres


class InformeNuevoCliente(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_informe")
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.DO_NOTHING,
        db_column="id_cliente",
        related_name="informes",
    )
    usuario_creador = models.ForeignKey(
        Usuario,
        on_delete=models.DO_NOTHING,
        db_column="id_usuario_creador",
        related_name="informes_creados",
    )
    fecha_generacion = models.DateTimeField(db_column="fecha_generacion")
    observaciones = models.TextField(db_column="observaciones", null=True, blank=True)
    estado_revision = models.CharField(max_length=30, db_column="estado_revision")

    class Meta:
        db_table = "informe_nuevo_cliente"
        managed = False
        ordering = ["-id"]

    def __str__(self):
        return f"Informe {self.id} - {self.cliente}"


class ListaNegra(models.Model):
    id = models.IntegerField(primary_key=True, db_column="id_lista_negra")
    estado = models.CharField(max_length=30, db_column="estado")
    fecha_registro = models.DateTimeField(db_column="fecha_registro")

    class Meta:
        db_table = "lista_negra"
        managed = False

    def __str__(self):
        return f"Lista Negra {self.id}"


class ListaNegraCliente(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_lista_negra_cliente")
    lista_negra = models.ForeignKey(
        ListaNegra,
        on_delete=models.DO_NOTHING,
        db_column="id_lista_negra",
        related_name="registros",
    )
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.DO_NOTHING,
        db_column="id_cliente",
        related_name="registros_lista_negra",
    )
    fecha_ingreso = models.DateTimeField(db_column="fecha_ingreso")

    class Meta:
        db_table = "lista_negra_cliente"
        managed = False
        ordering = ["-id"]

    def __str__(self):
        return f"{self.cliente} en lista negra"