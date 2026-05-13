from django.urls import path
from .views import NotificacionListView, NotificacionMarkReadView

urlpatterns = [
    path("", NotificacionListView.as_view(), name="notificaciones-list"),
    path("<int:pk>/read/", NotificacionMarkReadView.as_view(), name="notificaciones-read"),
]
