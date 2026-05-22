# Despliegue en Producción (Docker)

Este proyecto está configurado para ejecutarse en producción usando Docker Compose, Gunicorn (para el Backend) y Nginx (para el Frontend).

## Requisitos Previos
- Docker y Docker Compose instalados en el servidor de despliegue (VPS, AWS, DigitalOcean, etc.).
- Asegurarte de que los puertos **80** (HTTP) y **8000** (API Backend) estén abiertos y accesibles si lo requieres.

## Instrucciones de Despliegue

1. **Variables de Entorno**
   Asegúrate de que exista tu archivo `.env` en el directorio `./Backend/.env` con las variables correctas de producción (como `SECRET_KEY`, conexión a Supabase, etc.).

   *(Opcional)* Si tu Frontend requiere variables de entorno al momento de compilarse, debes tener tu archivo `./Frontend/.env` listo antes de construir.

2. **Levantar los Contenedores**
   Ejecuta el siguiente comando en la raíz del proyecto para construir y arrancar los servicios en segundo plano:
   ```bash
   docker-compose up --build -d
   ```

3. **Verificar que Todo Funcione**
   Puedes verificar el estado de los contenedores con:
   ```bash
   docker-compose ps
   ```
   También puedes ver los registros (logs) en tiempo real:
   ```bash
   docker-compose logs -f
   ```

4. **Ejecutar Comandos en Producción**
   Si necesitas correr migraciones (si usarás base de datos propia o actualizaciones):
   ```bash
   docker-compose exec backend python manage.py migrate
   ```
   
   Si necesitas crear un superusuario:
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

5. **Recolectar Estáticos del Backend (Opcional)**
   Gunicorn servirá mejor los estáticos si primero los recolectas (aunque Django Rest Framework mayormente no requiere muchos estáticos para el frontend react, sí para el Admin):
   ```bash
   docker-compose exec backend python manage.py collectstatic --noinput
   ```

## Acceso a la Aplicación
- **Frontend**: Navega a `http://TU_IP_O_DOMINIO/` (Puerto 80).
- **Backend API / Admin**: Navega a `http://TU_IP_O_DOMINIO:8000/`.

## Detener la Aplicación
Si necesitas apagar el sistema, ejecuta:
```bash
docker-compose down
```
*(Tus volúmenes de `media` y `staticfiles` se mantendrán intactos gracias a los volúmenes de Docker).*
