from rest_framework import serializers
from .models import (
    PaymentGateway, Transaction, Cart, CartOrder, CartOrderItem
)
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class PaymentGatewaySerializer(serializers.ModelSerializer):
    """Serializer for payment gateway information"""
    
    class Meta:
        model = PaymentGateway
        fields = [
            'id', 'name', 'description', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        # Exclude sensitive fields like api_key and api_secret


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transaction records"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    student_name = serializers.SerializerMethodField()
    gateway_name = serializers.CharField(source='gateway.name', read_only=True, allow_null=True)
    order_oid = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    courses = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'user_username', 'student', 'student_name',
            'related_order_id', 'order_oid', 'amount', 'currency', 'status',
            'status_display', 'transaction_type', 'payment_method_used',
            'stripe_payment_intent_id', 'stripe_customer_id','gateway_name',
            'reference_number', 'due_date', 'paid_date', 'created_at','courses'
        ]
        read_only_fields = [
            'id', 'user_username', 'student_name', 'order_oid', 
            'gateway_name', 'status_display', 'created_at'
        ]

    def get_student_name(self, obj):
        """Get student's full name or username"""
        if not obj.student:
            return None
        if hasattr(obj.student, 'get_full_name'):
            full_name = obj.student.get_full_name()
            return full_name if full_name else obj.student.username
        return obj.student.username
    
    def get_order_oid(self, obj):
        """Get the order's oid through the related_order_id"""
        order = obj.order  # Uses the @property
        if order:
            return order.oid
        return None
    
    def get_courses(self, obj):
        """
        Returns list of courses with their related Teacher ID.
        """
        return [{
            'title': course.title,
            'id': course.course_id,
            'image': course.image.url if course.image else None,
            
            # ✅ FIX: Use .pk instead of .id to prevent AttributeError
            'teacher_id': course.teacher.pk if course.teacher else None,
            
            # Optional: Ensure full_name is accessed safely
            'teacher_name': (
                course.teacher.full_name 
                if hasattr(course.teacher, 'full_name') 
                else str(course.teacher) 
            ) if course.teacher else "Unknown"
        } for course in obj.courses.all()]
    
    def create(self, validated_data):
        # Set user/student from request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
            validated_data['student'] = request.user
        return super().create(validated_data)


class TransactionCreateSerializer(serializers.ModelSerializer):
    """Specific serializer for creating a transaction instance (e.g., when PI is created)"""
    class Meta:
        model = Transaction
        fields = ['amount', 'currency', 'gateway', 'related_order_id']
        read_only_fields = ['currency']



# ✅ FIXED: Transaction Serializer with Fallback for Missing Student Data

from rest_framework import serializers
from .models import Transaction
from django.contrib.auth import get_user_model

User = get_user_model()


# ============================================================
# ✅ ROBUST: Transaction Serializer - Handles Missing Students
# ============================================================

class TransactionListSerializer(serializers.ModelSerializer):
    """
    ✅ FIXED: Retrieves student name with fallback logic
    
    Handles 3 scenarios:
    1. Student linked: Use Student.firstName + Student.lastName
    2. No student but user exists: Use User.username
    3. Neither: Show "Unknown Student"
    """
    
    # ✅ Method field to safely get student name
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    student_phone = serializers.SerializerMethodField()
    
    # Status display
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id',
            'student_id',           # Raw ID for reference
            'student_name',         # ✅ Full name (with fallback)
            'student_email',        # ✅ Email (with fallback)
            'student_phone',        # ✅ Phone (with fallback)
            'amount',
            'currency',
            'payment_method_used',
            'status',
            'status_display',
            'reference_number',
            'created_at',
            'paid_date'
        ]
        read_only_fields = fields

    # ✅ FALLBACK 1: Get student name (with 3-tier fallback)
    def get_student_name(self, obj):
        """
        Try to get student name with fallback logic:
        1. If student linked: firstName + lastName
        2. Else if user exists: username
        3. Else: "Unknown Student"
        """
        # Tier 1: Student profile exists
        if obj.student:
            first = obj.student.firstName or ""
            last = obj.student.lastName or ""
            name = f"{first} {last}".strip()
            return name if name else "Unknown Student"
        
        # Tier 2: User exists
        if obj.user:
            return obj.user.username
        
        # Tier 3: Fallback
        return "Unknown Student"

    # ✅ FALLBACK 2: Get student email
    def get_student_email(self, obj):
        """Get email from Student or User"""
        if obj.student and obj.student.email:
            return obj.student.email
        if obj.user and obj.user.email:
            return obj.user.email
        return "N/A"

    # ✅ FALLBACK 3: Get student phone
    def get_student_phone(self, obj):
        """Get phone from Student or User"""
        if obj.student and obj.student.phone:
            return obj.student.phone
        if obj.user and obj.user.phone:
            return obj.user.phone
        return "N/A"


# ============================================================
# ✅ DETAIL: Complete Transaction Serializer
# ============================================================

class TransactionDetailSerializer(serializers.ModelSerializer):
    """Complete transaction details with all student information"""
    
    # ✅ Comprehensive student info
    student_first_name = serializers.SerializerMethodField()
    student_last_name = serializers.SerializerMethodField()
    student_full_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    student_phone = serializers.SerializerMethodField()
    student_info = serializers.SerializerMethodField()
    
    # User info
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    # Status
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id',
            'student_id',
            'student_first_name',
            'student_last_name',
            'student_full_name',
            'student_email',
            'student_phone',
            'student_info',
            'user_username',
            'user_email',
            'amount',
            'currency',
            'payment_method_used',
            'status',
            'status_display',
            'reference_number',
            'notes',
            'created_at',
            'paid_date'
        ]
        read_only_fields = fields

    # ✅ First name (with fallback)
    def get_student_first_name(self, obj):
        if obj.student:
            return obj.student.firstName or "Unknown"
        return obj.user.username if obj.user else "Unknown"

    # ✅ Last name (with fallback)
    def get_student_last_name(self, obj):
        if obj.student:
            return obj.student.lastName or ""
        return ""

    # ✅ Full name (combined)
    def get_student_full_name(self, obj):
        if obj.student:
            first = obj.student.firstName or ""
            last = obj.student.lastName or ""
            name = f"{first} {last}".strip()
            return name if name else (obj.user.username if obj.user else "Unknown Student")
        return obj.user.username if obj.user else "Unknown Student"

    # ✅ Email (with fallback)
    def get_student_email(self, obj):
        if obj.student and obj.student.email:
            return obj.student.email
        return obj.user.email if obj.user else "N/A"

    # ✅ Phone (with fallback)
    def get_student_phone(self, obj):
        if obj.student and obj.student.phone:
            return obj.student.phone
        return obj.user.phone if obj.user else "N/A"

    # ✅ Complete student info
    def get_student_info(self, obj):
        """Return all available student information"""
        if not obj.student:
            return {
                'id': None,
                'name': obj.user.username if obj.user else 'Unknown',
                'email': obj.user.email if obj.user else 'N/A',
                'phone': obj.user.phone if obj.user else 'N/A',
                'source': 'user'
            }
        
        return {
            'id': obj.student.id,
            'first_name': obj.student.firstName,
            'last_name': obj.student.lastName,
            'full_name': f"{obj.student.firstName} {obj.student.lastName}".strip(),
            'email': obj.student.email,
            'phone': obj.student.phone,
            'academic_year': obj.student.academicYear,
            'grade': obj.student.Grade,
            'school': obj.student.School,
            'enrollment_date': obj.student.enrollmentDate,
            'source': 'student'
        }


# ============================================================
# ✅ CREATE: Serializer for Creating Transactions
# ============================================================

class TransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating transactions with auto student linking"""
    
    class Meta:
        model = Transaction
        fields = [
            'amount',
            'currency',
            'payment_method_used',
            'reference_number',
            'notes',
            'gateway',
            'related_order_id',
            'due_date'
        ]

    def create(self, validated_data):
        """
        ✅ Automatically link student when creating transaction
        """
        from lms.models import Student
        
        request = self.context.get('request')
        user = request.user if request else None
        
        if not user:
            raise serializers.ValidationError("User is required")
        
        # Try to find Student profile
        try:
            student = Student.objects.get(user=user)
            validated_data['student'] = student
        except Student.DoesNotExist:
            # Student not found, but still create transaction with user
            pass
        
        validated_data['user'] = user
        return super().create(validated_data)


# ============================================================
# ✅ SEARCH: Serializer for Search/Filter Results
# ============================================================

class TransactionSearchSerializer(serializers.ModelSerializer):
    """Minimal serializer for search/filter results"""
    
    student_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id',
            'student_id',
            'student_name',
            'amount',
            'status',
            'created_at'
        ]

    def get_student_name(self, obj):
        if obj.student:
            return f"{obj.student.firstName} {obj.student.lastName}".strip()
        return obj.user.username if obj.user else "Unknown"


# ============================================================
# FIXED: Cart Serializers with proper course_id validation
# UPDATED: Handles Teacher model with First_Name/Last_Name
# ============================================================

class CartSerializer(serializers.ModelSerializer):
    """Serializer for reading cart items (full details)"""
    course_id = serializers.IntegerField(source='course.course_id', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_image = serializers.CharField(source='course.image', read_only=True)
    teacher_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Cart
        fields = [
            'id', 'course_id', 'course_title', 'course_image', 
            'teacher_name', 'price', 'total', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'price', 'total', 'created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        """
        FIXED: Get teacher's full name
        Handles different user models (User with username, Teacher with First_Name/Last_Name)
        """
        try:
            if not hasattr(obj.course, 'teacher') or obj.course.teacher is None:
                return None
            
            teacher = obj.course.teacher
            
            # Check if it's a Teacher model (has First_Name and Last_Name)
            if hasattr(teacher, 'first_name') and hasattr(teacher, 'last_name'):
                return f"{teacher.first_name} {teacher.last_name}"
            
            # Check if it's a User model (has username or get_full_name)
            if hasattr(teacher, 'get_full_name'):
                full_name = teacher.get_full_name()
                return full_name if full_name else getattr(teacher, 'username', 'Unknown')
            
            # Fallback to username if available
            if hasattr(teacher, 'username'):
                return teacher.username
            
            # Last resort
            return 'Unknown Teacher'
            
        except Exception as e:
            # Log the error but don't crash
            print(f"Error getting teacher name: {e}")
            return 'Unknown Teacher'


class CartCreateSerializer(serializers.Serializer):
    """
    FIXED: Serializer for creating a cart item.
    Accepts course_id from frontend, validates it, and returns full cart item details.
    """
    course_id = serializers.IntegerField(write_only=True, required=True)
    
    # Read-only fields returned after creation
    id = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def validate_course_id(self, value):
        """
        Validate that:
        1. Course exists
        2. Course is not already in user's cart
        """
        # Import here to avoid circular imports
        from course.models import Course
        
        try:
            course = Course.objects.get(course_id=value)
        except Course.DoesNotExist:
            raise serializers.ValidationError(
                f"Course with ID {value} does not exist."
            )
        
        # Check if course already in cart for this user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            cart_exists = Cart.objects.filter(
                user=request.user,
                course=course
            ).exists()
            
            if cart_exists:
                raise serializers.ValidationError(
                    "This course is already in your cart."
                )
        
        return value

    def create(self, validated_data):
        """
        Create cart item with proper course and price.
        Called automatically by CartCreateAPIView.
        """
        from course.models import Course
        
        course_id = validated_data['course_id']
        course = Course.objects.get(course_id=course_id)
        request = self.context.get('request')
        
        cart_item = Cart.objects.create(
            user=request.user,
            course=course,
            price=course.price,  # CRITICAL: Get price from course, not frontend
            total=course.price
        )
        
        return cart_item

    def to_representation(self, instance):
        """Return CartSerializer representation of created item"""
        return CartSerializer(instance).data


class CartOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartOrderItem
        fields = ['course_title', 'price']


class CartOrderSerializer(serializers.ModelSerializer):
    items = CartOrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = CartOrder
        fields = ['oid', 'student', 'total_amount', 'paid_status', 'created_at', 'items']


class CartOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartOrder
        fields = ['oid', 'total_amount']
        read_only_fields = ['oid', 'total_amount']

    def create(self, validated_data):
        # Set student from request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['student'] = request.user
        return super().create(validated_data)


class PaymentProofSerializer(serializers.Serializer):
    """Serializer for uploading payment proof"""
    transaction_id = serializers.UUIDField()
    proof_file = serializers.FileField()
    description = serializers.CharField(max_length=255, required=False)


class OrderSummarySerializer(serializers.Serializer):
    """Serializer for order summary before checkout (used for calculating total)"""
    items = serializers.ListField(child=serializers.CharField(max_length=100))
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("No items in cart/order")
        return value


class PaymentIntentCreateSerializer(serializers.Serializer):
    """
    Serializer for initiating a Stripe Payment Intent.
    Requires the ID of the Order already created.
    """
    order_id = serializers.CharField(max_length=20, required=True, help_text="Order ID (oid) to pay for.")
    
    def validate_order_id(self, value):
        user = self.context['request'].user
        try:
            # Check if order exists and belongs to the current user
            order = CartOrder.objects.get(oid=value, student=user)
        except CartOrder.DoesNotExist:
            raise serializers.ValidationError("Order not found or does not belong to user.")

        if order.paid_status:
            raise serializers.ValidationError("This order is already paid.")

        self.order = order
        return value