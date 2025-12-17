# urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserListView,
    RegisterView,
    LoginAPIView,
    LogoutView,
    studentviewlist,
    ReceptionRegisterView,
    TeacherRegisterView,
    ProfileUpdateView,
    ChangePasswordView,
    ProfileImageUploadView,
    CurrentUserView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ReceptionRegisterlistView,
    WebsiteTrafficAPIView,
)

urlpatterns = [
    # Authentication endpoints
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path('logout/', LogoutView.as_view(), name='logout'),
    path("token/", LoginAPIView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # User endpoints
    path("user/", UserListView.as_view(), name="user"),
    path("user/update/<int:id>/", UserListView.as_view(), name="user_update"),
    path("user/delete/<int:id>/", UserListView.as_view(), name="user_delete"),
    path("user/list/", UserListView.as_view(), name="user_list"),
    path("user/me/", CurrentUserView.as_view(), name="user_me"),
    path("register/receptionist/list/", ReceptionRegisterlistView.as_view(), name="user_me_detail"),
    path('website-traffic/', WebsiteTrafficAPIView.as_view(), name='website-traffic'),
    
    # Student endpoints
    path("student/", studentviewlist.as_view(), name="studentviewlist"),
    path("student/<int:id>/", studentviewlist.as_view(), name="student_detail"),
    
    
    
    # Teacher endpoints
    path("register/teacher/", TeacherRegisterView.as_view(), name="teacher_register"),
    path("register/teacher/<int:id>/", TeacherRegisterView.as_view(), name="teacher_detail"),
    path("teacher/delete/<int:id>/", TeacherRegisterView.as_view(), name="teacher_delete"),
    
    
    
    # Receptionist endpoints
    path("reception/register/", ReceptionRegisterView.as_view(), name="reception_register"),

    path("register/receptionist/", ReceptionRegisterlistView.as_view(), name="receptionist_register"),
    path("register/receptionist/<int:id>/", ReceptionRegisterView.as_view(), name="receptionist_detail"),
    path("register/receptionist/student/list/", ReceptionRegisterView.as_view(), name="receptionist_list"),
    
    # Profile endpoints
    path("profile/update/", ProfileUpdateView.as_view(), name="profile_update"),
    path("profile/password/change/", ChangePasswordView.as_view(), name="password_change"),
    path("profile/image/upload/", ProfileImageUploadView.as_view(), name="profile_image_upload"),
    
    # Password reset endpoints
    path('password/reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]