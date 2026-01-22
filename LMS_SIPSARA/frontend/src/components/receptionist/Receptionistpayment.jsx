import React, { useState, useEffect } from 'react';
import { 
  Download, Eye, Search, X, Calendar,
  AlertCircle, Loader, CheckCircle, XCircle, Clock, DollarSign
} from 'lucide-react';

// ✅ FIXED: Import paymentService (replaces authService)
import { paymentService } from '@/config/payment.config';

const PaymentPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // ✅ NEW: State for tracking download progress
  const [downloading, setDownloading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Financial summary state
  const [financialSummary, setFinancialSummary] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    totalSuccessful: 0,
    totalPending: 0,
    totalFailed: 0,
    averageTransaction: 0
  });

  useEffect(() => {
    fetchPaymentRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [paymentRecords, searchTerm, filterStatus, filterMethod, sortBy]);

  // ✅ FIXED: Fetch records using paymentService
  const fetchPaymentRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      // Uses the configured API service to fetch all transactions
      // NOTE: Ensure your backend user has 'is_staff' permission to see all records,
      // otherwise this endpoint might filter to only the logged-in user.
      const data = await paymentService.getStudentTransactions();
      
      // Handle pagination (data.results) or direct array (data)
      const records = Array.isArray(data) ? data : data.results || [];
      
      setPaymentRecords(records);
      calculateFinancialSummary(records);
      
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || "Failed to fetch payment records.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle Receipt Download
  const handleDownloadReceipt = async (transactionId) => {
    try {
      setDownloading(true);
      
      // 1. Fetch the PDF blob from the service
      const blob = await paymentService.downloadReceipt(transactionId);
      
      // 2. Create a temporary download URL
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      
      // 3. Set a filename (using reference number if available, else ID)
      const ref = selectedRecord?.reference_number || transactionId.substring(0, 8);
      link.setAttribute('download', `Receipt-${ref}.pdf`);
      
      // 4. Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // 5. Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Calculate stats for the dashboard cards
  const calculateFinancialSummary = (records) => {
    if (!records.length) {
      setFinancialSummary({
        totalTransactions: 0,
        totalAmount: 0,
        totalSuccessful: 0,
        totalPending: 0,
        totalFailed: 0,
        averageTransaction: 0
      });
      return;
    }

    const successful = records.filter(r => r.status === 'successful');
    const pending = records.filter(r => r.status === 'pending');
    const failed = records.filter(r => r.status === 'failed');

    const totalAmount = successful.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    setFinancialSummary({
      totalTransactions: records.length,
      totalAmount,
      totalSuccessful: successful.length,
      totalPending: pending.length,
      totalFailed: failed.length,
      averageTransaction: successful.length > 0 ? totalAmount / successful.length : 0
    });
  };

  // Filter logic
  const applyFilters = () => {
    let filtered = [...paymentRecords];

    // 1. Status Filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // 2. Method Filter
    if (filterMethod !== 'all') {
      filtered = filtered.filter(r => r.payment_method_used === filterMethod);
    }

    // 3. Search Filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        const studentName = (r.student_name || '').toLowerCase();
        const studentEmail = (r.student_email || '').toLowerCase();
        const reference = (r.reference_number || '').toLowerCase();
        const amount = (r.amount || '').toString();
        
        return (
          studentName.includes(searchLower) ||
          studentEmail.includes(searchLower) ||
          reference.includes(searchLower) ||
          amount.includes(searchLower)
        );
      });
    }

    // 4. Sorting
    if (sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'amount-desc') {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'amount-asc') {
      filtered.sort((a, b) => a.amount - b.amount);
    }

    setFilteredRecords(filtered);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'successful':
        return { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-800', label: 'Successful' };
      case 'pending':
        return { icon: Clock, bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' };
      case 'failed':
        return { icon: XCircle, bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' };
      default:
        return { icon: DollarSign, bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      'card': '💳 Card', 'cash': '💵 Cash', 'bank': '🏦 Bank',
      'check': '📝 Check', 'physical': '💳 Physical', 'stripe': '💳 Stripe', 'other': '📋 Other'
    };
    return methods[method] || method || 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader className="mx-auto mb-4 text-orange-600 animate-spin" size={32} />
          <p className="text-gray-600">Loading payment records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Data</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
          <p className="text-xs font-semibold text-orange-600 uppercase">Total Transactions</p>
          <p className="mt-1 text-2xl font-bold text-orange-900">{financialSummary.totalTransactions}</p>
          <p className="mt-2 text-xs text-orange-600">All records</p>
        </div>

        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
          <p className="text-xs font-semibold text-green-600 uppercase">Total Paid</p>
          <p className="mt-1 text-2xl font-bold text-green-900">${financialSummary.totalAmount.toFixed(2)}</p>
          <p className="mt-2 text-xs text-green-600">{financialSummary.totalSuccessful} successful</p>
        </div>

        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <p className="text-xs font-semibold text-yellow-600 uppercase">Pending</p>
          <p className="mt-1 text-2xl font-bold text-yellow-900">$0.00</p>
          <p className="mt-2 text-xs text-yellow-600">{financialSummary.totalPending} transactions</p>
        </div>

        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-xs font-semibold text-red-600 uppercase">Failed</p>
          <p className="mt-1 text-2xl font-bold text-red-900">$0</p>
          <p className="mt-2 text-xs text-red-600">{financialSummary.totalFailed} transactions</p>
        </div>

        <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
          <p className="text-xs font-semibold text-purple-600 uppercase">Average Transaction</p>
          <p className="mt-1 text-2xl font-bold text-purple-900">${financialSummary.averageTransaction.toFixed(2)}</p>
          <p className="mt-2 text-xs text-purple-600">Per successful payment</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute text-gray-400 left-3 top-3" size={18} />
            <input
              type="text"
              placeholder="Search by student, email, reference..."
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="successful">✅ Successful</option>
            <option value="pending">⏳ Pending</option>
            <option value="failed">❌ Failed</option>
          </select>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Methods</option>
            <option value="card">💳 Card</option>
            <option value="cash">💵 Cash</option>
            <option value="bank">🏦 Bank</option>
            <option value="check">📝 Check</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Amount (High→Low)</option>
            <option value="amount-asc">Amount (Low→High)</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredRecords.length} of {paymentRecords.length} transactions
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center border border-gray-200 rounded-lg bg-gray-50">
          <DollarSign className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-gray-600">
            {searchTerm ? 'No transactions match your search' : 'No payment transactions available'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-700">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-700">Student</th>
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-700">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-700">Method</th>
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-700">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-700">Reference</th>
                <th className="px-6 py-3 text-xs font-semibold text-center text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => {
                const statusStyle = getStatusBadge(record.status);
                const StatusIcon = statusStyle.icon;

                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        {formatDate(record.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{record.student_name || 'Unknown Student'}</p>
                        <p className="text-xs text-gray-500">{record.student_email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${parseFloat(record.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getPaymentMethodLabel(record.payment_method_used)}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon size={14} />
                        {statusStyle.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.reference_number ? (
                        <code className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {record.reference_number.substring(0, 15)}...
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs text-white bg-orange-600 rounded hover:bg-orange-700"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
          <div className="w-full max-w-2xl my-8 bg-white rounded-lg shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="mb-4 text-lg font-semibold text-gray-900">Student Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Student Name</p>
                    <p className="mt-1 font-medium text-gray-900">{selectedRecord.student_name || 'Unknown Student'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Email</p>
                    <p className="mt-1 text-gray-900">{selectedRecord.student_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Phone</p>
                    <p className="mt-1 text-gray-900">{selectedRecord.student_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-lg font-semibold text-gray-900">Transaction Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Amount</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">${parseFloat(selectedRecord.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Status</p>
                    <div className="mt-1">
                      {(() => {
                        const statusStyle = getStatusBadge(selectedRecord.status);
                        const StatusIcon = statusStyle.icon;
                        return (
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                            <StatusIcon size={14} />
                            {statusStyle.label}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Method</p>
                    <p className="mt-1 text-gray-900">{getPaymentMethodLabel(selectedRecord.payment_method_used)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Reference</p>
                    <p className="mt-1 font-mono text-sm text-gray-900">{selectedRecord.reference_number || 'N/A'}</p>
                  </div>
                  
                  {selectedRecord.notes && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase">Notes</p>
                      <p className="p-2 mt-1 text-sm text-gray-700 rounded bg-gray-50">{selectedRecord.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer with Download Button */}
            <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
              {/* ✅ NEW: Download Receipt Button */}
              <button
                onClick={() => handleDownloadReceipt(selectedRecord.id)}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                {downloading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {downloading ? 'Downloading...' : 'Download Receipt'}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;