# payment/management/commands/seed_payment.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
import random
import shortuuid

from django.contrib.auth import get_user_model
from course.models import Course
from payment.models import PaymentGateway, Cart, CartOrder, CartOrderItem, Transaction, Earning

User = get_user_model()

class Command(BaseCommand):
    help = "Seed the payment app with initial data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding payment data...")

        # --- Payment Gateways ---
        gateways = [
            {"name": "Stripe", "description": "Stripe Payment Gateway"},
            {"name": "PayPal", "description": "PayPal Payment Gateway"},
        ]
        for gw in gateways:
            PaymentGateway.objects.get_or_create(name=gw['name'], defaults=gw)

        self.stdout.write("Payment gateways seeded.")

        # --- Users ---
        users = User.objects.filter(is_staff=False)[:5]
        if not users.exists():
            self.stdout.write(self.style.WARNING("No regular users found. Create some users first."))
            return

        # --- Courses ---
        courses = Course.objects.all()[:5]
        if not courses.exists():
            self.stdout.write(self.style.WARNING("No courses found. Create some courses first."))
            return

        # --- Carts ---
        for user in users:
            for course in courses:
                cart, _ = Cart.objects.get_or_create(
                    course=course,
                    user=user,
                    defaults={
                        'price': course.price if hasattr(course, 'price') else Decimal('100.00'),
                        'total': course.price if hasattr(course, 'price') else Decimal('100.00'),
                    }
                )
        self.stdout.write("Carts seeded.")

        # --- CartOrders and CartOrderItems ---
        for user in users:
            order = CartOrder.objects.create(
                oid=shortuuid.uuid(),
                student=user,
                sub_total=Decimal('0.00'),
                total_amount=Decimal('0.00'),
                paid_status=False
            )
            total = Decimal('0.00')
            for course in courses:
                price = course.price if hasattr(course, 'price') else Decimal('100.00')
                CartOrderItem.objects.create(
                    order=order,
                    course_title=course.title,
                    price=price
                )
                total += price
            order.sub_total = total
            order.total_amount = total
            order.save()
        self.stdout.write("CartOrders and CartOrderItems seeded.")

        # --- Transactions ---
        gateways_objs = PaymentGateway.objects.all()
        for user in users:
            for order in CartOrder.objects.filter(student=user):
                gateway = random.choice(gateways_objs)
                transaction = Transaction.objects.create(
                    user=user,
                    student=user,
                    related_order_id=order.oid,
                    gateway=gateway,
                    amount=order.total_amount,
                    currency="USD",
                    status=random.choice(['pending', 'successful', 'failed']),
                    transaction_type=random.choice(['course_purchase', 'registration_fee']),
                    payment_method_used=random.choice(['card', 'stripe']),
                    created_at=timezone.now()
                )
                # link courses
                transaction.courses.set([course.id for course in courses])
        self.stdout.write("Transactions seeded.")

        # --- Earnings ---
        for transaction in Transaction.objects.all():
            for course in transaction.courses.all():
                # teacher earning 70%, platform 20%, admin 10%
                teacher_amount = transaction.amount * Decimal('0.7')
                platform_amount = transaction.amount * Decimal('0.2')
                admin_amount = transaction.amount * Decimal('0.1')

                # Teacher earning
                Earning.objects.create(
                    transaction=transaction,
                    course=course,
                    user=course.teacher if hasattr(course, 'teacher') else None,
                    amount=teacher_amount,
                    earning_type='teacher'
                )
                # Platform earning
                Earning.objects.create(
                    transaction=transaction,
                    course=course,
                    user=None,
                    amount=platform_amount,
                    earning_type='platform'
                )
                # Admin earning
                Earning.objects.create(
                    transaction=transaction,
                    course=course,
                    user=None,
                    amount=admin_amount,
                    earning_type='admin'
                )
        self.stdout.write("Earnings seeded successfully.")
        self.stdout.write(self.style.SUCCESS("Payment app seeding complete!"))
