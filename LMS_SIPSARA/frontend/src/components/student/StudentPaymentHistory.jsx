import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Download, CheckCircle, Receipt, Loader } from 'lucide-react'; // Added Loader
import { paymentService } from '@/config/payment.config'; 

function StudentPaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null); // ✅ NEW: Track downloading state
  
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
      setLoading(true);
      const data = await paymentService.getStudentTransactions();
      const results = Array.isArray(data) ? data : data.results || [];
      setPayments(results);
      calculateStats(results);
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
    return <CreditCard size={20} />;
  };

  // ✅ UPDATED: Download Logic
  const downloadReceipt = async (paymentId, orderRef) => {
    try {
      setDownloadingId(paymentId); // Show loading spinner for this button
      
      // 1. Fetch the PDF blob
      const blob = await paymentService.downloadReceipt(paymentId);
      
      // 2. Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // 3. Create a temporary anchor tag to trigger download
      const link = document.createElement('a');
      link.href = url;
      // Set filename (e.g., Receipt-ORDER123.pdf)
      link.setAttribute('download', `Receipt-${orderRef || paymentId}.pdf`); 
      
      // 4. Append, click, and cleanup
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Download failed", error);
      alert("Failed to download receipt. Please try again later.");
    } finally {
      setDownloadingId(null);
    }
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
      <div className="bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-6 mb-6 text-white rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
          <h1 className="text-2xl font-bold text-white uppercase">Payment History</h1>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">Rs.{stats.totalSpent}</p>
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
              <div className="p-3 bg-orange-100 rounded-lg">
                <Receipt size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-gray-600">Last Payment</p>
                <p className="text-lg font-bold text-gray-900">
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
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          {getPaymentMethodIcon(payment.payment_method_used)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
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
                            {formatDate(payment.created_at)}
                          </span>
                          <span className="capitalize">
                            Method: {payment.payment_method_used || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="mb-4">
                        <p className="text-2xl font-bold text-gray-900">
                          Rs.{parseFloat(payment.amount).toFixed(2)}
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

                      {/* ✅ UPDATED: Download Button with Loading State */}
                      <button
                        onClick={() => downloadReceipt(payment.id, payment.related_order_id)}
                        disabled={downloadingId === payment.id}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {downloadingId === payment.id ? (
                          <Loader size={16} className="text-indigo-600 animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                        {downloadingId === payment.id ? 'Downloading...' : 'Receipt'}
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