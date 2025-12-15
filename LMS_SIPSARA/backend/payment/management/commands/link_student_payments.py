from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction
from payment.models import Transaction
from lms.models import Student
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Link existing payment transactions to Student model'

    def handle(self, *args, **options):
        """
        Links payments to students by matching user_id
        """
        # Get all transactions
        all_transactions = Transaction.objects.all()
        
        linked_count = 0
        not_found_count = 0
        already_linked = 0
        
        with db_transaction.atomic():
            for trans in all_transactions:
                # Skip if already has student
                if trans.student:
                    already_linked += 1
                    continue
                
                # Try to find student for this user
                try:
                    student = Student.objects.get(user=trans.user)
                    trans.student = student
                    trans.save()
                    linked_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✅ Linked {trans.user.username} to {student.firstName} {student.lastName}'
                        )
                    )
                except Student.DoesNotExist:
                    not_found_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠️ No student profile for user {trans.user.username}'
                        )
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Migration Complete:\n'
                f'   - Linked: {linked_count}\n'
                f'   - Already linked: {already_linked}\n'
                f'   - Not found: {not_found_count}'
            )
        )