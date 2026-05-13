from django.urls import path

from .views import (
    BlacklistView,
    CreditorDetailView,
    CreditorsCreateView,
    CreditorsSearchView,
    MoveClientPortfolioView,
    PendingPrequalificationDetailView,
    PendingPrequalificationListView,
    PortfolioBoardView,
    PortfolioCreateView,
    PortfolioDetailView,
    PendingPrequalificationApproveView,
    ClientePhotoUploadView,
)

urlpatterns = [
    path("", CreditorsCreateView.as_view(), name="creditors-create"),
    path("search/", CreditorsSearchView.as_view(), name="creditors-search"),
    path("<int:creditor_id>/", CreditorDetailView.as_view(), name="creditors-detail"),
    path(
        "pending-prequalification/",
        PendingPrequalificationListView.as_view(),
        name="creditors-pending-prequalification",
    ),
    path(
        "pending-prequalification/<int:informe_id>/",
        PendingPrequalificationDetailView.as_view(),
        name="creditors-pending-prequalification-detail",
    ),
    path(
        "pending-prequalification/<int:informe_id>/approve/",
        PendingPrequalificationApproveView.as_view(),
        name="creditors-pending-prequalification-approve",
    ),
    path("blacklist/", BlacklistView.as_view(), name="creditors-blacklist"),
    path("portfolio/", PortfolioBoardView.as_view(), name="portfolio-board"),
    path("portfolio/create/", PortfolioCreateView.as_view(), name="portfolio-create"),
    path("portfolio/<int:cartera_id>/", PortfolioDetailView.as_view(), name="portfolio-detail"),
    path("portfolio/move-client/", MoveClientPortfolioView.as_view(), name="portfolio-move-client"),
    path("upload-photo/", ClientePhotoUploadView.as_view(), name="creditors-upload-photo"),
]