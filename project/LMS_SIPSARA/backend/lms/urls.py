from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserListView,
    RegisterView,
    LoginAPIView,
    LogoutView,
    Courseviewlist,
    AnnouncementList,
    PaymentView,
    Coursemodule,
    studentviewlist,
)


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("user/", UserListView.as_view(), name="user"),
    path("user/update/<int:id>/", UserListView.as_view()),
    path("user/delete/<int:id>/", UserListView.as_view()),
    path("courses/create/", Courseviewlist.as_view(), name="courses"),
    path("courses/view/", Courseviewlist.as_view(), name="courses_list"),
    path("announcement/create/", AnnouncementList.as_view(), name="Announcementcreate"),
    path("announcement/view/", AnnouncementList.as_view(), name="Announcementview"),
    path("announcement/delete/<int:id>", AnnouncementList.as_view(), name="delete_announcement"),
    path("announcement/update/<int:id>", AnnouncementList.as_view(), name="update_announcement"),
    path("create/payment-intent/", PaymentView.as_view(), name="create_payment_intent"),
    path("retrieve/payment/", PaymentView.as_view(), name="retrieve_payment"),
    path("Coursemodule/filter/title/", Coursemodule.as_view(), name="Coursemodule"),
    path("Coursemodule/filter/title/<int:id>", Coursemodule.as_view()),
    path("student/", studentviewlist.as_view(), name="studentviewlist"),
    path("notifications/<int:notification_id>/read/",AnnouncementList.as_view(), name="mark-read"),
    path("notifications/mark-all-read/", AnnouncementList.as_view(), name="mark-all-read"),
    path("notifications/unread-count/", AnnouncementList.as_view(), name="unread-count"),
]
