import React, { useEffect, useMemo, useState } from "react";
import { X, Loader, AlertCircle, CheckCircle } from "lucide-react";
import authService from "@/context/authService";

/**
 * Addpayment.jsx (UPDATED)
 *
 * Supports 2 modes:
 * 1) Payment Page: choose student from dropdown (allowStudentSelect=true) + NO course required
 * 2) Enrollment Page: pre-selected student + optional courseId to link payment to a course
 */
const Addpayment = ({
  // If a student is already selected by parent, pass it here:
  selectedStudent = null,

  // If you want dropdown selection inside modal:
  allowStudentSelect = false,
  students = [],
  onStudentChange = null, // optional callback(studentObj)

  // Optional: link payment to a course (ONLY for enrollment flow)
  courseId = null,

  // Modal control:
  setShowPaymentModal,

  // Callbacks:
  onSuccess, // e.g. refresh payment list
}) => {
  const token = authService.getToken();

  const [localStudentId, setLocalStudentId] = useState(selectedStudent?.id || "");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "Cash",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // keep dropdown in sync if parent selectedStudent changes
  useEffect(() => {
    if (selectedStudent?.id) setLocalStudentId(selectedStudent.id);
  }, [selectedStudent]);

  const selectedStudentObj = useMemo(() => {
    if (selectedStudent?.id) return selectedStudent;
    if (!allowStudentSelect) return null;
    return students.find((s) => String(s.id) === String(localStudentId)) || null;
  }, [selectedStudent, allowStudentSelect, students, localStudentId]);

  const getStudentName = (stu) => {
    if (!stu) return "Unknown";
    if (stu.firstName && stu.lastName) return `${stu.firstName} ${stu.lastName}`;
    return stu.name || stu.username || "Unknown";
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setShowPaymentModal(false);
  };

  const validate = () => {
    if (!selectedStudentObj?.id) {
      setError("Please select a student");
      return false;
    }

    const amountNum = parseFloat(paymentForm.amount);
    if (!paymentForm.amount || isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    if (!paymentForm.date) {
      setError("Please select a payment date");
      return false;
    }

    return true;
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsProcessing(true);
      setError(null);

      const amountNum = parseFloat(paymentForm.amount);

      const payload = {
        student_id: selectedStudentObj.id, // ✅ correct field
        amount: amountNum,
        payment_method: paymentForm.method,
        payment_date: paymentForm.date,
        notes: paymentForm.notes,
      };

      // ✅ Only include course_id if you WANT to link payment to a course (enrollment flow)
      if (courseId) payload.course_id = courseId;

      const response = await fetch("http://localhost:8000/payment/record-payment/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.detail || "Failed to record payment");
      }

      setSuccess(true);

      if (typeof onSuccess === "function") {
        await onSuccess(data);
      }

      setTimeout(() => handleClose(), 1200);
    } catch (err) {
      setError(err.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
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

        {/* Success */}
        {success && (
          <div className="p-3 mb-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">Payment recorded successfully</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Student dropdown (ONLY if allowStudentSelect=true) */}
        {allowStudentSelect && (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">Student</label>
            <select
              value={localStudentId}
              onChange={(e) => {
                const sid = e.target.value;
                setLocalStudentId(sid);
                const stu = students.find((s) => String(s.id) === String(sid)) || null;
                if (typeof onStudentChange === "function") onStudentChange(stu);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Select a student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {getStudentName(s)} ({s.email || "no email"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Student summary */}
        {selectedStudentObj && (
          <div className="p-3 mb-4 border border-blue-100 rounded-lg bg-blue-50">
            <p className="font-semibold text-gray-900">{getStudentName(selectedStudentObj)}</p>
            <p className="text-sm text-gray-600">{selectedStudentObj.email || "N/A"}</p>
            <p className="text-xs text-gray-500">Student ID: {selectedStudentObj.id}</p>
          </div>
        )}

        <form onSubmit={submitPayment} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Payment Amount</label>
            <input
              type="number"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g. 5000"
              disabled={isProcessing}
            />
          </div>

          {/* Method */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Payment Method</label>
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={isProcessing}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Payment Date</label>
            <input
              type="date"
              value={paymentForm.date}
              onChange={(e) => setPaymentForm((p) => ({ ...p, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={isProcessing}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              disabled={isProcessing}
              placeholder="Reference / note..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center justify-center flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Payment"
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-60"
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
