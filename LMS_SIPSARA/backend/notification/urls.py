# notification/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AnnouncementViewSet

# Create a router for the viewset
router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet, basename='announcement')

urlpatterns = router.urls

# This will automatically create:
# GET    /announcements/           -> list
# POST   /announcements/           -> create
# GET    /announcements/<id>/      -> retrieve
# PUT    /announcements/<id>/      -> update
# PATCH  /announcements/<id>/      -> partial_update
# DELETE /announcements/<id>/      -> destroy