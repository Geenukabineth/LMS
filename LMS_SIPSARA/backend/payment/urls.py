"""
payment/urls.py - FIXED URL Routing
Critical fix: Specific routes MUST come BEFORE generic routes to prevent route ambiguity
"""

from django.urls import path
from .views import (
    # Main Payment Processing
    paymentlistview,
    
    # Payment Intents (Recommended Stripe Method)
    CreatePaymentIntentView,
    ConfirmPaymentView,
    StripeWebhookView,
    
    # Cart Management
    CartListAPIView,
    CartCreateAPIView,
    CartDetailAPIView,
    CartClearAPIView,
    
    # Order Management
    OrderListAPIView,
    OrderDetailAPIView,
    OrderCreateAPIView,
    
    # Payment Gateway
    PaymentGatewayListAPIView,
    
    # Transactions
    TransactionListAPIView,
    TransactionDetailAPIView,
    TeacherTransactionListAPIView,
    
    # Legacy endpoints (deprecated)
    CreateCardTokenView,
    ChargeCustomerView,

    AdminPaymentListAPIView,
    RecordPaymentView,
    FinancialStatsAPI,
)

app_name = 'payment'

urlpatterns = [
    # =========================
    # MAIN PAYMENT FLOW
    # Frontend expects: /payments/process/
    # =========================
    path('payments/process/', CreatePaymentIntentView.as_view(), name='process-payment'),
    path('payments/list/view/', paymentlistview.as_view(), name='confirm-payment'),
    path('dashboard/financial-stats/', FinancialStatsAPI.as_view(), name='financial-stats'),
    
    # =========================
    # STRIPE PAYMENT INTENTS (MODERN & RECOMMENDED)
    # Complete payment flow using Stripe Payment Intents
    # =========================
    path('create-payment-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('confirm-payment/', ConfirmPaymentView.as_view(), name='confirm-payment'),
    path('stripe-webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    
    # =========================
    # PAYMENT GATEWAY INFO
    # Frontend may call for available gateways
    # =========================
    path('pay/gateways/', PaymentGatewayListAPIView.as_view(), name='gateway-list'),
    
   
    # =========================
    path('cart/add/', CartCreateAPIView.as_view(), name='cart-add'),
    path('cart/clear/', CartClearAPIView.as_view(), name='cart-clear'),
    
    # Generic cart routes AFTER specific ones
    path('cart/', CartListAPIView.as_view(), name='cart-list'),
    path('cart/<str:id>/', CartDetailAPIView.as_view(), name='cart-detail'),
    
    # =========================
    # ORDER MANAGEMENT
    # Frontend calls: /orders/create/
    # =========================
    path('orders/', OrderListAPIView.as_view(), name='order-list'),
    path('orders/create/', OrderCreateAPIView.as_view(), name='order-create'),
    path('orders/<str:oid>/', OrderDetailAPIView.as_view(), name='order-detail'),
    
    # =========================
    # TRANSACTION HISTORY
    # Frontend may use for displaying transaction records
    # =========================
    path('transactions/', TransactionListAPIView.as_view(), name='transaction-list'),
    path('transactions/<uuid:pk>/', TransactionDetailAPIView.as_view(), name='transaction-detail'),
    
    # =========================
    # LEGACY CARD TOKEN ENDPOINTS (DEPRECATED)
    # These are deprecated. Use Payment Intents instead.
    # =========================
    path('create-card-token/', CreateCardTokenView.as_view(), name='create-card-token'),
    path('charge-customer/', ChargeCustomerView.as_view(), name='charge-customer'),


    # admin payment view
    
    path('payment-records/', AdminPaymentListAPIView.as_view(), name='payment-records'),
    path('record-payment/', RecordPaymentView.as_view(), name='record-payment'),


    path('teacher/transactions/', TeacherTransactionListAPIView.as_view(), name='teacher-transactions'),
    path('teacher/transactions/<str:teacher_id>/', TeacherTransactionListAPIView.as_view(), name='teacher-transaction-detail'),
     
    
]

