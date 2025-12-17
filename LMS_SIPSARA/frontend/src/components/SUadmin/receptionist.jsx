import React, { useState, useEffect } from 'react';
import { User, DollarSign, Search, Plus, Edit3, Check, X, Calendar, Phone, Mail } from 'lucide-react';

const Receptionist = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [apiError, setApiError] = useState('');

  // API Base URL - configure based on environment
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await fetch(`${API_BASE_URL}/lms/student/`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      
      // Map API response to component state
      const formattedStudents = Array.isArray(data) ? data.map(student => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        phone: student.phone,
        course: student.Grade || student.academicYear,
        enrollmentDate: student.enrollmentDate,
        status: student.status || 'Active',
        totalFees: 5000, // From backend if available
        paidAmount: 3000, // From backend if available
        balance: 2000,
        ...student
      })) : [];
      
      setStudents(formattedStudents);
      setApiError('');
    } catch (error) {
      console.error("Error fetching students:", error);
      setApiError('Failed to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    course: '',
    enrollmentDate: '',
    totalFees: '',
    paidAmount: '',
    status: 'Active'
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Card',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleAddStudent = async () => {
    if (!studentForm.firstName || !studentForm.email || !studentForm.course) {
      setApiError('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        phone: studentForm.phone,
        academicYear: studentForm.course,
        Grade: studentForm.course,
        enrollmentDate: studentForm.enrollmentDate,
        registrationFees: false,
        courses: []
      };

      const response = await fetch(`${API_BASE_URL}/lms/student/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to add student');
      }

      const newStudent = await response.json();
      
      // Add to local state
      const formattedStudent = {
        id: newStudent.id,
        name: `${newStudent.firstName} ${newStudent.lastName}`,
        email: newStudent.email,
        phone: newStudent.phone,
        course: newStudent.Grade || newStudent.academicYear,
        enrollmentDate: newStudent.enrollmentDate,
        status: 'Active',
        totalFees: parseFloat(studentForm.totalFees) || 0,
        paidAmount: parseFloat(studentForm.paidAmount) || 0,
        balance: (parseFloat(studentForm.totalFees) || 0) - (parseFloat(studentForm.paidAmount) || 0),
        ...newStudent
      };

      setStudents([...students, formattedStudent]);
      setStudentForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        course: '',
        enrollmentDate: '',
        totalFees: '',
        paidAmount: '',
        status: 'Active'
      });
      setShowAddStudent(false);
      setApiError('');
    } catch (error) {
      setApiError(error.message || 'Failed to add student');
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    try {
      const payload = {
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        email: editingStudent.email,
        phone: editingStudent.phone,
        academicYear: editingStudent.course,
        Grade: editingStudent.course,
        status: editingStudent.status
      };

      const response = await fetch(`${API_BASE_URL}/lms/student/${editingStudent.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      const updatedStudents = students.map(student => 
        student.id === editingStudent.id 
          ? {
              ...editingStudent,
              balance: editingStudent.totalFees - editingStudent.paidAmount
            }
          : student
      );
      setStudents(updatedStudents);
      setEditingStudent(null);
      setApiError('');
    } catch (error) {
      setApiError(error.message || 'Failed to update student');
    }
  };

  const handleAddPayment = async () => {
    if (!selectedStudent || !paymentForm.amount) {
      setApiError('Please select student and enter amount');
      return;
    }

    try {
      const amount = parseFloat(paymentForm.amount);
      
      // In a real app, this would call a payment API endpoint
      // For now, we'll update locally
      const newPayment = {
        id: payments.length + 1,
        studentId: selectedStudent.id,
        amount: amount,
        date: paymentForm.date,
        method: paymentForm.method,
        status: 'Completed',
        notes: paymentForm.notes
      };

      setPayments([...payments, newPayment]);

      // Update student's payment info
      const updatedStudents = students.map(student => 
        student.id === selectedStudent.id 
          ? {
              ...student,
              paidAmount: student.paidAmount + amount,
              balance: student.balance - amount
            }
          : student
      );
      setStudents(updatedStudents);

      setPaymentForm({
        amount: '',
        method: 'Card',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setShowPaymentModal(false);
      setSelectedStudent(null);
      setApiError('');
    } catch (error) {
      setApiError(error.message || 'Failed to process payment');
    }
  };

  const filteredStudents = students.filter(student =>
    (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.course && student.course.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBalanceColor = (balance) => {
    return balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Receptionist Panel</h1>
                <p className="text-gray-600">Student Management & Payment Processing</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="px-4 pt-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-600">{apiError}</p>
            <button 
              onClick={() => setApiError('')}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="px-4 pt-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Records
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {activeTab === 'students' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Student List</h2>
              <button
                onClick={() => setShowAddStudent(true)}
                className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>

            {loadingStudents ? (
              <div className="py-8 text-center">
                <p className="text-gray-600">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-8 text-center bg-white rounded-lg">
                <p className="text-gray-600">No students found</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Course</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Balance</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{student.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{student.course}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getBalanceColor(student.balance)}`}>
                          ${student.balance}
                        </td>
                        <td className="px-6 py-4 space-x-2 text-sm whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowPaymentModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Payment Records</h2>
            {payments.length === 0 ? (
              <div className="py-8 text-center bg-white rounded-lg">
                <p className="text-gray-600">No payments recorded yet</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{payment.date}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">${payment.amount}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{payment.method}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Student</h3>
              <button
                onClick={() => setShowAddStudent(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="First Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={studentForm.firstName}
                onChange={(e) => setStudentForm({...studentForm, firstName: e.target.value})}
              />
              <input
                type="text"
                placeholder="Last Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={studentForm.lastName}
                onChange={(e) => setStudentForm({...studentForm, lastName: e.target.value})}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={studentForm.email}
                onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={studentForm.phone}
                onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
              />
              <input
                type="text"
                placeholder="Course/Grade"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={studentForm.course}
                onChange={(e) => setStudentForm({...studentForm, course: e.target.value})}
              />
              <input
                type="date"
                placeholder="Enrollment Date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={studentForm.enrollmentDate}
                onChange={(e) => setStudentForm({...studentForm, enrollmentDate: e.target.value})}
              />
              <input
                type="number"
                placeholder="Total Fees"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={studentForm.totalFees}
                onChange={(e) => setStudentForm({...studentForm, totalFees: e.target.value})}
              />
              <input
                type="number"
                placeholder="Initial Payment (Optional)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={studentForm.paidAmount}
                onChange={(e) => setStudentForm({...studentForm, paidAmount: e.target.value})}
              />
            </div>
            
            <div className="flex mt-6 space-x-3">
              <button
                onClick={handleAddStudent}
                className="flex items-center justify-center flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Add Student
              </button>
              <button
                onClick={() => setShowAddStudent(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Student</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.email}
                onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.phone}
                onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
              />
              <input
                type="text"
                placeholder="Course"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.course}
                onChange={(e) => setEditingStudent({...editingStudent, course: e.target.value})}
              />
              <input
                type="number"
                placeholder="Total Fees"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.totalFees}
                onChange={(e) => setEditingStudent({...editingStudent, totalFees: parseFloat(e.target.value) || 0})}
              />
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.status}
                onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value})}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div className="flex mt-6 space-x-3">
              <button
                onClick={handleUpdateStudent}
                className="flex items-center justify-center flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Update Student
              </button>
              <button
                onClick={() => setEditingStudent(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-3 mb-4 rounded-lg bg-gray-50">
              <div className="text-sm font-medium">{selectedStudent.name}</div>
              <div className="text-sm text-gray-600">{selectedStudent.course}</div>
              <div className="text-sm font-semibold text-red-600">
                Outstanding Balance: ${selectedStudent.balance}
              </div>
            </div>
            
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Payment Amount"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
              />
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
              >
                <option value="Card">Credit/Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
              </select>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
              />
              <textarea
                placeholder="Notes (Optional)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
              />
            </div>
            
            <div className="flex mt-6 space-x-3">
              <button
                onClick={handleAddPayment}
                className="flex items-center justify-center flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Process Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receptionist;