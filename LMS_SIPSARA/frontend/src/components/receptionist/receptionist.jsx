import React, { useState, useEffect } from 'react';
import { 
  User, DollarSign, Search, Plus, Edit3, Check, X, Mail, Phone, 
  Settings, BookOpen, Loader, ChevronRight
} from 'lucide-react';
import Useradd from '@/components/receptionist/useradd';
import UserEdit from '@/components/receptionist/useredit'; // ✅ Added Import
import Addpayment from '@/components/receptionist/addpayment';

import EnrollmentAccess from '@/components/receptionist/enrollment_access';
import Topbar from '@/components/topbar';
import SettingsComponent from '@/components/setting';
import PaymentPage from '@/components/receptionist/Receptionistpayment';

import { paymentService } from '@/config/payment.config';
import { courseService } from '@/config/course.config';

const ReceptionistPanel = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCourseAccessModal, setShowCourseAccessModal] = useState(false);
  
  // Selection state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null); // Used for the Edit Modal
  
  // Enrollment state
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [selectedEnrollmentStudent, setSelectedEnrollmentStudent] = useState(null);
  
  // Maps for bulk data
  const [studentEnrollmentsMap, setStudentEnrollmentsMap] = useState({});
  const [loadingEnrollmentsMap, setLoadingEnrollmentsMap] = useState({});
  const [studentPaymentsMap, setStudentPaymentsMap] = useState({});
  const [loadingPaymentsMap, setLoadingPaymentsMap] = useState({});
  const [studentFinancialMap, setStudentFinancialMap] = useState({});

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Card',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const calculateCourseFees = (enrollments) => {
    if (!enrollments || enrollments.length === 0) return 0;
    return enrollments.reduce((total, enrollment) => {
      const price = parseFloat(enrollment.course_price) || 0;
      return total + price;
    }, 0);
  };

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchStudentPayments = async (studentId) => {
    try {
      setLoadingPaymentsMap(prev => ({ ...prev, [studentId]: true }));
      
      const data = await paymentService.getAdminPaymentRecords({ search: studentId });
      const paymentList = Array.isArray(data) ? data : data.results || data.payments || [];
      
      setStudentPaymentsMap(prev => ({
        ...prev,
        [studentId]: paymentList
      }));

      const totalPaid = paymentList
        .filter(p => p.status === 'successful' || p.status === 'Completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      setStudentFinancialMap(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          paidAmount: totalPaid
        }
      }));
      
    } catch (error) {
      console.error(`Error fetching payments for student ${studentId}:`, error);
    } finally {
      setLoadingPaymentsMap(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const fetchAllStudentEnrollments = async (studentList) => {
    for (const student of studentList) {
      try {
        setLoadingEnrollmentsMap(prev => ({ ...prev, [student.id]: true }));
        
        const data = await courseService.getEnrollments({ student_id: student.id });
        const enrollmentList = Array.isArray(data) ? data : data.results || [];
        
        setStudentEnrollmentsMap(prev => ({
          ...prev,
          [student.id]: enrollmentList
        }));

        const totalFees = calculateCourseFees(enrollmentList);
        
        setStudentFinancialMap(prev => ({
          ...prev,
          [student.id]: {
            ...prev[student.id],
            totalFees: totalFees
          }
        }));

        fetchStudentPayments(student.id);

      } catch (error) {
        console.error(`Error fetching enrollments for student ${student.id}:`, error);
      } finally {
        setLoadingEnrollmentsMap(prev => ({ ...prev, [student.id]: false }));
      }
    }
  };

  const fetchStudentEnrollments = async (studentId) => {
    try {
      setEnrollmentLoading(true);
      setEnrollmentError(null);
      const data = await courseService.getEnrollments({ student_id: studentId });
      const enrollmentData = Array.isArray(data) ? data : data.results || [];
      setStudentEnrollments(enrollmentData);
    } catch (error) {
      setEnrollmentError(error.message || 'Failed to fetch enrollments');
      setStudentEnrollments([]);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await courseService.getReceptionistStudents(); 
        const fetchedStudents = data.students || data || [];
        setStudents(fetchedStudents);
        
        if (fetchedStudents.length > 0) {
          fetchAllStudentEnrollments(fetchedStudents);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setStudents([]); 
      }
    };

    const fetchCourses = async () => {
      try {
        const data = await courseService.getCoursesList();
        setCourses(Array.isArray(data) ? data : []);
      } catch (error) {
        setCourses([
            { id: 1, name: 'Mathematics 101' },
            { id: 2, name: 'Physics 101' },
        ]);
      }
    };

    fetchStudents();
    fetchCourses();
  }, []);

  const handleAddPayment = () => {
    if (!selectedStudent || !paymentForm.amount || isNaN(paymentForm.amount) || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setPaymentForm({
      amount: '',
      method: 'Card',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    
    fetchStudentPayments(selectedStudent.id);
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
    // Add new student to list (or re-fetch from API)
    setStudents(prev => [...prev, { ...newStudent, id: newStudent.id || prev.length + 1, courses: [] }]);
    setShowAddStudent(false);
  };

  const handleCloseAddStudent = () => {
    setShowAddStudent(false);
  };

  // ✅ ADDED: Function to handle updating the student list after edit
  const handleUpdateStudent = (updatedStudent) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === updatedStudent.id ? { ...student, ...updatedStudent } : student
      )
    );
    // Optionally refresh specific student data
  };

  const handleEnrollmentRefresh = () => {
    if (selectedEnrollmentStudent) {
      fetchStudentEnrollments(selectedEnrollmentStudent.id);
      fetchAllStudentEnrollments([selectedEnrollmentStudent]);
    }
  };

  const handleSelectStudentForEnrollment = (student) => {
    setSelectedEnrollmentStudent(student);
    fetchStudentEnrollments(student.id);
  };

  const getStudentFinancials = (studentId) => {
    const financial = studentFinancialMap[studentId] || {};
    const totalFees = financial.totalFees || 0;
    const paidAmount = financial.paidAmount || 0;
    return {
      totalFees: totalFees,
      paidAmount: paidAmount,
      balance: totalFees - paidAmount
    };
  };

  const filteredStudents = (students || []).filter(
    (student) => {
      if (!student) return false;
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        (student.firstName || '').toLowerCase().includes(lowerSearchTerm) || 
        (student.lastName || '').toLowerCase().includes(lowerSearchTerm) ||   
        (student.email || '').toLowerCase().includes(lowerSearchTerm)
      );
    }
  );

  const getStatusColor = (status) => {
    if (!status || status === 'Active') return 'bg-green-100 text-green-800';
    if (status === 'Inactive') return 'bg-red-100 text-red-800';
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-red-600 font-bold'; 
    if (balance === 0) return 'text-green-600 font-bold'; 
    return 'text-orange-600 font-bold'; 
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />

      <div className="px-4 pt-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {['students', 'payments', 'enrollments', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'students' && <User className="inline w-4 h-4 mr-2" />}
                {tab === 'payments' && <DollarSign className="inline w-4 h-4 mr-2" />}
                {tab === 'enrollments' && <BookOpen className="inline w-4 h-4 mr-2" />}
                {tab === 'settings' && <Settings className="inline w-4 h-4 mr-2" />}
                {tab === 'students' ? 'Student Management' : tab === 'enrollments' ? 'Enrollment Access' : tab === 'payments' ? 'Payment History' : 'Settings'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-black uppercase">Student Management</h2>
              <button
                onClick={() => setShowAddStudent(true)}
                className="flex items-center px-4 py-2 space-x-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute text-gray-400 left-3 top-3" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full py-2 pl-10 pr-4 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-700 uppercase">Student</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-700 uppercase">Course & Financials</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents && filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const enrollments = studentEnrollmentsMap[student.id] || [];
                      const isLoading = loadingEnrollmentsMap[student.id];
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
                            </div>
                          </td>

                          {/* Course & Financials */}
                          <td className="px-6 py-4">
                            {isLoading ? (
                              <div className="flex items-center gap-1">
                                <Loader size={14} className="text-orange-600 animate-spin" />
                                <span className="text-xs text-gray-600">Loading...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col space-y-3">
                                {enrollments.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {enrollments.map((enrollment) => (
                                      <span key={enrollment.id} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                        {enrollment.course_title || enrollment.course?.title || 'Unknown Course'}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs italic text-gray-400">No active enrollments</span>
                                )}

                                <div className="pt-2 mt-1 border-t border-gray-100">
                                  <div className="flex items-center gap-3 text-sm">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-gray-500 uppercase">Total</span>
                                      <span className="font-semibold text-gray-900">${financials.totalFees.toFixed(2)}</span>
                                    </div>
                                    <span className="text-gray-300">|</span>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-gray-500 uppercase">Paid</span>
                                      <span className="font-semibold text-green-600">${financials.paidAmount.toFixed(2)}</span>
                                    </div>
                                    <span className="text-gray-300">|</span>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-gray-500 uppercase">Balance</span>
                                      <span className={getBalanceColor(financials.balance)}>
                                        ${financials.balance.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                              {student.status || 'Active'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 space-x-2 text-sm whitespace-nowrap">
                            <button
                              onClick={() => setEditingStudent(student)} // ✅ Trigger Edit
                              className="text-orange-600 hover:text-orange-900"
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
                      <td colSpan="4" className="px-6 py-4 text-sm text-center text-gray-500">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h2 className="flex flex-col gap-4 p-6 mb-6 text-2xl font-bold text-white uppercase rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
              Payment Page
            </h2>
            <PaymentPage />
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="space-y-6">
            <h2 className="flex flex-col gap-4 p-6 mb-6 text-2xl font-bold text-white uppercase rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
              Enrollment Access Management
            </h2>
            {!selectedEnrollmentStudent ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute text-gray-400 left-3 top-3" size={18} />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudentForEnrollment(student)}
                      className="p-4 text-left transition bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-500"
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
                          <div className="pt-2 mt-2 border-t border-gray-200">
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
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button onClick={() => setSelectedEnrollmentStudent(null)} className="flex items-center gap-2 font-medium text-orange-600 hover:text-orange-800">
                  <X className="w-4 h-4" /> Back to Student List
                </button>
                <EnrollmentAccess selectedStudent={selectedEnrollmentStudent} enrollments={studentEnrollments} loading={enrollmentLoading} error={enrollmentError} onRefresh={handleEnrollmentRefresh} isStudentSpecific={true} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <SettingsComponent />
          </div>
        )}
      </div>

      {showAddStudent && <Useradd onAdd={handleAddStudent} onClose={handleCloseAddStudent} />}
      
      {/* ✅ ADDED: Render Edit Modal */}
      {editingStudent && (
        <UserEdit 
          student={editingStudent} 
          onUpdate={handleUpdateStudent} 
          onClose={() => setEditingStudent(null)} 
        />
      )}

      {showPaymentModal && selectedStudent && (
        <Addpayment selectedStudent={selectedStudent} paymentForm={paymentForm} setPaymentForm={setPaymentForm} handleAddPayment={handleAddPayment} setShowPaymentModal={setShowPaymentModal} courses={courses} students={students} onSuccess={() => fetchStudentPayments(selectedStudent.id)} />
      )}
      
    </div>
  );
};

export default ReceptionistPanel;