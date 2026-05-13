from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings

class BaseS3Storage(S3Boto3Storage):
    """Clase base para Supabase S3 con credenciales forzadas en la inicialización"""
    def __init__(self, *args, **kwargs):
        kwargs['access_key'] = getattr(settings, 'SUPABASE_S3_ACCESS_KEY_ID', None)
        kwargs['secret_key'] = getattr(settings, 'SUPABASE_S3_SECRET_ACCESS_KEY', None)
        kwargs['region_name'] = getattr(settings, 'SUPABASE_S3_REGION_NAME', 'us-west-2')
        kwargs['endpoint_url'] = getattr(settings, 'SUPABASE_S3_ENDPOINT_URL', None)
        kwargs['default_acl'] = None # Supabase no soporta ACLs de S3
        kwargs['querystring_auth'] = False
        kwargs['file_overwrite'] = False
        kwargs['addressing_style'] = 'path'
        super().__init__(*args, **kwargs)

    def url(self, name):
        """Genera la URL pública directa de Supabase"""
        endpoint = getattr(self, 'endpoint_url', '') or ''
        if 'storage.supabase.co' in endpoint:
            base_url = endpoint.split('/storage/v1/s3')[0]
            generated_url = f"{base_url}/storage/v1/object/public/{self.bucket_name}/{name}"
            print(f"[DEBUG STORAGE] Generated URL for {name}: {generated_url}")
            return generated_url
        return super().url(name)

class GarantiasStorage(BaseS3Storage):
    bucket_name = 'garantias'
    location = ''

class AvatarsStorage(BaseS3Storage):
    bucket_name = 'avatars'
    location = ''

class DocumentosStorage(BaseS3Storage):
    bucket_name = 'documentos'
    location = ''

class ClientesStorage(BaseS3Storage):
    bucket_name = 'F-D-personales'
    location = ''
