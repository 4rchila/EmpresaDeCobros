from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

from django.http import HttpResponse, FileResponse
import os
import traceback
from apps.prestamos.utils_docs import generate_loan_document

# VISTA DIRECTA CON DEBUG PARA CAZAR EL ERROR 500
def descarga_directa_view(request, loan_id, doc_type):
    try:
        print(f"!!! HIT DIRECTO: Loan {loan_id}, Type {doc_type}")
        out_format = request.GET.get('format', 'docx').lower()
        
        # Generar el documento
        file_path, error = generate_loan_document(loan_id, doc_type, out_format)
        
        if error:
            print(f"!!! ERROR EN GENERACION: {error}")
            return HttpResponse(f"Error generando documento: {error}", status=400)
            
        if not file_path or not os.path.exists(file_path):
            print(f"!!! ARCHIVO NO ENCONTRADO EN: {file_path}")
            return HttpResponse(f"Error: El archivo no existe en {file_path}", status=500)

        # Guardar en almacenamiento y registrar en Base de Datos
        try:
            from apps.prestamos.utils_docs import save_document_to_storage
            url_db, err_db = save_document_to_storage(loan_id, file_path, doc_type, out_format, request.user)
            if err_db:
                print(f"!!! AVISO: El archivo bajará pero no se guardó en DB: {err_db}")
            else:
                print(f"!!! DOCUMENTO GUARDADO EN DB: {url_db}")
        except Exception as db_ex:
            print(f"!!! ERROR AL GUARDAR EN DB: {str(db_ex)}")

        # Determinar el tipo de contenido
        content_type = 'application/pdf' if out_format == 'pdf' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        
        # Nombre del archivo para la descarga
        filename = f"{doc_type}_{loan_id}.{out_format}"
        
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    except Exception as e:
        print("!!! FATAL ERROR EN VISTA DIRECTA !!!")
        print(traceback.format_exc())
        return HttpResponse(f"Error fatal: {str(e)}", status=500)

urlpatterns = [
    # Rutas directas para descarga
    path('api/loans/<str:loan_id>/documento/<str:doc_type>/', descarga_directa_view),
    path('api/loans/<str:loan_id>/documento/<str:doc_type>', descarga_directa_view),
    path("admin/", admin.site.urls),
    path("api/users/", include("apps.users.urls")),
    path("api/creditors/", include("apps.clientes.urls")),
    path("api/loans/", include("apps.prestamos.urls")),
    path("api/vault/", include("apps.pagos.urls")),
    path("api/logs/", include("apps.bitacora.urls")),
    path("api/reports/", include("apps.reportes.urls")),
    path("api/notifications/", include("apps.notificaciones.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
