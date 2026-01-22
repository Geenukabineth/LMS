# course/tasks.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from .models import LiveSession, EnrolledCourse

@shared_task
def mark_finished_sessions_completed():
    """
    Checks for active sessions where the scheduled time + duration has passed.
    Marks them as is_completed = True.
    """
    now = timezone.now()
    # Filter sessions that are NOT completed yet
    active_sessions = LiveSession.objects.filter(is_completed=False)

    count = 0
    for session in active_sessions:
        # Combine date and time to get a full datetime object
        # Note: You might need to handle timezone awareness depending on your settings
        start_dt = timezone.datetime.combine(session.date, session.time)
        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt)

        end_dt = start_dt + timedelta(minutes=session.duration)

        # If the current time is past the end time (plus a small buffer, e.g., 5 mins)
        if now > end_dt + timedelta(minutes=5):
            session.is_completed = True
            session.save()
            count += 1
            
    return f"Marked {count} sessions as completed."

@shared_task
def send_class_reminders():
    """
    Sends an email to all enrolled students 30 minutes before class starts.
    """
    now = timezone.now()
    # Look for classes starting between 25 and 35 minutes from now
    start_window = now + timedelta(minutes=25)
    end_window = now + timedelta(minutes=35)
    
    # Logic to filter sessions starting soon (This is simplified for date/time fields)
    # Since date/time are separate in your model, we iterate or use careful filtering
    today_sessions = LiveSession.objects.filter(
        date=now.date(),
        is_completed=False
    )

    emails_sent = 0

    for session in today_sessions:
        start_dt = timezone.datetime.combine(session.date, session.time)
        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt)

        # If the session starts within the window
        if start_window <= start_dt <= end_window:
            # 1. Get Enrolled Students (Active only)
            enrollments = EnrolledCourse.objects.filter(
                course=session.course, 
                status='active'
            ).select_related('user__user')

            # 2. Collect Emails
            recipient_list = [
                e.user.user.email for e in enrollments 
                if e.user and e.user.user.email
            ]

            if recipient_list:
                # 3. Send Email
                send_mail(
                    subject=f"Reminder: {session.title} starts in 30 minutes!",
                    message=f"Hello,\n\nYour live class for '{session.course.title}' is starting soon.\n\nJoin here: {session.join_url}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipient_list,
                    fail_silently=True
                )
                emails_sent += len(recipient_list)

    return f"Sent reminders for {emails_sent} students."