import os
import sys
import django

# Configurar Django
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.users.models import Usuario

def check_user_photo():
    user = Usuario.objects.filter(username='PRSOL001').first()
    if not user:
        print("Usuario PRSOL001 no encontrado.")
        return
    
    print(f"Usuario: {user.username}")
    print(f"Ruta en DB: '{user.ruta_foto_perfil}'")
    
    if user.ruta_foto_perfil:
        print(f"Largo de la ruta: {len(user.ruta_foto_perfil)}")
    else:
        print("La ruta está VACÍA o es NULL")

if __name__ == "__main__":
    check_user_photo()
