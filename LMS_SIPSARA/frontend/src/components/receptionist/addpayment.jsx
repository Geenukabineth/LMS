import React, { useMemo, useState } from "react";
import { X, DollarSign, Loader, AlertCircle, CheckCircle } from "lucide-react";
// ✅ REMOVED: authService import
import { paymentService } from "@/config/payment.config"; // ✅ ADDED: paymentService

const Addpayment = ({
  selectedStudent,
  paymentForm,
  setPaymentForm,
  setShowPaymentModal,
  onSuccess,
  courseContext = null,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ✅ FIXED: Robustly find the User ID (fixes "Student user_id missing" error)
  const studentUserId = useMemo(() => {
    if (!selectedStudent) return null;
    // 1. Check direct 'user_id' (common in flat objects)
    if (selectedStudent.user_id) return selectedStudent.user_id;
    // 2. Check nested 'user' object (e.g. { user: { id: 1 } })
    if (selectedStudent.user && typeof selectedStudent.user === 'object' && selectedStudent.user.id) {
      return selectedStudent.user.id;
    }
    // 3. Check 'user' as direct ID (e.g. { user: 1 })
    if (selectedStudent.user && (typeof selectedStudent.user === 'number' || typeof selectedStudent.user === 'string')) {
      return selectedStudent.user;
    }
    return null;
  }, [selectedStudent]);

  const courseId = useMemo(() => {
    return courseContext?.course_id ?? null;
  }, [courseContext]);

  const studentName = useMemo(() => {
    if (!selectedStudent) return "Unknown";
    // Check nested user object for names if not found on root
    const firstName = selectedStudent.firstName || selectedStudent.user?.firstName || "";
    const lastName = selectedStudent.lastName || selectedStudent.user?.lastName || "";
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return selectedStudent.name || selectedStudent.username || selectedStudent.user?.username || "Unknown";
  }, [selectedStudent]);

  const courseLabel = useMemo(() => {
    if (!courseContext) return "";
    return `${courseContext.title || "Course"} (ID: ${courseId ?? "N/A"})`;
  }, [courseContext, courseId]);

  const validate = () => {
    if (!selectedStudent) return setError("No student selected"), false;
    
    // Debug log to help you if it fails again
    if (!studentUserId) {
      console.error("❌ AddPayment Error: User ID not found in object:", selectedStudent);
      return setError("Student user_id missing (Check console for object structure)"), false;
    }
    
    if (courseContext && !courseId) return setError("course_id missing (Course context provided but invalid)"), false;
    if (!paymentForm.date) return setError("Please select a payment date"), false;

    const amount = Number(paymentForm.amount ?? 0);
    if (paymentForm.method !== "Free") {
      if (!paymentForm.amount || Number.isNaN(amount) || amount <= 0) {
        return setError("Please enter a valid payment amount"), false;
      }
    } else {
      if (Number.isNaN(amount) || amount < 0) return setError("Invalid amount"), false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsProcessing(true);
      setError(null);

      const payload = {
        student_id: Number(studentUserId),
        amount: Number(paymentForm.amount ?? 0),
        payment_method: paymentForm.method,
        payment_date: paymentForm.date,
        notes: paymentForm.notes || "",
      };

      if (courseId) {
        payload.course_id = Number(courseId);
      }

      console.log("📤 record-payment payload:", payload);

      // ✅ CHANGED: Use paymentService instead of raw fetch
      // The service/api instance handles the token automatically
      const data = await paymentService.recordManualPayment(payload);

      setSuccess(true);
      if (onSuccess) onSuccess(data);

      setTimeout(() => {
        setShowPaymentModal(false);
        setSuccess(false);
      }, 800);
    } catch (err) {
      console.error("❌ Payment error:", err);
      // Handle axios errors (err.response.data) or standard errors
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Payment failed";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const close = () => {
    setError(null);
    setSuccess(false);
    setShowPaymentModal(false);
  };

  if (!selectedStudent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Payment</h3>
          <button onClick={close} disabled={isProcessing} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success && (
          <div className="p-4 mb-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
              <div>
                <div className="font-semibold text-green-900">Payment Successful!</div>
                <div className="text-sm text-green-800">Payment has been recorded.</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <div>
                <div className="font-semibold text-red-900">Error</div>
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="text-sm font-medium text-gray-900">{studentName}</div>
          <div className="text-xs text-gray-500">Student Profile ID: {selectedStudent.id}</div>
          <div className="text-xs text-gray-500">
             User ID (Payment Ref): <span className="font-mono">{studentUserId ?? "MISSING"}</span>
          </div>
          {courseContext && <div className="pt-1 text-xs font-medium text-gray-700">For: {courseLabel}</div>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Payment Amount</label>
            <div className="relative">
              <span className="absolute text-gray-600 left-3 top-3">
                <DollarSign size={16} />
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                disabled={isProcessing || paymentForm.method === "Free"}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Payment Method</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={paymentForm.method}
              onChange={(e) =>
                setPaymentForm((p) => ({
                  ...p,
                  method: e.target.value,
                  amount: e.target.value === "Free" ? "0" : p.amount,
                }))
              }
              disabled={isProcessing}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Card">Card</option>
              <option value="Free">Free</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Payment Date</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={paymentForm.date}
              onChange={(e) => setPaymentForm((p) => ({ ...p, date: e.target.value }))}
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
              disabled={isProcessing}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isProcessing || success}
              className="flex items-center justify-center flex-1 gap-2 px-4 py-3 text-white bg-green-600 rounded-lg"
            >
              {isProcessing ? (
                <>
                  <Loader className="animate-spin" size={18} /> Processing...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={18} /> Completed
                </>
              ) : (
                <>
                  <DollarSign size={18} /> Process Payment
                </>
              )}
            </button>

            <button
              type="button"
              onClick={close}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg"
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