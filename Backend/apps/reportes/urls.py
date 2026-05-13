from django.urls import path
from .views import ReportesGeneralView

urlpatterns = [
    path('general/', ReportesGeneralView.as_view(), name='reportes-general'),
]
