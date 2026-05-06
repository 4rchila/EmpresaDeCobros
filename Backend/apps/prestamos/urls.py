from django.urls import path

from .views import (
    GarantiaPhotoUploadView,
    LoanApproveView,
    LoanDetailView,
    LoanDisburseView,
    LoanPaymentCreateView,
    LoansCreateView,
    LoansDisbursementPendingListView,
    LoansListView,
    LoansPendingListView,
    LoanSimulationView,
    PlansView,
)

urlpatterns = [
    path("", LoansListView.as_view(), name="loans-list"),
    path("create/", LoansCreateView.as_view(), name="loans-create"),
    path("pending/", LoansPendingListView.as_view(), name="loans-pending"),
    path(
        "pending-disbursement/",
        LoansDisbursementPendingListView.as_view(),
        name="loans-pending-disbursement",
    ),
    path("plans/", PlansView.as_view(), name="loans-plans"),
    path("simulate/", LoanSimulationView.as_view(), name="loans-simulate"),
    path("payments/", LoanPaymentCreateView.as_view(), name="loans-payments"),
    path("upload-garantia-photo/", GarantiaPhotoUploadView.as_view(), name="loans-upload-garantia-photo"),
    path("<int:loan_id>/", LoanDetailView.as_view(), name="loans-detail"),
    path("<int:loan_id>/approve/", LoanApproveView.as_view(), name="loans-approve"),
    path("<int:loan_id>/disburse/", LoanDisburseView.as_view(), name="loans-disburse"),
]