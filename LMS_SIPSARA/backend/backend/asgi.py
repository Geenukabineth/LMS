import os
import django

# 1. Configure Settings FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# 2. Setup Django SECOND
django.setup()

# 3. Import Middleware/Apps THIRD
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from notification.middleware import TokenAuthMiddlewareStack
from notification.routing import websocket_urlpatterns as notification_patterns 
from chatroom.routing import chatroom_websocket_urlpatterns 

# Combine patterns
all_websocket_patterns = notification_patterns + chatroom_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddlewareStack( 
        URLRouter(
            all_websocket_patterns 
        )
    ),
})