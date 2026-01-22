# backend/backend/celery.py
import os
from celery import Celery

# ✅ FIX: Change this from 'LMS_SIPSARA.backend.backend.settings' to 'backend.settings'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# ✅ FIX: Change this to just 'backend'
app = Celery('backend')

# Read config from settings.py using CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load tasks from all registered Django apps
app.autodiscover_tasks()