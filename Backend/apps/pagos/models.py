from django.db import models
from apps.users.models import Usuario
from apps.prestamos.models import Prestamo, Pago

class Caja(models.Model):
    id_caja = models.BigAutoField(primary_key=True)
    usuario_responsable = models.ForeignKey(Usuario, models.DO_NOTHING, db_column='id_usuario_responsable', blank=True, null=True)
    nombre_caja = models.CharField(max_length=100)
    saldo_actual = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado = models.CharField(max_length=30, default='abierta')
    fecha_apertura = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'caja'
        ordering = ['-id_caja']

class Desembolso(models.Model):
    id_desembolso = models.BigAutoField(primary_key=True)
    prestamo = models.ForeignKey(Prestamo, models.DO_NOTHING, db_column='id_prestamo', related_name='desembolsos_list')
    usuario_entrega = models.ForeignKey(Usuario, models.DO_NOTHING, db_column='id_usuario_entrega')
    fecha_desembolso = models.DateTimeField(auto_now_add=True)
    monto_desembolsado = models.DecimalField(max_digits=12, decimal_places=2)
    metodo_desembolso = models.CharField(max_length=50, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'desembolsos'
        ordering = ['-fecha_desembolso']

class EgresoCaja(models.Model):
    id_egreso_caja = models.BigAutoField(primary_key=True)
    caja = models.ForeignKey(Caja, models.DO_NOTHING, db_column='id_caja', related_name='egresos')
    usuario_registra = models.ForeignKey(Usuario, models.DO_NOTHING, db_column='id_usuario_registra')
    desembolso = models.ForeignKey(Desembolso, models.DO_NOTHING, db_column='id_desembolso', blank=True, null=True)
    fecha_egreso = models.DateTimeField(auto_now_add=True)
    tipo_egreso = models.CharField(max_length=50)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'egresos_caja'
        ordering = ['-fecha_egreso']

class IngresoCaja(models.Model):
    id_ingreso_caja = models.BigAutoField(primary_key=True)
    caja = models.ForeignKey(Caja, models.DO_NOTHING, db_column='id_caja', related_name='ingresos')
    usuario_registra = models.ForeignKey(Usuario, models.DO_NOTHING, db_column='id_usuario_registra')
    pago = models.ForeignKey(Pago, models.DO_NOTHING, db_column='id_pago', blank=True, null=True)
    fecha_ingreso = models.DateTimeField(auto_now_add=True)
    tipo_ingreso = models.CharField(max_length=50)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'ingresos_caja'
        ordering = ['-fecha_ingreso']
