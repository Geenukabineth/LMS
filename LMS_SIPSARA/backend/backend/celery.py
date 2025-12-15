# celery.py
import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LMS_SIPSARA.backend.backend.settings')

app = Celery('LMS_SIPSARA.backend.backend')

# Read config from settings.py using CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load tasks from all registered Django apps
app.autodiscover_tasks()


