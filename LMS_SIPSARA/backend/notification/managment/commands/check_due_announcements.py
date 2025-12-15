from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from lms.models import User
from notification.models import Notification
from course.models import Assignment
from payment.models import Payment




class Command(BaseCommand):
    help = 'Check for upcoming assignment and payment dues and send auto-announcements'

    def handle(self, *args, **options):
        tomorrow = timezone.now() + timedelta(days=1)
        in_three_days = timezone.now() + timedelta(days=3)

        # Assignment due tomorrow
        assignments_due = Assignment.objects.filter(due_date__date=tomorrow.date())
        for assignment in assignments_due:
            if not Notification.objects.filter(related_assignment=assignment, type='assignment_due').exists():
                Notification.objects.create(
                    user=assignment.user,
                    message=f"Assignment '{assignment.title}' is due tomorrow ({assignment.due_date.date()})!",
                    type='assignment_due',
                    priority='high',
                    related_assignment=assignment
                )
                self.stdout.write(self.style.SUCCESS(f"Created assignment due notification for {assignment.user.username}"))

        # Payment due in 3 days
        payments_due = Payment.objects.filter(due_date__date=in_three_days.date())
        for payment in payments_due:
            if not Notification.objects.filter(related_payment=payment, type='payment_due').exists():
                Notification.objects.create(
                    user=payment.user,
                    message=f"Payment of ${payment.amount} is due in 3 days ({payment.due_date.date()}). Please settle promptly.",
                    type='payment_due',
                    priority='critical',
                    related_payment=payment
                )
                self.stdout.write(self.style.SUCCESS(f"Created payment due notification for {payment.user.username}"))