"""
payment/views.py - Complete Stripe Payment Integration with Payment Intents
FIXED: Proper cart handling with course_id and price updates
"""

import io
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
from django.http import HttpResponse
from course.models import EnrolledCourse


 

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

from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from io import BytesIO
from datetime import timedelta
import uuid

from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth, TruncYear

logger = logging.getLogger(__name__)

# Configure Stripe: Keys must be defined in your settings.py
stripe.api_key = settings.STRIPE_SECRET_KEY



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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = PaymentIntentCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        order = serializer.order
        student = request.user
        stripe_gateway = get_or_create_gateway()

        final_amount_decimal = order.total_amount
        amount_in_cents = int(final_amount_decimal * 100)

        if amount_in_cents <= 0:
            return Response({"error": "Order amount must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with db_transaction.atomic():
                # ✅ 1) Get or create Stripe customer id
                stripe_customer_id = getattr(student, "stripe_customer_id", None)

                if stripe_customer_id:
                    # verify customer exists in Stripe (optional but safe)
                    try:
                        stripe.Customer.retrieve(stripe_customer_id)
                    except stripe.error.InvalidRequestError:
                        stripe_customer_id = None

                if not stripe_customer_id:
                    customer = stripe.Customer.create(
                        email=student.email,
                        name=getattr(student, "full_name", "") or student.get_username(),
                        metadata={"user_id": student.id}
                    )
                    stripe_customer_id = customer["id"]

                    # save to user model if field exists
                    if hasattr(student, "stripe_customer_id"):
                        student.stripe_customer_id = stripe_customer_id
                        student.save(update_fields=["stripe_customer_id"])

                # ✅ 2) Create payment intent
                intent = stripe.PaymentIntent.create(
                    amount=amount_in_cents,
                    currency="LKR",
                    customer=stripe_customer_id,
                    metadata={"order_id": order.oid, "user_id": student.id},
                    automatic_payment_methods={"enabled": True},
                )

                # ✅ 3) Create transaction
                transaction_obj, _ = Transaction.objects.get_or_create(
                    stripe_payment_intent_id=intent["id"],
                    defaults={
                        "user": student,
                        "student": student,
                        "amount": final_amount_decimal,
                        "currency": "LKR",
                        "gateway": stripe_gateway,
                        "transaction_type": "course_purchase",
                        "related_order_id": order.oid,
                        "stripe_customer_id": stripe_customer_id,
                        "payment_method_used": "stripe",
                        "status": "pending",
                    },
                )

                # ✅ 4) Attach courses from cart
                cart_items = Cart.objects.filter(user=student).select_related("course")
                course_list = [ci.course for ci in cart_items if ci.course]
                if course_list:
                    transaction_obj.courses.set(course_list)

                return Response(
                    {
                        "client_secret": intent.client_secret,
                        "payment_intent_id": intent.id,
                        "order_id": order.oid,
                        "amount": final_amount_decimal,
                    },
                    status=status.HTTP_200_OK,
                )

        except stripe.error.StripeError as e:
            return Response({"error": f"Payment processing failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.all().order_by('-created_at')

        student_id = self.request.query_params.get('student_id')
        if student_id:
            try:
                sid = int(student_id)
                qs = qs.filter(student_id=sid)  # student is AUTH_USER_MODEL FK
            except ValueError:
                pass

        # If you want normal users to only see their own:
        if not self.request.user.is_staff:
            qs = qs.filter(user=self.request.user)

        return qs


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
    


from lms.models import Student
from course.models import EnrolledCourse

def fulfill_order(order, transaction):
    with db_transaction.atomic():
        transaction.mark_as_completed()

        # ✅ Convert User -> Student
        student_profile = Student.objects.get(user=order.student)

        for course in transaction.courses.all():
            EnrolledCourse.objects.get_or_create(
                user=student_profile,   # ✅ Student instance
                course=course,
                defaults={
                    "teacher": course.teacher,
                    "status": "active",
                }
            )

        Cart.objects.filter(user=order.student).delete()



# =========================
# ADMIN PAYMENT VIEW
# =========================

class AdminPaymentListAPIView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAdminUser]

    TIME_RANGE_MAP = {"1d": 1, "7d": 7, "30d": 30, "90d": 90}

    def get_queryset(self):
        qs = Transaction.objects.select_related("user", "student").all().order_by("-created_at")

        # --- Filters ---
        search = (self.request.query_params.get("search") or self.request.query_params.get("q") or "").strip()
        status_param = (self.request.query_params.get("status") or "").strip().lower()
        time_range = (self.request.query_params.get("time_range") or "").strip().lower()

        # Status filter (frontend uses "completed", model uses "successful")
        if status_param and status_param != "all":
            if status_param == "completed":
                status_param = "successful"
            qs = qs.filter(status=status_param)

        # Time range filter (1d/7d/30d/90d)
        if time_range in self.TIME_RANGE_MAP:
            days = self.TIME_RANGE_MAP[time_range]
            qs = qs.filter(created_at__gte=timezone.now() - timedelta(days=days))

        # Search filter
        if search:
            # If search looks like a UUID, also try exact match on Transaction.id
            uuid_q = Q()
            try:
                uuid_val = uuid.UUID(search)
                uuid_q = Q(id=uuid_val)
            except Exception:
                pass

            qs = qs.filter(
                uuid_q |
                Q(related_order_id__icontains=search) |
                Q(reference_number__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(student__username__icontains=search) |
                Q(student__email__icontains=search)
            )

        return qs

    def _row(self, trans: Transaction):
        return {
            "id": str(trans.id),
            "description": f"Order #{trans.related_order_id}",
            "user": trans.user.username if trans.user else "Unknown",
            "email": trans.user.email if trans.user else "N/A",
            "amount": float(trans.amount),
            "status": trans.status,  # pending/successful/failed/refunded
            "method": trans.payment_method_used or "Stripe",
            "date": trans.created_at.strftime("%Y-%m-%d"),
            "time": trans.created_at.strftime("%H:%M"),
        }

    def _build_stats(self, qs):
        total_transactions = qs.count()

        successful_qs = qs.filter(status="successful")
        pending_qs = qs.filter(status="pending")

        total_revenue = successful_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        pending_amount = pending_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        # Admin revenue: 30% of successful revenue
        admin_revenue = (total_revenue * Decimal("0.30")).quantize(Decimal("0.01"))

        successful_count = successful_qs.count()
        success_rate = round((successful_count / total_transactions) * 100, 2) if total_transactions else 0.0

        return {
            "total_transactions": total_transactions,
            "total_revenue": float(total_revenue),
            "admin_revenue": float(admin_revenue),
            "pending_amount": float(pending_amount),
            "success_rate": success_rate,
        }

    def _export_pdf(self, request, qs):
        stats = self._build_stats(qs)

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=landscape(letter), leftMargin=18, rightMargin=18, topMargin=18, bottomMargin=18)
        styles = getSampleStyleSheet()
        elements = []

        title = Paragraph("Admin Payments Report", styles["Title"])
        elements.append(title)
        elements.append(Spacer(1, 8))

        # Show filters in PDF header
        search = request.query_params.get("search") or request.query_params.get("q") or ""
        status_param = request.query_params.get("status") or "all"
        time_range = request.query_params.get("time_range") or ""
        filters_line = Paragraph(
            f"Filters — search: <b>{search or 'N/A'}</b>, status: <b>{status_param}</b>, time_range: <b>{time_range or 'N/A'}</b>",
            styles["Normal"]
        )
        elements.append(filters_line)
        elements.append(Spacer(1, 8))

        totals_line = Paragraph(
            f"Total Transactions: <b>{stats['total_transactions']}</b> &nbsp;&nbsp; "
            f"Total Revenue (successful): <b>{stats['total_revenue']:.2f}</b> &nbsp;&nbsp; "
            f"Admin Revenue (30%): <b>{stats['admin_revenue']:.2f}</b>",
            styles["Normal"]
        )
        elements.append(totals_line)
        elements.append(Spacer(1, 12))

        table_data = [[
            "#", "Date", "Time", "User", "Email", "Amount", "Status", "Method", "Order ID", "Transaction ID"
        ]]

        for i, t in enumerate(qs, start=1):
            table_data.append([
                str(i),
                t.created_at.strftime("%Y-%m-%d"),
                t.created_at.strftime("%H:%M"),
                t.user.username if t.user else "Unknown",
                t.user.email if t.user else "N/A",
                f"{t.amount}",
                t.status,
                t.payment_method_used or "Stripe",
                t.related_order_id or "",
                str(t.id)[:8] + "…",
            ])

        tbl = Table(table_data, repeatRows=1)
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ]))

        elements.append(tbl)
        doc.build(elements)

        buf.seek(0)
        resp = HttpResponse(buf.getvalue(), content_type="application/pdf")
        resp["Content-Disposition"] = 'attachment; filename="payments_report.pdf"'
        return resp

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        # 1) PDF export mode
        if request.query_params.get("export") == "pdf":
            return self._export_pdf(request, qs)

        # 2) Normal JSON list (backward compatible)
        data = [self._row(t) for t in qs]

        include_stats = (request.query_params.get("include_stats") == "true")
        if include_stats:
            return Response({
                "stats": self._build_stats(qs),
                "payments": data
            })

        return Response(data)

from django.contrib.auth import get_user_model  
from course.models import Course
from datetime import datetime
    

class RecordPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            User = get_user_model()

            student_id = request.data.get("student_id")
            course_id = request.data.get("course_id")  # OPTIONAL now ✅
            amount = request.data.get("amount")
            payment_method = request.data.get("payment_method", "Other")
            payment_date = request.data.get("payment_date")
            notes = request.data.get("notes", "")

            # ✅ Required: student_id + amount ONLY
            if not student_id or amount is None:
                return Response(
                    {"success": False, "error": "student_id and amount are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ✅ Validate amount
            try:
                amount = Decimal(str(amount))
            except (ValueError, TypeError):
                return Response(
                    {"success": False, "error": "Invalid amount"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ✅ Get student
            try:
                student = User.objects.get(id=int(student_id))
            except (User.DoesNotExist, ValueError, TypeError):
                return Response(
                    {"success": False, "error": "Student not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # ✅ Payment method mapping
            method_map = {
                "Card": "card",
                "Cash": "physical",
                "Bank Transfer": "bank",
                "Check": "physical",
                "Free": "other",
                "Other": "other",
            }
            payment_method_code = method_map.get(payment_method, "other")

            # ✅ Parse payment date
            try:
                paid_date = datetime.fromisoformat(payment_date) if payment_date else timezone.now()
            except Exception:
                paid_date = timezone.now()

            gateway = get_or_create_gateway()

            # ✅ If course_id is provided → treat as course purchase and link course
            course = None
            if course_id:
                try:
                    course = Course.objects.get(course_id=int(course_id))
                except (Course.DoesNotExist, ValueError, TypeError):
                    return Response(
                        {"success": False, "error": "Course not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )

            transaction = Transaction.objects.create(
                student=student,
                user=request.user,
                amount=amount,
                currency="LKR",
                status="successful" if amount > 0 else "pending",
                transaction_type="course_purchase" if course else "manual_payment",
                payment_method_used=payment_method_code,
                gateway=gateway,
                paid_date=paid_date if amount > 0 else None,
                notes=(
                    f"Manual Payment ({payment_method}) for Course {course.course_id}: {notes}"
                    if course
                    else f"Manual Payment ({payment_method}): {notes}"
                ),
                reference_number=(
                    f"MANUAL-{student_id}-{course_id}-{timezone.now().timestamp()}"
                    if course
                    else f"MANUAL-{student_id}-{timezone.now().timestamp()}"
                ),
            )

            # ✅ Link course only if course was provided
            if course:
                transaction.courses.add(course)

            serializer = TransactionSerializer(transaction)

            return Response(
                {
                    "success": True,
                    "message": f"Payment of LKR {amount} recorded successfully",
                    "transaction": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Error recording payment: {str(e)}")
            return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class FinancialStatsAPI(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', 'monthly') # 'monthly' or 'yearly'
        today = timezone.now()
       
        if period == 'yearly':
            trunc_func = TruncYear('created_at')
           
            start_date = today.replace(year=today.year - 4, month=1, day=1)
            date_format = '%Y' # "2024"
        else:
            trunc_func = TruncMonth('created_at')
    
            start_date = today - timezone.timedelta(days=365)
            date_format = '%b' # "Jan", "Feb"

       
        income_data = (
            Transaction.objects
            .filter(status='successful', created_at__gte=start_date)
            .annotate(period=trunc_func)
            .values('period')
            .annotate(total=Sum('amount'))
            .order_by('period')
        )

     
        expense_data = (
            Earning.objects
            .filter(earning_type='teacher', created_at__gte=start_date)
            .annotate(period=trunc_func)
            .values('period')
            .annotate(total=Sum('amount'))
            .order_by('period')
        )

        merged_data = {}

    
        for item in income_data:
            key = item['period'].strftime(date_format)
            merged_data[key] = {
                "name": key, # "Jan" or "2024"
                "income": float(item['total'] or 0),
                "expenses": 0,
                "profit": 0
            }

        
        for item in expense_data:
            key = item['period'].strftime(date_format)
            if key not in merged_data:
                merged_data[key] = {
                    "name": key,
                    "income": 0,
                    "expenses": 0,
                    "profit": 0
                }
            
            expenses = float(item['total'] or 0)
            merged_data[key]['expenses'] = expenses

   
        results = []
        for key, data in merged_data.items():
            data['profit'] = data['income'] - data['expenses']
            results.append(data)

        if period == 'monthly':
            pass 
        
        return Response(list(results))
    
class TeacherTransactionListAPIView(APIView):

    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

  

    def get_student_name(self, transaction):
        """Helper to safely get student name"""
        if transaction.student:
            if hasattr(transaction.student, 'firstName'): # Student Model
                return f"{transaction.student.firstName} {transaction.student.lastName}".strip()
            if hasattr(transaction.student, 'full_name'): # User Model custom property
                return transaction.student.full_name
            return transaction.student.username
        if transaction.user:
            return transaction.user.username
        return "Unknown Student"

    def get_student_email(self, transaction):
        """Helper to safely get student email"""
        if transaction.student:
            return transaction.student.email
        if transaction.user:
            return transaction.user.email
        return "N/A"

    def get(self, request, teacher_id=None, *args, **kwargs):
        try:
            # 1. Determine the Teacher Profile
            if teacher_id:
                # If ID passed in URL (e.g., for admin viewing a teacher)
                # Ensure your Teacher model allows querying by this ID (pk or user_id)
                from lms.models import Teacher
                teacher = get_object_or_404(Teacher, id=teacher_id)
            else:
                # Normal case: Logged in teacher viewing their own data
                if not hasattr(request.user, 'teacher'):
                     return Response({"error": "User is not a teacher"}, status=status.HTTP_403_FORBIDDEN)
                teacher = request.user.teacher

            # 2. Get Transactions that contain AT LEAST ONE course by this teacher
            transactions = Transaction.objects.filter(
                courses__teacher=teacher
            ).select_related('user', 'student').prefetch_related('courses').distinct().order_by('-created_at')
            
            # 3. Flatten the Data
            # We create a custom list where each entry is ONE course purchase
            custom_data = []

            for trans in transactions:
                # Filter: Get only the courses in this transaction that belong to THIS teacher
                relevant_courses = trans.courses.filter(teacher=teacher)

                for course in relevant_courses:
                    custom_data.append({
                        # Transaction Info
                        "id": trans.id,
                        "transaction_id": trans.order.oid if trans.order else str(trans.id)[:8],
                        "status": trans.status,
                        "date": trans.created_at,
                        
                        # Student Info
                        "student_name": self.get_student_name(trans),
                        "student_email": self.get_student_email(trans),
                        
                        # Course Info (Specific to this row)
                        "course_id": course.course_id,
                        "course_title": course.title,
                        "course_image": course.image.url if course.image else None,
                        
                        # Financials
                        # CRITICAL: Show the price of THIS course, not the total transaction amount
                        "amount": course.price if course.price else 0.00,
                        "currency": trans.currency,
                    })
            
            return Response(custom_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Teacher Transaction Error: {str(e)}")
            return Response(
                {"error": f"Failed to fetch transactions: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )