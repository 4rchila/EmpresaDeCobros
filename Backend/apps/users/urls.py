from django.urls import path

from .views import (
    AdvisorCarterasView,
    AdvisorsSearchView,
    LoginView,
    MePhotoUpdateView,
    MeUsernameUpdateView,
    MeView,
    RolesListView,
    TransferCarteraView,
    UsersListCreateView,
    UserStatusUpdateView,
    MePasswordUpdateView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="users-login"),
    path("me/", MeView.as_view(), name="users-me"),
    path("me/username/", MeUsernameUpdateView.as_view(), name="users-me-username"),
    path("me/password/", MePasswordUpdateView.as_view(), name="users-me-password"),
    path("me/photo/", MePhotoUpdateView.as_view(), name="users-me-photo"),
    path("roles/", RolesListView.as_view(), name="users-roles"),
    path("", UsersListCreateView.as_view(), name="users-list-create"),
    path("<int:user_id>/status/", UserStatusUpdateView.as_view(), name="users-status"),
    path("advisors/", AdvisorsSearchView.as_view(), name="users-advisors"),
    path(
        "advisors/<int:advisor_id>/carteras/",
        AdvisorCarterasView.as_view(),
        name="users-advisor-carteras",
    ),
    path(
        "transfer-cartera/",
        TransferCarteraView.as_view(),
        name="users-transfer-cartera",
    ),
]