"""
payment/views.py - Complete Stripe Payment Integration with Payment Intents
FIXED: Proper cart handling with course_id and price updates
"""

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction as db_transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from decimal import Decimal
import stripe
import logging
import json 

from .models import (
    PaymentGateway, Transaction, Cart, CartOrder, CartOrderItem, Earning
)
from .serializers import (
    PaymentGatewaySerializer, TransactionSerializer, TransactionCreateSerializer,
    CartSerializer, CartCreateSerializer, CartOrderSerializer,
    CartOrderCreateSerializer, CartOrderItemSerializer,
    PaymentProofSerializer, OrderSummarySerializer,
    PaymentIntentCreateSerializer
)
from django.conf import settings

logger = logging.getLogger(__name__)

# Configure Stripe: Keys must be defined in your settings.py
stripe.api_key = settings.STRIPE_SECRET_KEY


# =========================
# HELPER FUNCTIONS
# =========================

def get_or_create_gateway():
    """Get or create Stripe payment gateway record"""
    gateway, created = PaymentGateway.objects.get_or_create(
        name='Stripe',
        defaults={'description': 'Stripe Payment Gateway', 'is_active': True}
    )
    return gateway

def calculate_total_amount(cart_items, coupon_code=None):
    """
    Calculates the final total amount in local currency (Decimal) and cents (int).
    NOTE: Replace this with your actual logic to fetch real course prices.
    """
    total = Decimal('0.00')
    for item in cart_items:
        total += item.price
    
    # Ensure amount is an integer of cents for Stripe
    amount_in_cents = int(total.quantize(Decimal('0.01')) * 100)
    
    return total.quantize(Decimal('0.01')), amount_in_cents

def fulfill_order(order: CartOrder, transaction: Transaction):
    """
    CRITICAL: Logic to grant student access to the purchased courses.
    This function is called upon successful payment confirmation.
    """
    logger.info(f"Fulfilling Order {order.oid} for user {order.student.username}...")
    
    with db_transaction.atomic():
        # 1. Update transaction and order status
        transaction.mark_as_completed()
        # The mark_as_completed method updates order.paid_status
        
        # 2. Grant course access (Placeholder - REPLACE WITH REAL LOGIC)
        for item in order.items.all():
            logger.info(f"ENROLLING {order.student.id} in course: {item.course_title}")
            # >>> REAL LOGIC EXAMPLE: UserCourseAccess.objects.create(user=order.student, course_id=item.course_id_from_title)

        Cart.objects.filter(user=order.student).delete()
        logger.info(f"Cleared cart for user {order.student.username} after order fulfillment.")
        
        logger.info("Order fulfillment complete.")


# =========================
# MAIN PAYMENT FLOW VIEWS
# =========================

class paymentlistview(generics.ListAPIView):
    """List all transactions for the authenticated user"""
    permission_classes = [permissions.AllowAny]
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer


class ProcessPaymentView(APIView):
    """
    Main endpoint for initiating a payment flow. 
    It instructs the frontend on the next steps (create order, then create intent).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # This view acts as a dispatcher for the frontend
        return Response({
            'message': 'To start payment, first call /orders/create/ to finalize the price, then call /create-payment-intent/ with the returned order_id (oid).',
            'stripe_public_key': settings.STRIPE_PUBLIC_KEY,
            'available_gateways': PaymentGatewaySerializer(PaymentGateway.objects.filter(is_active=True), many=True).data
        }, status=status.HTTP_200_OK)


# =========================
# STRIPE PAYMENT INTENT VIEWS
# =========================

class CreatePaymentIntentView(APIView):

    permission_classes = [permissions.AllowAny]
   

    def post(self, request, *args, **kwargs):
        serializer = PaymentIntentCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order: CartOrder = serializer.order
        student = request.user
        stripe_gateway = get_or_create_gateway()

        # Check if amount is valid
        final_amount_decimal = order.total_amount
        amount_in_cents = int(final_amount_decimal * 100)
        
        if amount_in_cents <= 0:
            return Response({"error": "Order amount must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with db_transaction.atomic():
                # 1. Get or create Stripe Customer (using order.student for email)
                # Note: In production, you would check if the User already has a stored Stripe Customer ID.
                # NEW CODE (Safe version)

# 1. Construct the name safely
                if hasattr(student, 'first_name') and hasattr(student, 'last_name'):
                    student_name = f"{student.first_name} {student.last_name}"
                elif hasattr(student, 'First_Name') and hasattr(student, 'Last_Name'): # For your Teacher model
                    student_name = f"{student.First_Name} {student.Last_Name}"
                else:
                    student_name = student.username

                # 2. Create Customer
                customer = stripe.Customer.create(
                    email=student.email,
                    name=student_name, 
                    metadata={'user_id': student.id}
                )

                stripe_customer_id = customer.id

                # 2. Create Stripe Payment Intent
                intent = stripe.PaymentIntent.create(
                    amount=amount_in_cents,
                    currency="LKR",
                    customer=stripe_customer_id,
                    metadata={
                        'order_id': order.oid,
                        'user_id': student.id,
                    },
                    automatic_payment_methods={"enabled": True} # This is required for the PaymentElement to work
                ) 
                

                # 3. Create or update local Transaction record
                transaction_created = Transaction.objects.get_or_create(
                    stripe_payment_intent_id=intent['id'],
                    defaults={
                        'user': student,
                        'student': student,
                        'amount': final_amount_decimal,
                        'currency': "LKR",
                        'gateway': stripe_gateway,
                        'transaction_type': 'course_purchase',
                        'related_order_id': order.oid,  # Store order reference
                        'stripe_customer_id': stripe_customer_id,
                        'payment_method_used': 'stripe',
                        'status': 'pending'
                    }
                )

                transaction = transaction_created[0] if isinstance(transaction_created, tuple) else transaction_created

                courses_to_add = []
                for item in order.items.all():
                    if item.course: # Ensure course exists
                        courses_to_add.append(item.course)
                
                serializer = TransactionSerializer(transaction)
                
                return Response({
                    'client_secret': intent.client_secret,
                    'payment_intent_id': intent.id,
                    'order_id': order.oid,
                    'amount': final_amount_decimal
                }, status=status.HTTP_200_OK)

        except stripe.error.StripeError as e:
            logger.error(f"Stripe Error: {str(e)}")
            return Response(
                {'error': f'Payment processing failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Payment Intent Creation Error: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConfirmPaymentView(APIView):
    """
    After the frontend confirms the payment with Stripe.js,
    the frontend calls this endpoint to confirm locally.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        payment_intent_id = request.data.get('payment_intent_id')
        
        if not payment_intent_id:
            return Response(
                {'error': 'payment_intent_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Retrieve the payment intent from Stripe
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            if intent.status == 'succeeded':
                # Update our local transaction record
                try:
                    transaction = Transaction.objects.get(stripe_payment_intent_id=payment_intent_id)
                    order = transaction.order
                    
                    if not order.paid_status:
                        fulfill_order(order, transaction)
                        
                        return Response({
                            'success': True,
                            'message': 'Payment confirmed and order fulfilled.',
                            'order_id': order.oid
                        }, status=status.HTTP_200_OK)
                    else:
                        return Response({
                            'success': True,
                            'message': 'Order already fulfilled.',
                            'order_id': order.oid
                        }, status=status.HTTP_200_OK)

                except Transaction.DoesNotExist:
                    logger.error(f"Transaction not found for PI: {payment_intent_id}")
                    return Response(
                        {'error': 'Transaction not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {'error': f'Payment intent status: {intent.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except stripe.error.StripeError as e:
            logger.error(f"Stripe Error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    Webhook handler for Stripe events.
    CRITICAL: Verify the signature to ensure the webhook is from Stripe.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            logger.error("Invalid payload")
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature")
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get('type')
        data = event.get('data', {}).get('object', {})

        if event_type == 'payment_intent.succeeded':
            payment_intent_id = data.get('id')
            logger.info(f"Webhook: payment_intent.succeeded for ID {payment_intent_id}")
            
            try:
                with db_transaction.atomic():
                    # Use select_for_update to prevent race conditions
                    transaction = Transaction.objects.select_for_update().get(
                        stripe_payment_intent_id=payment_intent_id
                    )
                    order = transaction.order
                    
                    if not order.paid_status:
                        fulfill_order(order, transaction)
                        logger.info(f"Order {order.oid} successfully fulfilled via webhook.")
                    else:
                        logger.info(f"Order {order.oid} already fulfilled. Skipping.")

            except Transaction.DoesNotExist:
                logger.error(f"Webhook Error: Transaction with PI ID {payment_intent_id} not found.")
                return Response({'message': 'Transaction not found, but acknowledged.'}, status=status.HTTP_200_OK)
            except Exception as e:
                logger.critical(f"Webhook Fulfillment Error: {e}", exc_info=True)
                # Return 500 to allow Stripe to retry the webhook
                return Response({'error': 'Internal server error during fulfillment'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif event_type == 'payment_intent.payment_failed':
            payment_intent_id = data.get('id')
            logger.warning(f"Webhook: payment_intent.payment_failed for ID {payment_intent_id}")
            try:
                transaction = Transaction.objects.get(stripe_payment_intent_id=payment_intent_id)
                transaction.mark_as_failed()
            except Transaction.DoesNotExist:
                logger.error(f"Failed PI ID {payment_intent_id} not found locally.")

        # Acknowledge receipt of the event
        return Response({'success': True}, status=status.HTTP_200_OK)


# =========================
# ORDER AND CART VIEWS
# =========================

class PaymentGatewayListAPIView(generics.ListAPIView):
    """Get list of active payment gateways"""
    serializer_class = PaymentGatewaySerializer
    queryset = PaymentGateway.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated]


class CartListAPIView(generics.ListAPIView):
    """Get all cart items for authenticated user"""
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user).select_related('course')


# ============================================================
# FIXED: CartCreateAPIView with proper course and price handling
# ============================================================

class CartCreateAPIView(generics.CreateAPIView):
    """
    FIXED: Add a course to the cart.
    
    Now properly:
    1. Accepts course_id from frontend
    2. Validates course exists and is not already in cart
    3. Fetches the actual course object
    4. Gets the real price from the course (not user input)
    5. Saves with all correct data
    """
    serializer_class = CartCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """
        Override create to use CartCreateSerializer's custom logic.
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CartDetailAPIView(generics.RetrieveDestroyAPIView):
    """
    FIXED: Retrieve or delete a specific cart item.
    
    Lookup field matches the URL parameter and model field.
    """
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'      # Match Cart model's primary key (ShortUUIDField)
    lookup_url_kwarg = 'id'  # Match URL parameter name

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user).select_related('course')


class CartClearAPIView(APIView):
    """Clear all items from the authenticated user's cart"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        deleted_count, _ = Cart.objects.filter(user=request.user).delete()
        return Response(
            {"detail": f"Cart cleared ({deleted_count} items removed)"}, 
            status=status.HTTP_204_NO_CONTENT
        )


class OrderCreateAPIView(APIView):
    """
    Endpoint to create a CartOrder from the current cart items.
    This step finalizes the price BEFORE the payment intent is created.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # 1. Get user's cart items
        cart_items = Cart.objects.filter(user=request.user).select_related('course')
        if not cart_items.exists():
            return Response(
                {"error": "Cart is empty. Cannot create order."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sub_total = sum(item.price for item in cart_items)

        # 2. Calculate total amount (can use OrderSummarySerializer validation here)
        final_amount_decimal, _ = calculate_total_amount(cart_items, request.data.get('coupon_code'))

        try:
            with db_transaction.atomic():
                # 3. Create CartOrder
                order = CartOrder.objects.create(
                    student=request.user,
                    total_amount=final_amount_decimal,
                    sub_total=sub_total,    
                    paid_status=False
                )

                # 4. Move cart items to order items and clear cart
                for cart_item in cart_items:
                    CartOrderItem.objects.create(
                        order=order,
                        course_title=cart_item.course.title,  # Use actual course title
                        price=cart_item.price  # Use cart item's price (already fetched from course)
                    )
                
                # Clear the cart after successfully creating the order
                # cart_items.delete()

                order_serializer = CartOrderSerializer(order)

                return Response({
                    'message': 'Order successfully created. Proceed to payment.',
                    'order': order_serializer.data,
                    'oid': order.oid  # Return oid for the next step
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating order: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrderListAPIView(generics.ListAPIView):
    """Get all orders for authenticated user"""
    serializer_class = CartOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CartOrder.objects.filter(student=self.request.user).order_by('-created_at')


class OrderDetailAPIView(generics.RetrieveAPIView):
    """Get order details"""
    serializer_class = CartOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'oid'
    
    def get_queryset(self):
        return CartOrder.objects.filter(student=self.request.user)


# =========================
# TRANSACTION VIEWS
# =========================

class TransactionListAPIView(generics.ListAPIView):
    """Get all transactions for authenticated user"""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')
    





class TransactionDetailAPIView(generics.RetrieveAPIView):
    """Get transaction details"""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        # PK is a UUID for Transaction model
        return Transaction.objects.filter(user=self.request.user)


# =========================
# LEGACY/CARD TOKEN VIEWS (Left as placeholders but marked as deprecated)
# =========================

class CreateCardTokenView(APIView):
    """Placeholder for legacy card token creation flow."""
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return Response(
            {'error': 'This endpoint is deprecated. Use the Payment Intents flow (/create-payment-intent/).'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class ChargeCustomerView(APIView):
    """Placeholder for charging customer using legacy token."""
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return Response(
            {'error': 'This endpoint is deprecated. Use the Payment Intents flow (/create-payment-intent/).'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    

# =========================
# HELPER FUNCTIONS
# =========================

# ... (Keep get_or_create_gateway and calculate_total_amount)

def fulfill_order(order: CartOrder, transaction: Transaction):
   
    logger.info(f"Fulfilling Order {order.oid} for user {order.student.username}...")
    
    with db_transaction.atomic():
        # 1. Update transaction and order status
        transaction.mark_as_completed()
        
        # 2. Grant course access & Calculate Splits
        # We iterate through the courses linked to the transaction to get the specific price/teacher
        for course in transaction.courses.all():
            logger.info(f"Processing enrollment and split for course: {course.title}")
            
            # --- ACCESS LOGIC (Placeholder) ---
            # UserCourseAccess.objects.create(user=order.student, course=course)

            # --- REVENUE SPLIT LOGIC ---
            price = course.price 
            
            # Calculate amounts
            teacher_amount = price * Decimal('0.85')
            company_amount = price * Decimal('0.10')
            admin_amount = price * Decimal('0.05')

            # 1. Create Teacher Earning
            if course.teacher:
                Earning.objects.create(
                    transaction=transaction,
                    course=course,
                    user=course.teacher,
                    amount=teacher_amount,
                    earning_type='teacher'
                )

            # 2. Create Company (Platform) Earning
            # user is null because it goes to the house
            Earning.objects.create(
                transaction=transaction,
                course=course,
                user=None, 
                amount=company_amount,
                earning_type='platform'
            )

            # 3. Create Admin Earning
            # Assuming the first superuser is the "Admin" beneficiary, or you can leave user null
            # For now, we will try to find a superuser, otherwise leave null
            admin_user = None
            from django.contrib.auth import get_user_model
            User = get_user_model()
            superuser = User.objects.filter(is_superuser=True).first()
            if superuser:
                admin_user = superuser

            Earning.objects.create(
                transaction=transaction,
                course=course,
                user=admin_user,
                amount=admin_amount,
                earning_type='admin'
            )

        # 3. Clear Cart
        Cart.objects.filter(user=order.student).delete()
        logger.info("Order fulfillment and revenue split complete.")

# =========================
# ADMIN PAYMENT VIEW
# =========================

class AdminPaymentListAPIView(generics.ListAPIView):

    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAdminUser] # Only Admins can see this

    def get_queryset(self):
        # Returns all transactions sorted by date
        return Transaction.objects.all().order_by('-created_at')

    def list(self, request, *args, **kwargs):
        # Custom response to match the exact JSON structure your React "payments" state expects
        queryset = self.get_queryset()
        
        data = []
        for trans in queryset:
            data.append({
                "id": str(trans.id), # React expects ID
                "description": f"Order #{trans.related_order_id}",
                "user": trans.user.username if trans.user else "Unknown",
                "email": trans.user.email if trans.user else "N/A",
                "amount": float(trans.amount),
                "status": trans.status, # completed, pending, failed
                "method": trans.payment_method_used or "Stripe",
                "date": trans.created_at.strftime("%Y-%m-%d"),
                "time": trans.created_at.strftime("%H:%M"),
            })
            
        return Response(data)
    

class RecordPaymentView(APIView):
    """
    ✅ NEW: Record manual payments (Cash, Check, Bank Transfer, Free)
    
    POST /payment/record-payment/
    
    Request body:
    {
        "student_id": 1,
        "amount": 100.00,
        "payment_method": "Cash",  # Card, Cash, Bank Transfer, Check, Free
        "payment_date": "2025-12-05",
        "notes": "Payment received in person"
    }
    
    Response:
    {
        "success": true,
        "message": "Payment recorded successfully",
        "transaction": { ... },
        "updated_balance": 0.00
    }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            student_id = request.data.get('student_id')
            amount = request.data.get('amount')
            payment_method = request.data.get('payment_method', 'Other')
            payment_date = request.data.get('payment_date')
            notes = request.data.get('notes', '')

            # Validate input
            if not student_id or amount is None:
                return Response({
                    'success': False,
                    'error': 'student_id and amount are required'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                amount = float(amount)
            except (ValueError, TypeError):
                return Response({
                    'success': False,
                    'error': 'Invalid amount'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get student
            try:
                student = User.objects.get(id=student_id)
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Student not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Map payment method to code
            method_map = {
                'Card': 'card',
                'Cash': 'physical',
                'Bank Transfer': 'bank',
                'Check': 'physical',
                'Free': 'other'
            }
            payment_method_code = method_map.get(payment_method, 'other')

            # Parse payment date
            from datetime import datetime
            try:
                paid_date = datetime.fromisoformat(payment_date) if payment_date else timezone.now()
            except:
                paid_date = timezone.now()

            # Create transaction record
            gateway = get_or_create_gateway()
            
            transaction = Transaction.objects.create(
                student=student,
                user=request.user,
                amount=Decimal(str(amount)),
                currency='LKR',
                status='successful' if amount > 0 else 'pending',
                transaction_type='course_purchase',
                payment_method_used=payment_method_code,
                gateway=gateway,
                paid_date=paid_date if amount > 0 else None,
                notes=f"Manual Payment ({payment_method}): {notes}",
                reference_number=f"MANUAL-{student_id}-{timezone.now().timestamp()}"
            )

            print(f"✅ Transaction created: {transaction.id}")
            print(f"   Student: {student.username}")
            print(f"   Amount: ${amount}")
            print(f"   Method: {payment_method}")

            # Serialize and return
            serializer = TransactionSerializer(transaction)
            
            return Response({
                'success': True,
                'message': f'Payment of ${amount} recorded successfully',
                'transaction': serializer.data,
                'updated_balance': float(amount)  # This should be updated by parent
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error recording payment: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)