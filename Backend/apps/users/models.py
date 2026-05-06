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


class Usuario(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_usuario")
    role = models.ForeignKey(
        Role,
        on_delete=models.DO_NOTHING,
        db_column="id_rol",
        related_name="usuarios",
    )
    username = models.CharField(max_length=50, unique=True, db_column="username")
    email = models.CharField(max_length=150, unique=True, db_column="email")
    password_hash = models.TextField(db_column="password_hash")
    nombres = models.CharField(max_length=100, db_column="nombres")
    apellidos = models.CharField(max_length=100, db_column="apellidos")
    telefono = models.CharField(max_length=20, null=True, blank=True, db_column="telefono")
    direccion = models.TextField(null=True, blank=True, db_column="direccion")
    ruta_foto_perfil = models.TextField(null=True, blank=True, db_column="ruta_foto_perfil")
    estado = models.CharField(max_length=30, db_column="estado")
    fecha_creacion = models.DateTimeField(db_column="fecha_creacion")

    class Meta:
        db_table = "usuarios"
        managed = False
        ordering = ["username"]

    def __str__(self):
        return self.username

    @property
    def first_name(self) -> str:
        return self.nombres or ""

    @property
    def last_name(self) -> str:
        return self.apellidos or ""

    def get_full_name(self) -> str:
        return f"{self.nombres} {self.apellidos}".strip()

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
            self.role.role_permissions.select_related("permission").values_list(
                "permission__code",
                flat=True,
            )
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


class RegistroCreacionUsuario(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_registro")
    admin = models.ForeignKey(
        Usuario,
        on_delete=models.DO_NOTHING,
        db_column="id_admin",
        related_name="registros_como_admin",
    )
    usuario_creado = models.ForeignKey(
        Usuario,
        on_delete=models.DO_NOTHING,
        db_column="id_usuario_creado",
        related_name="registros_como_creado",
    )
    username_usuario = models.CharField(max_length=50, db_column="username_usuario")
    nombre_usuario = models.CharField(max_length=200, db_column="nombre_usuario")
    email_usuario = models.CharField(max_length=150, db_column="email_usuario")
    rol_asignado = models.CharField(max_length=50, db_column="rol_asignado")
    fecha_creacion = models.DateField(db_column="fecha_creacion")
    hora_creacion = models.TimeField(db_column="hora_creacion")
    estado_creacion = models.CharField(max_length=30, db_column="estado_creacion")
    observaciones = models.TextField(null=True, blank=True, db_column="observaciones")

    class Meta:
        db_table = "registro_creacion_usuario"
        managed = False
        ordering = ["-id"]

    def __str__(self):
        return f"{self.username_usuario} ({self.rol_asignado})"