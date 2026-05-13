from django.urls import path
from .views import BitacoraListView

urlpatterns = [
    path('', BitacoraListView.as_view(), name='bitacora-list'),
]
