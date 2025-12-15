# notification/routing.py
from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    # Conversation WebSocket
    
    
    # Notification WebSocket
    path('ws/notifications/', consumers.NotificationConsumer.as_asgi()),
]