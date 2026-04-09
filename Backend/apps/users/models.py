from django.db import models


class Role(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_rol")
    name = models.CharField(max_length=50, unique=True, db_column="nombre_rol")
    description = models.TextField(null=True, blank=True, db_column="descripcion")

    class Meta:
        db_table = "roles"
        managed = False
        ordering = ["name"]

    def __str__(self):
        return self.name


class Permission(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_permiso")
    code = models.CharField(max_length=100, unique=True, db_column="nombre")
    description = models.TextField(null=True, blank=True, db_column="descripcion")

    class Meta:
        db_table = "permisos"
        managed = False
        ordering = ["code"]

    def __str__(self):
        return self.code


class Empleado(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_empleado")
    nombres = models.CharField(max_length=100, db_column="nombres")
    apellidos = models.CharField(max_length=100, db_column="apellidos")
    telefono = models.CharField(max_length=20, null=True, blank=True, db_column="telefono")
    direccion = models.TextField(null=True, blank=True, db_column="direccion")
    puesto = models.CharField(max_length=100, db_column="puesto")
    sueldo = models.DecimalField(max_digits=12, decimal_places=2, db_column="sueldo")
    fecha_contratacion = models.DateField(null=True, blank=True, db_column="fecha_contratacion")
    estado_laboral = models.CharField(max_length=30, db_column="estado_laboral")

    class Meta:
        db_table = "empleados"
        managed = False
        ordering = ["nombres", "apellidos"]

    def __str__(self):
        return self.nombre_completo

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombres} {self.apellidos}".strip()


class Usuario(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_usuario")
    empleado = models.OneToOneField(
        Empleado,
        on_delete=models.DO_NOTHING,
        db_column="id_empleado",
        related_name="usuario",
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.DO_NOTHING,
        db_column="id_rol",
        related_name="usuarios",
    )
    email = models.CharField(max_length=150, unique=True, db_column="email")
    password_hash = models.TextField(db_column="password_hash")
    estado = models.CharField(max_length=30, db_column="estado")
    fecha_creacion = models.DateTimeField(db_column="fecha_creacion")

    class Meta:
        db_table = "usuarios"
        managed = False
        ordering = ["email"]

    def __str__(self):
        return self.email

    @property
    def username(self) -> str:
        return self.email

    @property
    def first_name(self) -> str:
        return self.empleado.nombres if self.empleado_id else ""

    @property
    def last_name(self) -> str:
        return self.empleado.apellidos if self.empleado_id else ""

    def get_full_name(self) -> str:
        if self.empleado_id:
            return self.empleado.nombre_completo
        return self.email

    @property
    def full_name(self) -> str:
        return self.get_full_name()

    @property
    def role_name(self) -> str:
        return self.role.name if self.role_id else "Sin rol"

    @property
    def is_active(self) -> bool:
        return (self.estado or "").strip().lower() == "activo"

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    @property
    def is_staff(self) -> bool:
        return self.role_name.lower() in {"gerente", "administrador", "admin"}

    @property
    def is_superuser(self) -> bool:
        return False

    def get_permission_codes(self) -> list[str]:
        return list(
            self.role.role_permissions.select_related("permission").values_list("permission__code", flat=True)
        )


class RolePermission(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_rol_permiso")
    role = models.ForeignKey(
        Role,
        on_delete=models.DO_NOTHING,
        db_column="id_rol",
        related_name="role_permissions",
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.DO_NOTHING,
        db_column="id_permiso",
        related_name="permission_roles",
    )

    class Meta:
        db_table = "rol_permiso"
        managed = False
        ordering = ["role__name", "permission__code"]

    def __str__(self):
        return f"{self.role} -> {self.permission}"