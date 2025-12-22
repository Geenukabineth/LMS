import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/context/authService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Replace with your actual Publishable Key
const stripePromise = loadStripe('pk_test_51RM4XSRcvIaQZdctP3yVc3alQFt3RoKXXA9i4WfldxkfPvuAa6uoBqJpPbySFiMdawFZ3DdIWwgajMVPz58ePtH300p9AxiTMd');

// 1. create a separate component for the form inside Elements
const CheckoutForm = ({ orderId, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    // 2. Confirm the payment using the client_secret found in elements
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/student', // Redirect here on success
      },
      redirect: 'if_required', // Prevent redirect if we want to handle it manually
    });

    if (error) {
      setMessage(error.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      
      // 3. Tell backend to fulfill the order (Optional if you rely on Webhooks)
      const token = authService.getToken();
      await fetch('http://localhost:8000/payment/confirm-payment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_intent_id: paymentIntent.id })
      });

      setMessage('Payment Successful!');
      setTimeout(() => {
        navigate('/student', { 
            state: { message: 'Payment successful! Courses Enrolled.' } 
        });
      }, 2000);
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-xl font-bold">Pay LKR {amount}</h2>
      {/* This replaces all your manual inputs */}
      <PaymentElement /> 
      
      {message && <div className="mt-4 text-sm text-red-500">{message}</div>}
      
      <button 
        disabled={isProcessing || !stripe || !elements} 
        className="w-full py-3 mt-6 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    // Initialize Order and Payment Intent
    const initializePayment = async () => {
      const storedCheckoutData = localStorage.getItem('checkoutData');
      const storedCart = localStorage.getItem('checkoutCart');
      
      if (!storedCheckoutData || !storedCart) {
        navigate('/student');
        return;
      }

      const checkoutData = JSON.parse(storedCheckoutData);
      const cart = JSON.parse(storedCart);
      const token = authService.getToken();

      try {
        // A. Create Order
        const orderResponse = await fetch('http://localhost:8000/payment/orders/create/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ coupon_code: "" }) // Add coupon logic if needed
        });
        
        const orderResult = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(orderResult.error);
        
        setOrderId(orderResult.oid);
        setTotalAmount(orderResult.order.total_amount);

        // B. Create Payment Intent
        const intentResponse = await fetch('http://localhost:8000/payment/payments/process/', { // This maps to CreatePaymentIntentView
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ order_id: orderResult.oid })
        });

        const intentResult = await intentResponse.json();
        if (!intentResponse.ok) throw new Error(intentResult.error);

        // Store the secret needed by Elements
        setClientSecret(intentResult.client_secret);

      } catch (error) {
        console.error("Initialization Error:", error);
        alert("Failed to initialize payment");
      }
    };

    initializePayment();
  }, [navigate]);

  const options = {
    clientSecret,
    appearance: { theme: 'stripe' },
  };

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <h1 className="mb-8 text-3xl font-bold text-center">Secure Checkout</h1>
        
        {clientSecret ? (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm orderId={orderId} amount={totalAmount} />
          </Elements>
        ) : (
          <div className="text-center">Loading Payment Securely...</div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;