from django.urls import path
from .views import CajaDetailView, MovimientosCajaView, RegistrarEgresoView

urlpatterns = [
    path("caja/", CajaDetailView.as_view(), name="caja-detail"),
    path("caja/movimientos/", MovimientosCajaView.as_view(), name="caja-movimientos"),
    path("caja/egreso/", RegistrarEgresoView.as_view(), name="caja-egreso"),
]
