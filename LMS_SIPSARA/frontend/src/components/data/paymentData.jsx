import React, { useEffect, useState } from 'react';
import {
  CreditCard, DollarSign, TrendingUp, AlertCircle, Filter, Download,
  Search, Eye, RefreshCw, CheckCircle, XCircle, Clock, MoreVertical
} from 'lucide-react';
import authService from '@/context/authService'; // Adjust path if needed

const AdminPaymentPanel = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [payments, setPayments] = useState([]);

  // --- LOGIC START ---

  const fetchPayments = async () => {
    try {
      const token = authService.getToken();
      
      // NEW URL: Matches the Django url added below
      const response = await fetch('http://127.0.0.1:8000/payment/admin/summary/', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Normalize data to match your UI variable names exactly
      const normalizedData = data.map(item => ({
        id: item.id,
        description: item.description, // "Order #OID..."
        user: item.user,
        email: item.email,
        amount: parseFloat(item.amount),
        // Map Django 'successful' to React 'completed' for your icons to work
        status: item.status === 'successful' ? 'completed' : item.status, 
        method: item.method,
        date: item.date,
        time: item.time,
      }));

      setPayments(normalizedData);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  // ADDED: Trigger fetch on component load
  useEffect(() => {
    fetchPayments();
  }, []);

  // --- LOGIC END ---

  const stats = {
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    totalTransactions: payments.length,
    successRate: 94.2, // Static for now, or calculate: (completed / total) * 100
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'failed': return <XCircle size={16} />;
      case 'refunded': return <RefreshCw size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = selectedFilter === 'all' || payment.status === selectedFilter;
    const matchesSearch = (payment.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl min-h-screen p-6 mx-auto bg-gray-50">
      <div className="overflow-hidden bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 text-white bg-gradient-to-r from-blue-600 to-purple-600">
          <h1 className="mb-2 text-3xl font-bold">Payment Management</h1>
          <p className="text-blue-100">Monitor and manage all payment transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white border border-gray-200 shadow-lg rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500">Total Revenue</h3>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                <p className="mt-1 text-sm font-medium text-green-600">+12.5% from last month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 shadow-lg rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500">Total Transactions</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions.toLocaleString()}</p>
                <p className="mt-1 text-sm font-medium text-blue-600">+8.2% from last week</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 shadow-lg rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500">Success Rate</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                <p className="mt-1 text-sm font-medium text-green-600">+2.1% improvement</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 shadow-lg rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500">Pending Amount</h3>
                <p className="text-2xl font-bold text-gray-900">${stats.pendingAmount.toLocaleString()}</p>
                <p className="mt-1 text-sm font-medium text-orange-600">Awaiting processing</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 shadow-lg rounded-xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex flex-col flex-1 gap-4 sm:flex-row">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    placeholder="Search payments, users, or IDs..."
                    className="w-full py-2 pl-10 pr-4 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select
                  className="px-4 py-2 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>

                <select
                  className="px-4 py-2 transition-colors border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                >
                  <option value="1d">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 font-medium text-gray-600 transition-colors duration-200 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <Filter size={16} />
                  More Filters
                </button>
                <button className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors duration-200 bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Payment ID
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Method
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="transition-colors duration-150 hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.id}</p>
                        <p className="text-sm text-gray-500">{payment.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.user}</p>
                        <p className="text-sm text-gray-500">{payment.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-lg font-semibold text-gray-900">${payment.amount.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{payment.method}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.date}</p>
                        <p className="text-sm text-gray-500">{payment.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-2 text-gray-400 transition-colors duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 transition-colors duration-200 rounded-lg hover:text-gray-600 hover:bg-gray-50"
                          title="More"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 sm:flex-row">
            <p className="text-sm text-gray-600">
              Showing {filteredPayments.length} of {payments.length} payments
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-500 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg">
                1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentPanel;