from django.urls import path
from .views import ChatbotViewSet
from django.middleware.csrf import get_token
from django.http import JsonResponse

def csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})

urlpatterns = [
    path('query/', ChatbotViewSet.as_view(), name='chatbot_query'),
    path('csrf/', csrf, name='csrf'),
]