# chat/routing.py
from django.urls import re_path
from . import consumers

chatroom_websocket_urlpatterns = [
    re_path(r'ws/chatroom/$', consumers.ChatConsumer.as_asgi()),
]