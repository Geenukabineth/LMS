from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
import logging

# 🚨 NOTE: Import models from their assumed apps. Adjust if different.
from course.models import Assignment 
from payment.models import PaymentGateway
from .models import Announcement # Need this for cleanup

logger = logging.getLogger(__name__)


# Helper function for Celery tasks to send non-Announcement push notifications
def send_custom_notification(user_id, notification_type, title, content, event_id):
    """Sends a simplified, event-based push notification via Channels."""
    channel_layer = get_channel_layer()
    group_name = f'notifications_{user_id}'
    
    # Use a custom type like 'event_push' for non-Announcement notifications
    notification_data = {
        'type': 'event_push', 
        'event_id': event_id,
        'title': title,
        'content': content,
        'event_type': notification_type,
        'created_at': timezone.now().isoformat()
    }
    
    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            notification_data
        )
        logger.info(f"Custom notification ({notification_type}) sent to user {user_id}")
    except Exception as e:
        logger.error(f"Error sending custom notification: {str(e)}")


@shared_task
def check_due_assignments():
    """
    Runs daily. Checks for assignments due tomorrow and notifies students.
    """
    now = timezone.now()
    tomorrow = now.date() + timedelta(days=1)
    
    assignments = Assignment.objects.filter(due_date__date=tomorrow)
    
    for assignment in assignments:
        # Assuming course has enrolled_students (ManyToMany)
        # 🚨 FIX: Use .filter(is_active=True) to avoid inactive users
        students = assignment.course.enrolled_students.filter(is_active=True) 
        
        for student in students:
            send_custom_notification(
                user_id=student.id,
                notification_type='assignment_due',
                title='Assignment Due Soon!',
                content=f"The assignment '{assignment.title}' is due tomorrow ({tomorrow.strftime('%Y-%m-%d')}).",
                event_id=f'assign_{assignment.id}'
            )


@shared_task
def check_payment_due():
    """
    Runs daily. Checks for payments due in 30 days.
    """
    now = timezone.now()
    target_date = now.date() + timedelta(days=30)
    
    # Assuming PaymentGateway has a user relationship and a due_date field
    payments = PaymentGateway.objects.filter(due_date__date=target_date) 
    
    for payment in payments:
        # Assuming payment has a user relationship
        user = payment.user 
        
        send_custom_notification(
            user_id=user.id,
            notification_type='payment_due',
            title='Upcoming Payment Required',
            content=f"Payment for Order {payment.related_order_id} is due in 30 days.",
            event_id=f'pay_{payment.id}'
        )


@shared_task
def cleanup_expired_announcements():
    """
    Runs periodically to delete announcements that have passed their expiration time.
    """
    now = timezone.now()
    expired = Announcement.objects.filter(expires_at__lte=now)
    
    count = expired.count()
    if count > 0:
        expired.delete()
        logger.info(f"Deleted {count} expired announcements.")
    else:
        logger.info("No expired announcements found.")