# chat/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FriendRequestViewSet, FriendshipViewSet, ChatViewSet, DirectMessageViewSet,
    GroupViewSet, GroupMessageViewSet, BlockedUserViewSet, NotificationViewSet,
    UserOnlineStatusViewSet
)

router = DefaultRouter()
router.register(r'friend-requests', FriendRequestViewSet, basename='friend-request')
router.register(r'friendships', FriendshipViewSet, basename='friendship')
router.register(r'chats', ChatViewSet, basename='chat')
router.register(r'direct-messages', DirectMessageViewSet, basename='direct-message')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'group-messages', GroupMessageViewSet, basename='group-message')
router.register(r'blocked-users', BlockedUserViewSet, basename='blocked-user')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'online-status', UserOnlineStatusViewSet, basename='online-status')

urlpatterns = [
    path('', include(router.urls)),
]