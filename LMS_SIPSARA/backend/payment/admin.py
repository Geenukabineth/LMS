from django.contrib import admin
from django.db.models import Sum
from .models import (
    PaymentGateway, Transaction, Cart, CartOrder, CartOrderItem,Earning,
    PAYMENT_STATUS
)

# --- INLINES ---

class CartOrderItemInline(admin.TabularInline):
    """Inline view for items within a specific CartOrder."""
    model = CartOrderItem
    fields = ('course_title', 'price',)
    readonly_fields = ('course_title', 'price',)
    extra = 0  # No empty forms by default


# --- ADMIN CLASSES ---

@admin.register(PaymentGateway)
class PaymentGatewayAdmin(admin.ModelAdmin):
    """Admin configuration for PaymentGateway model."""
    list_display = ('id', 'name', 'is_active', 'created_at',)
    list_filter = ('is_active',)
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """Admin configuration for Cart model."""
    
    list_display = ('id', 'user', 'course', 'price', 'created_at', 'updated_at',)
    list_filter = ('created_at',)
    search_fields = ('user__username', 'course__title')
    date_hierarchy = 'created_at'
    readonly_fields = ('id', 'created_at', 'updated_at',)


@admin.register(CartOrder)
class CartOrderAdmin(admin.ModelAdmin):
    """Admin configuration for CartOrder model."""
    inlines = [CartOrderItemInline]

    # Custom field definitions using @admin.display
    @admin.display(description='Student Name')
    def student_full_name(self, obj):
        """Safe method to get student name - handles custom User model"""
        if not obj.student:
            return 'N/A'
        
        # Try get_full_name() if it exists (Django User)
        if hasattr(obj.student, 'get_full_name') and callable(obj.student.get_full_name):
            full_name = obj.student.get_full_name()
            if full_name and full_name.strip():
                return full_name
        
        # Fallback: try first_name and last_name fields
        if hasattr(obj.student, 'first_name') and hasattr(obj.student, 'last_name'):
            full_name = f"{obj.student.first_name} {obj.student.last_name}".strip()
            if full_name:
                return full_name
        
        # Final fallback: username
        return obj.student.username if hasattr(obj.student, 'username') else 'Unknown'

    @admin.display(description='Student Email')
    def student_email(self, obj):
        return obj.student.email if obj.student and hasattr(obj.student, 'email') else 'N/A'

    @admin.display(description='Paid Status')
    def order_paid_status(self, obj):
        return 'Paid' if obj.paid_status else 'Unpaid'

    @admin.display(description='Total Amount')
    def order_total_amount(self, obj):
        return f"${obj.total_amount:.2f}"

    list_display = (
        'oid', 'student', 'student_full_name', 'student_email',
        'order_total_amount', 'order_paid_status', 'created_at',
    )
    
    list_filter = ('paid_status', 'created_at',)
    search_fields = ('oid', 'student__username', 'student__email')
    date_hierarchy = 'created_at'
    
    readonly_fields = ('oid', 'created_at', 'order_total_amount', 'sub_total', 'total_amount',)
    
    fieldsets = (
        ('Order Information', {
            'fields': ('oid', 'student', 'created_at')
        }),
        ('Financial Details', {
            'fields': ('sub_total', 'total_amount', 'order_total_amount')
        }),
        ('Payment Status', {
            'fields': ('paid_status',)
        }),
    )


@admin.register(CartOrderItem)
class CartOrderItemAdmin(admin.ModelAdmin):
    """Admin configuration for CartOrderItem model."""

    @admin.display(description='Order ID')
    def get_order_oid(self, obj):
        return obj.order.oid

    list_display = ('get_order_oid', 'course_title', 'price',)
    list_filter = ('order__created_at',)
    search_fields = ('order__oid', 'course_title')
    readonly_fields = ('order', 'course_title', 'price',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Admin configuration for Transaction model."""
    # Removed broken Inline (TransactionCourseInline)
    
    # Added this so you can easily select courses in the Admin UI
    filter_horizontal = ('courses',) 

    # Custom field definition for cleaner display
    @admin.display(description='Order ID')
    def get_order_oid(self, obj):
        return obj.related_order_id if obj.related_order_id else 'N/A'

    @admin.display(description='User Display')
    def user_display(self, obj):
        return obj.user.username if obj.user else 'N/A'

    @admin.display(description='Student Display')
    def student_display(self, obj):
        return obj.student.username if obj.student else 'N/A'
    
    @admin.display(description='Courses Count')
    def courses_count(self, obj):
        return obj.courses.count()
    
    # Keep list_display clean and performant
    list_display = (
        'id', 'user_display', 'get_order_oid', 'amount', 'currency', 
        'status', 'transaction_type', 'courses_count', 'paid_date', 'created_at',
    )

    list_filter = ('status', 'transaction_type', 'gateway', 'created_at',)
    search_fields = (
        'id', 'user__username', 'student__username', 'stripe_payment_intent_id', 
        'reference_number', 'related_order_id',
    )
    date_hierarchy = 'created_at'
    
    readonly_fields = (
        'id', 'user', 'student', 'gateway', 'amount', 'currency', 
        'stripe_payment_intent_id', 'stripe_customer_id', 
        'paid_date', 'created_at', 'updated_at',
    )
    
    fieldsets = (
        ('Transaction Information', {
            'fields': ('id', 'status', 'transaction_type', 'payment_method_used', 'reference_number', 'notes')
        }),
        ('Financial Details', {
            'fields': ('amount', 'currency', 'due_date', 'paid_date')
        }),
        ('User & Order Association', {
            'fields': ('user', 'student', 'related_order_id', 'gateway')
        }),
        ('Courses', {
            'fields': ('courses',)  # Allows viewing associated courses
        }),
        ('Stripe Details (Read-Only)', {
            'fields': ('stripe_payment_intent_id', 'stripe_customer_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )



admin.site.register(Earning)