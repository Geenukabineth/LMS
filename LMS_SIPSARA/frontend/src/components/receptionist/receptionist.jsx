import React, { useState, useEffect } from 'react';
import { 
  User, DollarSign, Search, Plus, Edit3, Check, X, Calendar, Phone, Mail, 
  Settings, BookOpen, AlertCircle, Loader, TrendingDown, ChevronRight, BookMarked
} from 'lucide-react';
import Useradd from '@/components/receptionist/useradd';
import Addpayment from '@/components/receptionist/addpayment';
import CourseAccess from '@/components/receptionist/course_access';
import EnrollmentAccess from '@/components/receptionist/enrollment_access';
import Topbar from '@/components/topbar';
import SettingsComponent from '@/components/setting';
import PaymentPage from '@/components/receptionist/Receptionistpayment';
import authService from '@/context/authService';

const ReceptionistPanel = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCourseAccessModal, setShowCourseAccessModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  
  // ✅ Enrollment state
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [selectedEnrollmentStudent, setSelectedEnrollmentStudent] = useState(null);
  
  // ✅ Student enrollments map (for displaying in Course column)
  const [studentEnrollmentsMap, setStudentEnrollmentsMap] = useState({});
  const [loadingEnrollmentsMap, setLoadingEnrollmentsMap] = useState({});

  // ✅ NEW: Student payments map and loading states
  const [studentPaymentsMap, setStudentPaymentsMap] = useState({});
  const [loadingPaymentsMap, setLoadingPaymentsMap] = useState({});

  // ✅ NEW: Student financial data (Total, Paid, Balance)
  const [studentFinancialMap, setStudentFinancialMap] = useState({});

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Card',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const token = authService.getToken();

  // ✅ NEW: Calculate total course fees from enrollments
  const calculateCourseFees = (enrollments) => {
    if (!enrollments || enrollments.length === 0) return 0;
    return enrollments.reduce((total, enrollment) => {
      const price = parseFloat(enrollment.course_price) || 0;
      return total + price;
    }, 0);
  };

  // ✅ NEW: Fetch payments for a student
  const fetchStudentPayments = async (studentId) => {
    try {
      setLoadingPaymentsMap(prev => ({ ...prev, [studentId]: true }));
      
      const response = await fetch(
        `http://localhost:8000/payment/transactions/?student_id=${studentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const paymentList = Array.isArray(data) ? data : data.results || [];
        setStudentPaymentsMap(prev => ({
          ...prev,
          [studentId]: paymentList
        }));

        // Calculate totals
        const totalPaid = paymentList
          .filter(p => p.status === 'successful')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        setStudentFinancialMap(prev => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            paidAmount: totalPaid
          }
        }));
      }
    } catch (error) {
      console.error(`Error fetching payments for student ${studentId}:`, error);
    } finally {
      setLoadingPaymentsMap(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // ✅ Fetch enrollments for all students
  const fetchAllStudentEnrollments = async (studentList) => {
    const token = authService.getToken();
    
    for (const student of studentList) {
      try {
        setLoadingEnrollmentsMap(prev => ({ ...prev, [student.id]: true }));
        
        const response = await fetch(
          `http://localhost:8000/Course/enrollments/?student_id=${student.id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const enrollmentList = Array.isArray(data) ? data : data.results || [];
          setStudentEnrollmentsMap(prev => ({
            ...prev,
            [student.id]: enrollmentList
          }));

          // ✅ NEW: Calculate total fees from enrollments
          const totalFees = calculateCourseFees(enrollmentList);
          setStudentFinancialMap(prev => ({
            ...prev,
            [student.id]: {
              ...prev[student.id],
              totalFees: totalFees
            }
          }));

          // ✅ Fetch payments for this student
          fetchStudentPayments(student.id);
        }
      } catch (error) {
        console.error(`Error fetching enrollments for student ${student.id}:`, error);
      } finally {
        setLoadingEnrollmentsMap(prev => ({ ...prev, [student.id]: false }));
      }
    }
  };

  // ✅ Fetch enrollments for specific student (for detail view)
  const fetchStudentEnrollments = async (studentId) => {
    try {
      setEnrollmentLoading(true);
      setEnrollmentError(null);
      const token = authService.getToken();
      
      const response = await fetch(
        `http://localhost:8000/Course/enrollments/?student_id=${studentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const data = await response.json();
      const enrollmentData = Array.isArray(data) ? data : data.results || [];
      setStudentEnrollments(enrollmentData);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollmentError(error.message);
      setStudentEnrollments([]);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('http://localhost:8000/lms/register/receptionist/student/list/'); 
        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.statusText}`);
        }
        const data = await response.json();
        const fetchedStudents = data.students || data || [];
        setStudents(fetchedStudents);
        
        // ✅ Fetch enrollments and payments for all students
        if (fetchedStudents.length > 0) {
          fetchAllStudentEnrollments(fetchedStudents);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setStudents([]); 
      }
    };

    fetchStudents();

    setCourses([
      { id: 1, name: 'Mathematics 101' },
      { id: 2, name: 'Physics 101' },
    ]);
  }, []);

  const handleUpdateStudent = () => {
    if (!editingStudent) return;
    const updatedStudents = students.map((student) =>
      student.id === editingStudent.id ? editingStudent : student
    );
    setStudents(updatedStudents);
    setEditingStudent(null);
  };

  const handleAddPayment = () => {
    if (!selectedStudent || !paymentForm.amount || isNaN(paymentForm.amount) || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    const studentFinancials = studentFinancialMap[selectedStudent.id] || { totalFees: 0, paidAmount: 0 };
    const balance = (studentFinancials.totalFees || 0) - (studentFinancials.paidAmount || 0);
    
    if (amount > balance) {
      alert('Payment amount cannot exceed the remaining balance.');
      return;
    }

    const newPayment = {
      id: payments.length + 1,
      studentId: selectedStudent.id,
      amount,
      date: paymentForm.date,
      method: paymentForm.method,
      status: 'Completed',
      notes: paymentForm.notes,
    };

    setPayments([...payments, newPayment]);

    // ✅ Update financial map
    setStudentFinancialMap(prev => ({
      ...prev,
      [selectedStudent.id]: {
        ...prev[selectedStudent.id],
        paidAmount: (prev[selectedStudent.id]?.paidAmount || 0) + amount
      }
    }));

    setPaymentForm({
      amount: '',
      method: 'Card',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowPaymentModal(false);
    setSelectedStudent(null);
  };

  const handleGrantCourseAccess = (studentId, courseId) => {
    setStudents(
      students.map((student) =>
        student.id === studentId
          ? { ...student, courses: [...new Set([...student.courses, courseId])] }
          : student
      )
    );
  };

  const handleAddStudent = (newStudent) => {
    setStudents([...students, { ...newStudent, id: students.length + 1, courses: newStudent.courses || [] }]);
    setShowAddStudent(false);
  };

  const handleCloseAddStudent = () => {
    setShowAddStudent(false);
  };

  // ✅ Handle enrollment refresh for selected student
  const handleEnrollmentRefresh = () => {
    if (selectedEnrollmentStudent) {
      fetchStudentEnrollments(selectedEnrollmentStudent.id);
      // Refresh financial data too
      fetchAllStudentEnrollments([selectedEnrollmentStudent]);
    }
  };

  // ✅ Handle student selection for enrollment
  const handleSelectStudentForEnrollment = (student) => {
    setSelectedEnrollmentStudent(student);
    fetchStudentEnrollments(student.id);
  };

  // ✅ NEW: Get student financial data with fallbacks
  const getStudentFinancials = (studentId) => {
    const financial = studentFinancialMap[studentId] || {};
    return {
      totalFees: financial.totalFees || 0,
      paidAmount: financial.paidAmount || 0,
      balance: (financial.totalFees || 0) - (financial.paidAmount || 0)
    };
  };

  // Safe filtering logic
  const filteredStudents = (students || []).filter(
    (student) => {
      if (!student) return false;
      const courseName = courses.find((c) => c.id === student.course)?.name || '';
      const lowerSearchTerm = searchTerm.toLowerCase();

      return (
        (student.firstName || '').toLowerCase().includes(lowerSearchTerm) || 
        (student.lastName || '').toLowerCase().includes(lowerSearchTerm) ||   
        (student.email || '').toLowerCase().includes(lowerSearchTerm) ||
        courseName.toLowerCase().includes(lowerSearchTerm)
      );
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ Get enrollment status colors
  const getEnrollmentStatusColor = (enrollment) => {
    if (enrollment.is_expired) return 'bg-red-100 text-red-800';
    if (enrollment.days_remaining <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // ✅ Get enrollment status text
  const getEnrollmentStatusText = (enrollment) => {
    if (enrollment.is_expired) return 'Expired';
    if (enrollment.days_remaining <= 7) return 'Expiring Soon';
    return 'Active';
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-red-600 font-semibold';
    if (balance === 0) return 'text-green-600 font-semibold';
    return 'text-blue-600 font-semibold';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Topbar />

      {/* Navigation Tabs */}
      <div className="px-4 pt-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="inline w-4 h-4 mr-2" />
              Student Management
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="inline w-4 h-4 mr-2" />
              Payment History
            </button>
            {/* ✅ Enrollment Access Tab */}
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrollments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="inline w-4 h-4 mr-2" />
              Enrollment Access
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="inline w-4 h-4 mr-2" />
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Student Management</h2>
                <p className="mt-1 text-gray-600">Manage student profiles, payments, and course enrollments</p>
              </div>
              <button
                onClick={() => setShowAddStudent(true)}
                className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute text-gray-400 left-3 top-3" size={18} />
              <input
                type="text"
                placeholder="Search students by name, email, or course..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Students Table - Enrollment Data in Course Column */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-700 uppercase">Student</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-700 uppercase">Course & Enrollments</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-700 uppercase">Payment</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents && filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const enrollments = studentEnrollmentsMap[student.id] || [];
                      const isLoading = loadingEnrollmentsMap[student.id];
                      const isPaymentLoading = loadingPaymentsMap[student.id];
                      const financials = getStudentFinancials(student.id);
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          {/* Student Info */}
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <Mail className="w-3 h-3 mr-1" />
                                {student.email}
                              </div>
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <Phone className="w-3 h-3 mr-1" />
                                {student.phone}
                              </div>
                            </div>
                          </td>

                          {/* ✅ Course & Enrollment Data */}
                          <td className="px-6 py-4">
                            {isLoading ? (
                              <div className="flex items-center gap-1">
                                <Loader size={14} className="text-blue-600 animate-spin" />
                                <span className="text-xs text-gray-600">Loading enrollments...</span>
                              </div>
                            ) : enrollments.length > 0 ? (
                              <div className="space-y-3">
                                {enrollments.map((enrollment) => (
                                  <div key={enrollment.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                    {/* Course Name */}
                                    <div className="text-sm font-semibold text-gray-900">
                                      {enrollment.course_title || enrollment.course?.title || 'Unknown Course'}
                                    </div>
                                    
                                    {/* Enrollment Details */}
                                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                                      {/* Dates */}
                                      
                                      
                                      {/* Expiration */}
                                      
                                    </div>

                                    
                                     

                                    {/* Teacher */}
                                    {enrollment.teacher_name && (
                                      <div className="mt-2 text-xs text-gray-600">
                                        <span className="font-medium">Teacher:</span> {enrollment.teacher_name}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <p className="text-xs font-medium text-gray-600">No active enrollments</p>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                              {student.status}
                            </span>
                          </td>

                          {/* ✅ NEW: Payment Column with Financial Data */}
                          <td className="px-6 py-4 text-sm">
                            {isPaymentLoading ? (
                              <div className="flex items-center gap-1">
                                <Loader size={14} className="text-blue-600 animate-spin" />
                                <span className="text-xs text-gray-600">Loading...</span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">Total:</span>
                                  <span className="font-semibold text-gray-900">
                                    ${financials.totalFees.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">Paid:</span>
                                  <span className="font-semibold text-green-600">
                                    ${financials.paidAmount.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">Balance:</span>
                                  <span className={`font-semibold ${getBalanceColor(financials.balance)}`}>
                                    ${financials.balance.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 space-x-2 text-sm whitespace-nowrap">
                            <button
                              onClick={() => setEditingStudent({ ...student, name: `${student.firstName} ${student.lastName}` })}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit student"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowPaymentModal(true);
                              }}
                              className="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                            >
                              Add Payment
                            </button>
                            
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-sm text-center text-gray-500">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment Page</h2>
            <PaymentPage />
          </div>
        )}

        {/* ✅ Enrollments Tab - Student Selection */}
        {activeTab === 'enrollments' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Enrollment Access Management</h2>
              <p className="mt-1 text-gray-600">Select a student to manage their course enrollments</p>
            </div>

            {/* Student Selection */}
            {!selectedEnrollmentStudent ? (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute text-gray-400 left-3 top-3" size={18} />
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Student List */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStudents && filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudentForEnrollment(student)}
                        className="p-4 text-left transition bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-500"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </p>
                            <p className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              {student.phone}
                            </p>
                            <div className="pt-2 mt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                Status: <span className="font-medium text-gray-900">{student.status}</span>
                              </p>
                              <p className="text-xs text-gray-500">
                                Balance: <span className={getBalanceColor(getStudentFinancials(student.id).balance)}>
                                  ${getStudentFinancials(student.id).balance.toFixed(2)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center border border-gray-200 rounded-lg col-span-full bg-gray-50">
                      <p className="text-gray-600">No students found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // ✅ Show enrollment details for selected student
              <div className="space-y-4">
                {/* Back Button */}
                <button
                  onClick={() => {
                    setSelectedEnrollmentStudent(null);
                    setStudentEnrollments([]);
                    setEnrollmentError(null);
                  }}
                  className="flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                  Back to Student List
                </button>

                {/* Selected Student Header */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedEnrollmentStudent.firstName} {selectedEnrollmentStudent.lastName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{selectedEnrollmentStudent.email}</p>
                  <p className="text-sm text-gray-600">{selectedEnrollmentStudent.phone}</p>
                </div>

                {/* Enrollment Component */}
                <EnrollmentAccess
                  selectedStudent={selectedEnrollmentStudent}
                  enrollments={studentEnrollments}
                  loading={enrollmentLoading}
                  error={enrollmentError}
                  onRefresh={handleEnrollmentRefresh}
                  isStudentSpecific={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <SettingsComponent />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddStudent && (
        <Useradd onAdd={handleAddStudent} onClose={handleCloseAddStudent} />
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
                placeholder="First Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.firstName}
                onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Last Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.lastName}
                onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.email}
                onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.phone}
                onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
              />
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={editingStudent.status}
                onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
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
        <Addpayment
          selectedStudent={selectedStudent}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          handleAddPayment={handleAddPayment}
          setShowPaymentModal={setShowPaymentModal}
          courses={courses}
          students={students}
        />
      )}

      {/* Course Access Modal */}
      {showCourseAccessModal && selectedStudent && (
        <CourseAccess
          onClose={() => setShowCourseAccessModal(false)}
          selectedStudent={selectedStudent}
          courses={courses}
          onGrantAccess={handleGrantCourseAccess}
        />
      )}
    </div>
  );
};

export default ReceptionistPanel;