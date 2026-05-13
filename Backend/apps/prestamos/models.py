from django.db import models

from apps.clientes.models import Cliente
from apps.users.models import Usuario


class PlanPago(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_plan")
    nombre_plan = models.CharField(max_length=120, db_column="nombre_plan")
    periodicidad = models.CharField(
        max_length=50,
        db_column="periodicidad",
        null=True,
        blank=True,
    )
    numero_cuotas = models.IntegerField(db_column="numero_cuotas")
    interes = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        db_column="interes",
        default=0,
    )
    mora = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        db_column="mora",
        default=0,
    )
    monto_base = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="monto_base",
        default=0,
    )
    estado = models.CharField(max_length=30, db_column="estado")

    class Meta:
        db_table = "plan_pago"
        managed = False
        ordering = ["id"]

    def __str__(self):
        return self.nombre_plan


class Prestamo(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_prestamo")
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.DO_NOTHING,
        db_column="id_cliente",
        related_name="prestamos",
    )
    plan = models.ForeignKey(
        PlanPago,
        on_delete=models.DO_NOTHING,
        db_column="id_plan",
        related_name="prestamos",
    )
    admin_aprobador = models.ForeignKey(
        Usuario,
        on_delete=models.DO_NOTHING,
        db_column="id_admin_aprobador",
        related_name="prestamos_aprobados",
        null=True,
        blank=True,
    )
    monto_solicitado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="monto_solicitado",
    )
    interes = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        db_column="interes",
        default=0,
    )
    destino_uso = models.TextField(
        db_column="destino_uso",
        null=True,
        blank=True,
    )
    fecha_solicitud = models.DateField(db_column="fecha_solicitud")
    fecha_aprobacion = models.DateField(
        db_column="fecha_aprobacion",
        null=True,
        blank=True,
    )
    fecha_desembolso = models.DateField(
        db_column="fecha_desembolso",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "prestamos"
        managed = False
        ordering = ["-id"]

    def __str__(self):
        return f"Préstamo {self.id} - {self.cliente}"

    @property
    def esta_aprobado(self) -> bool:
        return self.fecha_aprobacion is not None

    @property
    def esta_desembolsado(self) -> bool:
        return self.fecha_desembolso is not None


class Cuota(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_cuota")
    plan = models.ForeignKey(
        PlanPago,
        on_delete=models.DO_NOTHING,
        db_column="id_plan",
        related_name="cuotas",
    )
    prestamo = models.ForeignKey(
        Prestamo,
        on_delete=models.DO_NOTHING,
        db_column="id_prestamo",
        related_name="cuotas",
    )
    numero_cuota = models.IntegerField(db_column="numero_cuota")
    fecha_vencimiento = models.DateField(db_column="fecha_vencimiento")
    monto_cuota = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="monto_cuota",
    )
    saldo_cuota = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="saldo_cuota",
        default=0,
    )
    mora_generada = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="mora_generada",
        default=0,
    )
    estado_cuota = models.CharField(max_length=30, db_column="estado_cuota")

    class Meta:
        db_table = "cuotas"
        managed = False
        ordering = ["prestamo_id", "numero_cuota"]

    def __str__(self):
        return f"Cuota {self.numero_cuota} - Préstamo {self.prestamo_id}"


class Pago(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_pago")
    prestamo = models.ForeignKey(
        Prestamo,
        on_delete=models.DO_NOTHING,
        db_column="id_prestamo",
        related_name="pagos",
    )
    usuario_registra = models.ForeignKey(
        Usuario,
        on_delete=models.DO_NOTHING,
        db_column="id_usuario_registra",
        related_name="pagos_registrados",
    )
    fecha_pago = models.DateTimeField(db_column="fecha_pago")
    monto_pagado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="monto_pagado",
    )
    tipo_pago = models.CharField(max_length=50, db_column="tipo_pago")
    estado = models.CharField(max_length=30, db_column="estado")
    observaciones = models.TextField(
        db_column="observaciones",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "pagos"
        managed = False
        ordering = ["-id"]

    def __str__(self):
        return f"Pago {self.id} - Préstamo {self.prestamo_id}"


class HojaCuenta(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_hoja_cuenta")
    prestamo = models.ForeignKey(
        Prestamo,
        on_delete=models.DO_NOTHING,
        db_column="id_prestamo",
        related_name="movimientos_hoja_cuenta",
    )
    pago = models.ForeignKey(
        Pago,
        on_delete=models.DO_NOTHING,
        db_column="id_pago",
        related_name="movimientos_hoja_cuenta",
    )
    fecha_registro = models.DateTimeField(db_column="fecha_registro")
    detalle = models.TextField(db_column="detalle", null=True, blank=True)
    saldo_actual = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="saldo_actual",
        default=0,
    )

    class Meta:
        db_table = "hoja_cuenta"
        managed = False
        ordering = ["-id"]

    def __str__(self):
        return f"Hoja {self.id} - Préstamo {self.prestamo_id}"


class Garantia(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_garantia")
    prestamo = models.ForeignKey(
        Prestamo,
        on_delete=models.DO_NOTHING,
        db_column="id_prestamo",
        related_name="garantias",
    )
    tipo_garantia = models.CharField(max_length=80, db_column="tipo_garantia")
    descripcion = models.TextField(db_column="descripcion")
    valor_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="valor_estimado",
        default=0,
    )
    estado_garantia = models.CharField(max_length=30, db_column="estado_garantia")
    fecha_registro = models.DateTimeField(db_column="fecha_registro")
    observaciones = models.TextField(
        db_column="observaciones",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "garantias"
        managed = False
        ordering = ["id"]

    def __str__(self):
        return f"Garantía {self.id} - Préstamo {self.prestamo_id}"


class FotoGarantia(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_foto_garantia")
    garantia = models.ForeignKey(
        Garantia,
        on_delete=models.DO_NOTHING,
        db_column="id_garantia",
        related_name="fotos",
    )
    ruta_archivo = models.TextField(db_column="ruta_archivo")
    descripcion = models.TextField(
        db_column="descripcion",
        null=True,
        blank=True,
    )
    es_principal = models.BooleanField(db_column="es_principal", default=False)
    fecha_subida = models.DateTimeField(db_column="fecha_subida")

    class Meta:
        db_table = "fotos_garantia"
        managed = False
        ordering = ["id"]

    def __str__(self):
        return self.ruta_archivo


class EvaluacionGarantia(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_evaluacion_garantia")
    garantia = models.ForeignKey(
        Garantia,
        on_delete=models.DO_NOTHING,
        db_column="id_garantia",
        related_name="evaluaciones",
    )
    usuario_evalua = models.ForeignKey(
        Usuario,
        on_delete=models.DO_NOTHING,
        db_column="id_usuario_evalua",
        related_name="evaluaciones_garantia",
    )
    fecha_evaluacion = models.DateTimeField(db_column="fecha_evaluacion")
    resultado = models.CharField(max_length=30, db_column="resultado")
    valor_aceptado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column="valor_aceptado",
        default=0,
    )
    observaciones = models.TextField(
        db_column="observaciones",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "evaluacion_garantia"
        managed = False
        ordering = ["-id"]

    def __str__(self):
        return f"Evaluación {self.id} - Garantía {self.garantia_id}"
class Documento(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_documento")
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.DO_NOTHING,
        db_column="id_cliente",
        related_name="documentos_asociados",
        null=True,
        blank=True,
    )
    prestamo = models.ForeignKey(
        Prestamo,
        on_delete=models.DO_NOTHING,
        db_column="id_prestamo",
        related_name="documentos",
        null=True,
        blank=True,
    )
    usuario_sube = models.ForeignKey(
        Usuario,
        on_delete=models.DO_NOTHING,
        db_column="id_usuario_sube",
        related_name="documentos_subidos",
        null=True,
        blank=True,
    )
    tipo_documento = models.CharField(max_length=80, db_column="tipo_documento")
    nombre_archivo = models.CharField(max_length=200, db_column="nombre_archivo")
    ruta_archivo = models.TextField(db_column="ruta_archivo")
    estado_documento = models.CharField(max_length=30, db_column="estado_documento")
    fecha_subida = models.DateTimeField(db_column="fecha_subida")
    observaciones = models.TextField(db_column="observaciones", null=True, blank=True)

    class Meta:
        db_table = "documentos"
        managed = False
