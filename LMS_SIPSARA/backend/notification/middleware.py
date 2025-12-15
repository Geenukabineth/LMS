# notification/middleware.py
from django.db import close_old_connections
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(validated_token):
    try:
        user = get_user_model().objects.get(id=validated_token["user_id"])
        return user
    except get_user_model().DoesNotExist:
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser()
    except Exception as e:
        # Catch exceptions during user lookup/token processing
        from django.contrib.auth.models import AnonymousUser
        print(f"Middleware Error retrieving user: {e}") 
        return AnonymousUser()


class JwtAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        close_old_connections()
        
        # 1. Get the token from the URL query string
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        # 2. Validate the token
        if token:
            try:
                # 2a. Check if the token is valid format/structure
                UntypedToken(token) 
                
                # 2b. Decode the token to find the User ID (synchronous operation)
                decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                
                # 2c. Get the user from the database (asynchronous operation)
                scope["user"] = await get_user(decoded_data)
                
            except (InvalidToken, TokenError) as e:
                # Token is invalid or expired
                print(f"Middleware JWT Error: {e}")
                from django.contrib.auth.models import AnonymousUser
                scope["user"] = AnonymousUser()
            except Exception as e:
                # Catch other potential errors during decoding/retrieval
                print(f"Middleware Generic Error: {e}")
                from django.contrib.auth.models import AnonymousUser
                scope["user"] = AnonymousUser()
        else:
            # No token found, set user to Anonymous
            from django.contrib.auth.models import AnonymousUser
            scope["user"] = AnonymousUser()

        return await self.app(scope, receive, send)

# Helper function to wrap the middleware (used in asgi.py)
def TokenAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)