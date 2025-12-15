import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeacherPaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/payment/payments/teacher/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPayments(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load payments');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments
    .filter((payment) => {
      if (filterStatus !== 'all' && payment.status !== filterStatus) {
        return false;
      }
      if (
        searchTerm &&
        !payment.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date_paid) - new Date(a.date_paid);
      } else if (sortBy === 'amount') {
        return b.amount - a.amount;
      }
      return 0;
    });

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedPayments = filteredPayments.filter((p) => p.status === 'completed').length;
  const pendingPayments = filteredPayments.filter((p) => p.status === 'pending').length;

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabel}
      </span>
    );
  };

  const downloadReceipt = (paymentId) => {
    const token = localStorage.getItem('access_token');
    window.open(
      `http://localhost:8000/payment/payments/${paymentId}/receipt/`,
      '_blank',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
          <p className="text-sm text-gray-600">Loading your payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="pb-6 mb-8 border-b-2 border-gray-200">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Payment History</h1>
          <p className="text-sm text-gray-600">View and manage your payment details</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
            <span className="text-lg">⚠️</span>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
          <div className="p-6 transition-shadow bg-white rounded-lg shadow hover:shadow-lg">
            <div className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Total Received
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${totalAmount.toFixed(2)}
            </div>
          </div>
          <div className="p-6 transition-shadow bg-white rounded-lg shadow hover:shadow-lg">
            <div className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Completed Payments
            </div>
            <div className="text-3xl font-bold text-gray-900">{completedPayments}</div>
          </div>
          <div className="p-6 transition-shadow bg-white rounded-lg shadow hover:shadow-lg">
            <div className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Pending Payments
            </div>
            <div className="text-3xl font-bold text-amber-500">{pendingPayments}</div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col items-stretch gap-4 p-4 mb-6 bg-white rounded-lg shadow md:flex-row md:items-center">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by course or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 text-sm transition border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 text-sm transition bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 text-sm transition bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>

            <button
              onClick={fetchPayments}
              className="px-4 py-2 text-sm font-medium text-white transition bg-blue-500 rounded-lg hover:bg-blue-600 whitespace-nowrap"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-lg shadow">
            <div className="mb-4 text-5xl">📭</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">No payments found</h2>
            <p className="text-sm text-gray-600">
              {payments.length === 0
                ? "You haven't received any payments yet."
                : 'No payments match your current filters.'}
            </p>
          </div>
        ) : (
          /* Payments Table */
          <div className="mb-6 overflow-hidden bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Course
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`hover:bg-gray-50 transition ${
                        payment.status === 'pending'
                          ? 'bg-yellow-50'
                          : payment.status === 'failed'
                          ? 'bg-red-50'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {new Date(payment.date_paid).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{payment.course_name}</p>
                          <p className="text-xs text-gray-500">{payment.course_code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 text-xs text-gray-700 break-all bg-gray-100 rounded">
                          {payment.transaction_id}
                        </code>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => downloadReceipt(payment.id)}
                          className="px-3 py-2 text-xs font-medium text-white transition bg-blue-500 rounded hover:bg-blue-600 whitespace-nowrap"
                          title="Download receipt"
                        >
                          📥 Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-right text-gray-500">
          Total records: <span className="font-semibold">{filteredPayments.length}</span>
        </div>
      </div>
    </div>
  );
};

export default TeacherPaymentPage;