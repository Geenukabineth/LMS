from django.db import models
from django.utils import timezone
from shortuuid.django_fields import ShortUUIDField
from django.conf import settings
import uuid
from decimal import Decimal
import shortuuid



# FIXED: Removed User import, use settings.AUTH_USER_MODEL everywhere

PAYMENT_STATUS = (
    ("Processing", "Processing"),
    ("Completed", "Completed"),
    ("Failed", "Failed"),
    ("Refunded", "Refunded"),
)

TRANSACTION_STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('successful', 'Successful'),
    ('failed', 'Failed'),
    ('refunded', 'Refunded'),
    ('partially_refunded', 'Partially Refunded'),
    ('disputed', 'Disputed'),
    ('cancelled', 'Cancelled'),
)

PAYMENT_METHOD_TYPE_CHOICES = (
    ('card', 'Card'),
    ('bank', 'Bank Account'),
    ('physical', 'Physical'),
    ('bank_slip', 'Bank Slip'),
    ('other', 'Other'),
    ('stripe', 'Stripe'),
)

TRANSACTION_TYPE_CHOICES = [
    ('registration_fee', 'Registration Fee'),
    ('auto_renewal', 'Automated Renewal'),
    ('subscription_upgrade', 'Subscription Upgrade'),
    ('course_purchase', 'Course Purchase'),
]


class PaymentGateway(models.Model):
    """Payment gateway configuration (Stripe, PayPal, etc.)"""
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True, help_text="e.g., Stripe, PayPal")
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    
    # Credentials (typically set in environment variables, but model allows for db storage)
    api_key = models.CharField(max_length=255, blank=True, null=True)
    publishable_key = models.CharField(max_length=255, blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Payment Gateway"
        verbose_name_plural = "Payment Gateways"


class Cart(models.Model):
    """Represents a student's shopping cart for courses."""
    id = ShortUUIDField(
        primary_key=True, length=20, max_length=20,
        alphabet="abcdefghijk12345",default=shortuuid.uuid,
    )
    course = models.ForeignKey('course.Course', on_delete=models.CASCADE)
    user = models.ForeignKey('lms.User', on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    
    def __str__(self):
        return f"Cart {self.id} for {self.user.username}"


class CartOrder(models.Model):
    """Represents a completed order based on the cart."""
    oid = ShortUUIDField(
        primary_key=True, length=20, max_length=20,
        alphabet="abcdefghijk12345"
    )
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    sub_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    paid_status = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return f"Order {self.oid} by {self.student.username}"

class CartOrderItem(models.Model):
    """Individual items within a CartOrder."""
    id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(CartOrder, on_delete=models.CASCADE, related_name='items')
    course_title = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.course_title} in Order {self.order.oid}"


class Transaction(models.Model):
    """Detailed record of a financial transaction/payment."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # User and related order
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transactions_as_user'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transactions_as_student'
    )
    
    related_order_id = models.CharField(
        null=True,
        blank=True,
        help_text="ID of related CartOrder (matches database column)"
    )
    
    gateway = models.ForeignKey(
        PaymentGateway,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Gateway used for the transaction"
    )
    courses = models.ManyToManyField(
        'course.Course', 
        related_name='transactions', 
        blank=True
    )

    # Financials
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    status = models.CharField(
        max_length=20,
        choices=TRANSACTION_STATUS_CHOICES,
        default='pending'
    )
    transaction_type = models.CharField(
        max_length=50,
        choices=TRANSACTION_TYPE_CHOICES,
        default='course_purchase',
        help_text="Type of transaction (e.g., Course Purchase, Subscription)"
    )
    
    # Stripe Specific Fields
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Stripe Payment Intent ID"
    )
    stripe_customer_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Stripe Customer ID"
    )

    # Important dates
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When payment is due"
    )
    paid_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When payment was completed"
    )
    
    # Payment method
    payment_method_used = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_TYPE_CHOICES,
        blank=True,
        null=True
    )
    
    # Additional information
    notes = models.TextField(blank=True)
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        help_text="Payment reference/receipt number"
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transaction #{self.id} - {self.amount} {self.currency} ({self.status})"
    
    @property
    def order(self):
        """Property to access the related CartOrder"""
        if self.related_order_id:
            try:
              
                return CartOrder.objects.get(oid=self.related_order_id)
            except CartOrder.DoesNotExist:
                return None
        return None
    
    def mark_as_completed(self):
        """Mark payment as completed and order as paid"""
        self.status = 'successful'
        self.paid_date = timezone.now()
        self.save()
        if self.order:
             self.order.paid_status = True
             self.order.save()
    
    def mark_as_failed(self):
        """Mark payment as failed"""
        self.status = 'failed'
        self.save()

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"



# payment/models.py

# ... (keep existing imports and models)

class Earning(models.Model):
    """
    Tracks how the money from a course sale is split.
    """
    EARNING_TYPE_CHOICES = (
        ('teacher', 'Teacher'),
        ('platform', 'Platform (Company)'),
        ('admin', 'Admin'),
    )

    id = models.BigAutoField(primary_key=True)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='earnings')
    course = models.ForeignKey('course.Course', on_delete=models.SET_NULL, null=True, related_name='earnings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, help_text="The user receiving this money (Teacher or Admin)")
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    earning_type = models.CharField(max_length=20, choices=EARNING_TYPE_CHOICES)
    
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return f"{self.earning_type.title()} - {self.amount}"