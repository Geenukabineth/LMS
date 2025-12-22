// StudentPaymentHistory.jsx
import { useState, useEffect } from 'react';
import { CreditCard, Calendar, Download, CheckCircle, Receipt } from 'lucide-react';
import authService from '@/context/authService';

function StudentPaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalTransactions: 0,
    lastPayment: null
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {

      const token = authService.getToken();
      // --- FIX 1: Updated URL to match urls.py 'transaction-list' ---
      const response = await fetch('http://localhost:8000/payment/transactions/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Check if data is paginated (Django Rest Framework often returns { count: ..., results: [] })
        const results = Array.isArray(data) ? data : data.results || [];
        setPayments(results);
        calculateStats(results);
      } else {
        console.error("Failed to fetch history:", response.status);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData) => {
    const total = paymentsData.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const lastPayment = paymentsData.length > 0 ? paymentsData[0] : null;

    setStats({
      totalSpent: total.toFixed(2),
      totalTransactions: paymentsData.length,
      lastPayment: lastPayment
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentMethodIcon = (method) => {
    // --- FIX 2: Match backend values ('stripe', 'card', etc.) ---
    if (method === 'stripe' || method === 'card') {
      return <CreditCard size={20} />;
    }
    return <CreditCard size={20} />;
  };

  const downloadReceipt = async (paymentId) => {
    // NOTE: Your urls.py currently DOES NOT have a receipt endpoint. 
    // You need to add a view for this in backend if you want it to work.
    alert("Receipt download feature coming soon!"); 
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="mt-1 text-gray-600">View all your transactions</p>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalSpent}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Receipt size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Last Payment</p>
                <p className="text-lg font-bold text-gray-900">
                  {/* --- FIX 3: Use 'created_at' from backend --- */}
                  {stats.lastPayment ? formatDate(stats.lastPayment.created_at) : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          </div>

          {payments.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No payment history yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {payments.map((payment) => (
                <div key={payment.id} className="p-6 transition hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    {/* Payment Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          {/* --- FIX 4: Use 'payment_method_used' --- */}
                          {getPaymentMethodIcon(payment.payment_method_used)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                             {/* --- FIX 5: Backend sends 'transaction_type', not course_title directly --- */}
                            {payment.transaction_type === 'course_purchase' ? 'Course Purchase' : payment.transaction_type}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Order Ref: {payment.related_order_id || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 ml-14">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <Calendar size={14} />
                            {/* --- FIX 6: Use 'created_at' --- */}
                            {formatDate(payment.created_at)}
                          </span>
                          <span className="capitalize">
                            {/* --- FIX 7: Use 'payment_method_used' --- */}
                            Method: {payment.payment_method_used || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Amount and Actions */}
                    <div className="text-right">
                      <div className="mb-4">
                        <p className="text-2xl font-bold text-gray-900">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === 'successful' || payment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <CheckCircle size={12} />
                          {payment.status}
                        </span>
                      </div>

                      <button
                        onClick={() => downloadReceipt(payment.id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Download size={16} />
                        Receipt
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentPaymentHistory;