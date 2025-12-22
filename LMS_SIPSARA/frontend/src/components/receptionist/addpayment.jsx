import React, { useState } from 'react';
import { X, DollarSign, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import authService from '@/context/authService';

/**
 * ✅ Fixed Addpayment Component
 * 
 * This component handles:
 * - Payment amount validation
 * - Multiple payment methods (Card, Cash, Bank Transfer, Check, Free)
 * - Payment date selection
 * - Notes/memo field
 * - Stripe payment integration for card payments
 * - Local payment recording for manual methods
 */

const Addpayment = ({
  selectedStudent,
  paymentForm,
  setPaymentForm,
  handleAddPayment,
  setShowPaymentModal,
  courses = [],
  students = []
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const token = authService.getToken();

  // ✅ Get student display name (handle both firstName/lastName and name)
  const getStudentName = () => {
    if (!selectedStudent) return 'Unknown';
    if (selectedStudent.firstName && selectedStudent.lastName) {
      return `${selectedStudent.firstName} ${selectedStudent.lastName}`;
    }
    return selectedStudent.name || selectedStudent.username || 'Unknown';
  };

  // ✅ Handle payment method change
  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setPaymentForm(prev => ({
      ...prev,
      method,
      // Clear amount for Free Card
      amount: method === 'Free' ? '0' : prev.amount
    }));
    setError(null);
  };

  // ✅ Validate payment form
  const validatePayment = () => {
    if (!selectedStudent || !selectedStudent.id) {
      setError('No student selected');
      return false;
    }

    const amount = parseFloat(paymentForm.amount);

    // Validate amount for non-free methods
    if (paymentForm.method !== 'Free') {
      if (!paymentForm.amount || isNaN(amount) || amount <= 0) {
        setError('Please enter a valid payment amount');
        return false;
      }

      if (amount > selectedStudent.balance) {
        setError(`Payment amount cannot exceed remaining balance ($${selectedStudent.balance})`);
        return false;
      }
    }

    if (!paymentForm.date) {
      setError('Please select a payment date');
      return false;
    }

    return true;
  };

  // ✅ Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!validatePayment()) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const amount = parseFloat(paymentForm.amount) || 0;

      // Prepare payment data
      const paymentData = {
        student_id: selectedStudent.id,
        amount: amount,
        payment_method: paymentForm.method,
        payment_date: paymentForm.date,
        notes: paymentForm.notes,
      };

      console.log('📤 Processing payment:', paymentData);

      // For card payments, use Stripe endpoint
      if (paymentForm.method === 'Card' && amount > 0) {
        // Create payment intent for card payment
        const response = await fetch('http://localhost:8000/payment/create-payment-intent/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: null, // Manual payment
            student_id: selectedStudent.id,
            amount: amount,
            description: `Payment from ${getStudentName()}`,
            payment_method: 'card',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        console.log('✅ Payment intent created:', data);

        // Show success message
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        // For manual payment methods (Cash, Bank Transfer, Check, Free)
        const response = await fetch('http://localhost:8000/payment/record-payment/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Failed to record payment');
        }

        const result = await response.json();
        console.log('✅ Payment recorded:', result);

        // Show success message
        setSuccess(true);
        
        // Call parent handler
        if (handleAddPayment) {
          handleAddPayment();
        }

        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Handle modal close
  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setShowPaymentModal(false);
  };

  if (!selectedStudent) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Payment</h3>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 mb-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-green-900">Payment Successful!</h4>
                <p className="text-sm text-green-800">Payment has been processed.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Student Info */}
        <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900">{getStudentName()}</div>
            {selectedStudent.email && (
              <div className="text-xs text-gray-600">{selectedStudent.email}</div>
            )}
            <div className="pt-1 text-sm font-semibold text-red-600">
              Outstanding Balance: ${(selectedStudent.balance || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {/* Payment Amount */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute text-gray-600 left-3 top-3">$</span>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full py-3 pl-8 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={paymentForm.amount}
                onChange={(e) => {
                  setPaymentForm(prev => ({ ...prev, amount: e.target.value }));
                  setError(null);
                }}
                disabled={isProcessing || paymentForm.method === 'Free'}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Max: ${(selectedStudent.balance || 0).toFixed(2)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={paymentForm.method}
              onChange={handlePaymentMethodChange}
              disabled={isProcessing}
            >
              <option value="Card">💳 Credit/Debit Card</option>
              <option value="Cash">💵 Cash</option>
              <option value="Bank Transfer">🏦 Bank Transfer</option>
              <option value="Check">📝 Check</option>
              <option value="Free">🎁 Free (Scholarship)</option>
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Payment Date
            </label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={paymentForm.date}
              onChange={(e) => {
                setPaymentForm(prev => ({ ...prev, date: e.target.value }));
                setError(null);
              }}
              max={new Date().toISOString().split('T')[0]}
              disabled={isProcessing}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Notes / Reference (Optional)
            </label>
            <textarea
              placeholder="e.g., Check #12345, Transfer Reference, etc."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              disabled={isProcessing}
            />
          </div>

          {/* Info Message */}
          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Note:</span> Payment will be recorded after processing. 
              {paymentForm.method === 'Card' && ' Stripe payment will be initiated.'}
              {paymentForm.method !== 'Card' && ' Payment method will be marked for manual verification.'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isProcessing || success}
              className="flex items-center justify-center flex-1 gap-2 px-4 py-3 text-white transition bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Processing...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={18} />
                  Completed
                </>
              ) : (
                <>
                  <DollarSign size={18} />
                  Process Payment
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Addpayment;