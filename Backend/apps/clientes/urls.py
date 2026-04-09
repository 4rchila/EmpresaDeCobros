from django.urls import path

from .views import (
    BlacklistView,
    CreditorsCreateView,
    CreditorsDetailView,
    CreditorsHealthView,
    CreditorsSearchView,
)

urlpatterns = [
    path("health/", CreditorsHealthView.as_view(), name="creditors-health"),
    path("", CreditorsCreateView.as_view(), name="creditors-create"),
    path("search/", CreditorsSearchView.as_view(), name="creditors-search"),
    path("<int:creditor_id>/", CreditorsDetailView.as_view(), name="creditors-detail"),
    path("blacklist/", BlacklistView.as_view(), name="creditors-blacklist"),
]