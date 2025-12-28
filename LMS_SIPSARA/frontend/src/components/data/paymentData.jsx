import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Filter,
  Download,
  Search,
  Eye,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  FileText
} from "lucide-react";
import { paymentService } from "@/config/payment.config";

const AdminPaymentPanel = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // Normalize API data to match UI needs
  const normalizePayments = (data) => {
    const rows = Array.isArray(data) ? data : data?.results || [];
    return rows.map((item) => ({
      id: item.id,
      orderId: item.description || `Order #${item.id.slice(0, 8)}`, // Fallback if description is empty
      user: item.user,
      email: item.email,
      amount: Number(item.amount || 0),
      status: item.status === "successful" ? "completed" : item.status,
      method: item.method,
      date: item.date,
      time: item.time,
    }));
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await paymentService.getAdminPaymentRecords();
      setPayments(normalizePayments(data));
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load payment records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter Logic
  const filteredPayments = useMemo(() => {
    const now = new Date();
    const days = selectedTimeRange === "7d" ? 7 : selectedTimeRange === "30d" ? 30 : 90;
    const start = new Date(now);
    start.setDate(now.getDate() - days);

    return payments.filter((payment) => {
      const matchesFilter = selectedFilter === "all" || payment.status === selectedFilter;
      
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (payment.user || "").toLowerCase().includes(term) ||
        (payment.id || "").toLowerCase().includes(term) ||
        (payment.email || "").toLowerCase().includes(term);

      const paymentDate = payment.date ? new Date(`${payment.date}T00:00:00`) : null;
      const matchesRange = paymentDate ? paymentDate >= start : true;

      return matchesFilter && matchesSearch && matchesRange;
    });
  }, [payments, selectedFilter, searchTerm, selectedTimeRange]);

  // Stats Logic
  const stats = useMemo(() => {
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalTransactions = filteredPayments.length;
    const completedCount = filteredPayments.filter((p) => p.status === "completed").length;
    const pendingAmount = filteredPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const successRate = totalTransactions > 0 ? (completedCount / totalTransactions) * 100 : 0;
    const adminRevenue = totalRevenue * 0.3; // 30% revenue share

    return { totalRevenue, adminRevenue, totalTransactions, successRate, pendingAmount };
  }, [filteredPayments]);

  const handleDownloadPdf = async () => {
    try {
      setExporting(true);
      const params = {
        status: selectedFilter !== "all" ? selectedFilter : undefined,
        q: searchTerm?.trim() ? searchTerm.trim() : undefined,
        range: selectedTimeRange,
      };
      const blob = await paymentService.downloadAdminPaymentsPdf(params);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("PDF export error:", err);
      setError("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  // UI Helpers
  const getStatusStyles = (status) => {
    switch (status) {
      case "completed":
        return { 
          bg: "bg-emerald-100", 
          text: "text-emerald-700", 
          icon: <CheckCircle2 size={14} className="mr-1.5" />,
          label: "Completed"
        };
      case "pending":
        return { 
          bg: "bg-amber-100", 
          text: "text-amber-700", 
          icon: <Clock size={14} className="mr-1.5" />,
          label: "Pending"
        };
      case "failed":
        return { 
          bg: "bg-red-100", 
          text: "text-red-700", 
          icon: <XCircle size={14} className="mr-1.5" />,
          label: "Failed"
        };
      case "refunded":
        return { 
          bg: "bg-slate-100", 
          text: "text-slate-700", 
          icon: <RefreshCw size={14} className="mr-1.5" />,
          label: "Refunded"
        };
      default:
        return { 
          bg: "bg-gray-100", 
          text: "text-gray-700", 
          icon: <AlertCircle size={14} className="mr-1.5" />,
          label: status 
        };
    }
  };

  return (
    <div className="min-h-screen p-6 font-sans bg-gray-50">
      <div className="mx-auto max-w-7xl">
        
        {/* Header Section */}
        <div className="mb-8 overflow-hidden shadow-lg rounded-xl bg-gradient-to-r">
          <div className="px-8 py-8">
            <h1 className="mb-2 text-3xl font-bold text-black">Payment Management</h1>
            
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard 
            title="Total Revenue" 
            value={`Rs.${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={<DollarSign size={24} className="text-emerald-600" />} 
            bg="bg-emerald-50"
            trend={true}
          />
          <StatsCard 
            title="Admin Revenue (30%)" 
            value={`$${stats.adminRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={<TrendingUp size={24} className="text-purple-600" />} 
            bg="bg-purple-50"
          />
          <StatsCard 
            title="Total Transactions" 
            value={stats.totalTransactions} 
            icon={<CreditCard size={24} className="text-blue-600" />} 
            bg="bg-blue-50"
          />
          <StatsCard 
            title="Success Rate" 
            value={`${stats.successRate.toFixed(1)}%`} 
            icon={<TrendingUp size={24} className="text-indigo-600" />} 
            bg="bg-indigo-50"
          />
          <StatsCard 
            title="Pending Amount" 
            value={`$${stats.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={<AlertCircle size={24} className="text-amber-600" />} 
            bg="bg-amber-50"
          />
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col flex-1 gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2 group-focus-within:text-blue-500" size={18} />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={16} />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Time Filter */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {exporting ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
            Export PDF
          </button>
        </div>

        {/* Table Section */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">Payment ID</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading records...</td></tr>
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No payments found matching your criteria.</td></tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const statusStyle = getStatusStyles(payment.status);
                    return (
                      <tr key={payment.id} className="transition-colors hover:bg-gray-50/80 group">
                        <td className="px-6 py-4 align-top">
                          <div className="text-sm font-medium text-gray-900">{payment.id.slice(0, 12)}...</div>
                          <div className="text-xs text-gray-400 mt-0.5">{payment.orderId}</div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="text-sm font-medium text-gray-900">{payment.user}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{payment.email}</div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="text-sm font-bold text-gray-900">${payment.amount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.icon}
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="text-sm text-gray-600 capitalize">{payment.method}</div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="text-sm text-gray-900">{payment.date}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{payment.time}</div>
                        </td>
                        <td className="px-6 py-4 text-right align-top">
                          <div className="flex justify-end gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                              <Eye size={18} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

// Sub-component for Stats Cards to keep main clean
const StatsCard = ({ title, value, icon, bg, trend }) => (
  <div className="p-5 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="mb-1 text-xs font-medium tracking-wide text-gray-500 uppercase">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-2.5 rounded-lg ${bg}`}>
        {icon}
      </div>
    </div>
    {/* Optional: Add trend indicator if needed */}
    {/* <div className="flex items-center mt-2 text-xs font-medium text-green-600">
      <TrendingUp size={12} className="mr-1" /> +2.5% vs last week
    </div> */}
  </div>
);

export default AdminPaymentPanel;