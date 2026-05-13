from .models import Bitacora

def registrar_en_bitacora(usuario, categoria, titulo, descripcion, monto=None, detalles=None):
    """
    Registra un evento en la bitácora del sistema.
    """
    return Bitacora.objects.create(
        usuario=usuario,
        categoria=categoria,
        titulo=titulo,
        descripcion=descripcion,
        monto=monto,
        detalles=detalles or {}
    )
