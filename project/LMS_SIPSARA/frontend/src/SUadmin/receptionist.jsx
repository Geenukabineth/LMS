import React, { useState, useEffect } from 'react';
import { User, DollarSign, Search, Plus, Edit3, Check, X, Calendar, Phone, Mail } from 'lucide-react';

const receptionist = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  // Sample initial data
  useEffect(() => {
    setStudents([
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1-234-567-8901',
        course: 'Computer Science',
        enrollmentDate: '2024-01-15',
        status: 'Active',
        totalFees: 5000,
        paidAmount: 3000,
        balance: 2000
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+1-234-567-8902',
        course: 'Data Science',
        enrollmentDate: '2024-02-01',
        status: 'Active',
        totalFees: 4500,
        paidAmount: 4500,
        balance: 0
      }
    ]);

    setPayments([
      { id: 1, studentId: 1, amount: 1500, date: '2024-01-20', method: 'Card', status: 'Completed' },
      { id: 2, studentId: 1, amount: 1500, date: '2024-02-20', method: 'Bank Transfer', status: 'Completed' },
      { id: 3, studentId: 2, amount: 4500, date: '2024-02-05', method: 'Cash', status: 'Completed' }
    ]);
  }, []);

  const [studentForm, setStudentForm] = useState({
    name: '',
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

  const handleAddStudent = () => {
    if (!studentForm.name || !studentForm.email || !studentForm.course) return;

    const newStudent = {
      id: students.length + 1,
      ...studentForm,
      totalFees: parseFloat(studentForm.totalFees) || 0,
      paidAmount: parseFloat(studentForm.paidAmount) || 0,
      balance: (parseFloat(studentForm.totalFees) || 0) - (parseFloat(studentForm.paidAmount) || 0)
    };

    setStudents([...students, newStudent]);
    setStudentForm({
      name: '',
      email: '',
      phone: '',
      course: '',
      enrollmentDate: '',
      totalFees: '',
      paidAmount: '',
      status: 'Active'
    });
    setShowAddStudent(false);
  };

  const handleUpdateStudent = () => {
    if (!editingStudent) return;

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
  };

  const handleAddPayment = () => {
    if (!selectedStudent || !paymentForm.amount) return;

    const amount = parseFloat(paymentForm.amount);
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
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Receptionist Panel</h1>
                <p className="text-gray-600">Student Management & Payment Processing</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
            >
              <User className="inline h-4 w-4 mr-2" />
              Student Management
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
            >
              <DollarSign className="inline h-4 w-4 mr-2" />
              Payment History
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Add Student Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Students</h2>
              <button
                onClick={() => setShowAddStudent(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </button>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Financial Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {student.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {student.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.course}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Enrolled: {student.enrollmentDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>Total: ${student.totalFees}</div>
                        <div>Paid: ${student.paidAmount}</div>
                        <div className={getBalanceColor(student.balance)}>
                          Balance: ${student.balance}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => setEditingStudent({...student})}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowPaymentModal(true);
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Add Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => {
                    const student = students.find(s => s.id === payment.studentId);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student?.name || 'Unknown Student'}
                          </div>
                          <div className="text-sm text-gray-500">{student?.course}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${payment.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Student</h3>
              <button
                onClick={() => setShowAddStudent(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={studentForm.name}
                onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
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
                placeholder="Course"
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
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddStudent}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Add Student
              </button>
              <button
                onClick={() => setShowAddStudent(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Student</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
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
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateStudent}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Update Student
              </button>
              <button
                onClick={() => setEditingStudent(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">{selectedStudent.name}</div>
              <div className="text-sm text-gray-600">{selectedStudent.course}</div>
              <div className="text-sm text-red-600 font-semibold">
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
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddPayment}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
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

export default receptionist;