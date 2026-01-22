import React, { useState, useEffect } from 'react';
import {
  Plus, X, AlertCircle, Loader, Trash2, Clock,
  CheckCircle, XCircle, Edit2, TrendingUp, RefreshCw
} from 'lucide-react';
import { courseService } from '@/config/course.config'; // ✅ Using courseService

const EnrollmentAccess = ({
  selectedStudent,
  enrollments = [],
  loading,
  error,
  onRefresh,
  isStudentSpecific = false
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [localEnrollments, setLocalEnrollments] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const [createForm, setCreateForm] = useState({
    course_id: '',
    enrollment_days: 30,
  });

  const [extendForm, setExtendForm] = useState({
    enrollment_days: 30,
  });

  useEffect(() => {
    if (selectedStudent) {
      fetchCourses();
      fetchEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent]);

  // ✅ Fetch Enrollments
  const fetchEnrollments = async () => {
    if (!selectedStudent) {
      setLocalEnrollments([]);
      return;
    }

    const studentId = selectedStudent.id || selectedStudent.user_id;
    if (!studentId) return;

    try {
      setFetchError(null);
      const data = await courseService.getEnrollments({ student_id: studentId });

      let enrollmentList = [];
      if (Array.isArray(data)) enrollmentList = data;
      else if (data?.results) enrollmentList = data.results;
      else if (data?.enrollments) enrollmentList = data.enrollments;

      setLocalEnrollments(enrollmentList);
    } catch (err) {
      console.error('❌ Error fetching enrollments:', err);
      setFetchError('Failed to fetch enrollments');
      setLocalEnrollments([]);
    }
  };

  // ✅ Fetch Courses
  const fetchCourses = async () => {
    try {
      setCourseLoading(true);
      const data = await courseService.getCoursesList();

      let courseList = [];
      if (Array.isArray(data)) courseList = data;
      else if (data?.results) courseList = data.results;
      else if (data?.courses) courseList = data.courses;

      const normalized = (courseList || []).filter(Boolean).map((c) => ({
        ...c,
        _pk: c.id, 
      }));

      setCourses(normalized);
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
      setCourses([]);
    } finally {
      setCourseLoading(false);
    }
  };

  // ✅ Create Enrollment
  const handleCreateEnrollment = async () => {
    if (!createForm.course_id) return alert('Please select a course');
    if (!selectedStudent?.id) return alert('No student selected');

    try {
      setIsLoading(true);
      const requestBody = {
        course_id: parseInt(createForm.course_id, 10),
        student_ids: [selectedStudent.id],
        enrollment_days: createForm.enrollment_days,
      };

      const data = await courseService.createEnrollment(requestBody);

      alert('Enrollment created successfully!');
      if (data.enrollment) {
        setLocalEnrollments((prev) => [...prev, data.enrollment]);
      }

      setCreateForm({ course_id: '', enrollment_days: 30 });
      setShowCreateModal(false);
      fetchEnrollments();
      if (onRefresh) onRefresh();

    } catch (err) {
      console.error('❌ Error creating enrollment:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Extend Enrollment (Update)
  const handleExtendEnrollment = async () => {
    if (!selectedEnrollment || !extendForm.enrollment_days) {
      alert('Please enter number of days to extend');
      return;
    }

    try {
      setIsLoading(true);
      
      const payload = {
        enrollment_days: extendForm.enrollment_days
      };

      // Calls courseService.updateEnrollment -> PUT /Course/enrollments/{id}/
      await courseService.updateEnrollment(selectedEnrollment.id, payload);

      alert('Enrollment extended successfully!');
      setShowExtendModal(false);
      setSelectedEnrollment(null);
      setExtendForm({ enrollment_days: 30 });

      fetchEnrollments();
      if (onRefresh) onRefresh();

    } catch (err) {
      console.error('❌ Error extending enrollment:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Revoke Enrollment (Delete)
  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to revoke this enrollment?')) return;

    try {
      setIsLoading(true);
      
      // Calls courseService.deleteEnrollment -> DELETE /Course/enrollments/{id}/
      await courseService.deleteEnrollment(enrollmentId);

      alert('Enrollment revoked successfully!');
      setLocalEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));

      fetchEnrollments();
      if (onRefresh) onRefresh();

    } catch (err) {
      console.error('❌ Error deleting enrollment:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper logic for display
  const combinedEnrollments = [...localEnrollments, ...enrollments];
  const uniqueEnrollments = Array.from(new Map(combinedEnrollments.map(item => [item.id, item])).values());

  const getStatusBadgeColor = (enrollment) => {
    if (enrollment.is_expired) return 'bg-red-100 text-red-800';
    if (enrollment.days_remaining <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (enrollment) => {
    if (enrollment.is_expired) return 'Expired';
    if (enrollment.days_remaining <= 7) return 'Expiring Soon';
    return 'Active';
  };

  const activeEnrollments = uniqueEnrollments.filter((e) => !e.is_expired && e.days_remaining > 7);
  const expiringEnrollments = uniqueEnrollments.filter((e) => !e.is_expired && e.days_remaining <= 7);
  const expiredEnrollments = uniqueEnrollments.filter((e) => e.is_expired);

  const EnrollmentCard = ({ enrollment }) => (
    <div className="p-4 transition border border-gray-200 rounded-lg hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {enrollment.course?.title || enrollment.course_title || 'Unknown Course'}
          </h4>
          <p className="text-sm text-gray-600">
            {enrollment.course?.teacher_name || enrollment.teacher_name || 'Unknown Teacher'}
          </p>
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(enrollment)}`}>
          {getStatusText(enrollment)}
        </span>
      </div>

      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Started:</span>
          <span className="font-medium text-gray-900">
            {new Date(enrollment.started_at || enrollment.date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Expires:</span>
          <span className="font-medium text-gray-900">
            {new Date(enrollment.ended_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Days Remaining:</span>
          <span className={`font-medium ${enrollment.is_expired ? 'text-red-600' : 'text-orange-600'}`}>
            {enrollment.days_remaining} days
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setSelectedEnrollment(enrollment);
            setShowExtendModal(true);
          }}
          className="flex-1 px-3 py-2 text-sm font-medium text-orange-600 transition border border-orange-300 rounded-lg hover:bg-orange-50"
        >
          <Edit2 size={16} className="inline mr-2" />
          Extend
        </button>
        <button
          onClick={() => handleDeleteEnrollment(enrollment.id)}
          className="flex-1 px-3 py-2 text-sm font-medium text-red-600 transition border border-red-300 rounded-lg hover:bg-red-50"
        >
          <Trash2 size={16} className="inline mr-2" />
          Revoke
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Enrollment Management</h2>
        <div className="flex gap-2">
          <button onClick={fetchEnrollments} className="flex items-center gap-2 px-4 py-2 text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200">
            <RefreshCw size={20} />
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 text-white transition bg-orange-600 rounded-lg hover:bg-orange-700">
            <Plus size={20} />
            New Enrollment
          </button>
        </div>
      </div>

      {(error || fetchError) && (
        <div className="flex gap-3 p-4 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error || fetchError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="text-orange-600 animate-spin" size={32} />
          <p className="ml-3 text-gray-600">Loading enrollments...</p>
        </div>
      ) : uniqueEnrollments.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="mb-4 text-gray-600">No enrollments found for this student.</p>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700">
            Create First Enrollment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeEnrollments.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <CheckCircle className="w-5 h-5 text-green-600" /> Active ({activeEnrollments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {activeEnrollments.map((e, i) => <EnrollmentCard key={e.id || i} enrollment={e} />)}
              </div>
            </div>
          )}

          {expiringEnrollments.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <Clock className="w-5 h-5 text-yellow-600" /> Expiring Soon ({expiringEnrollments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {expiringEnrollments.map((e, i) => <EnrollmentCard key={e.id || i} enrollment={e} />)}
              </div>
            </div>
          )}

          {expiredEnrollments.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <XCircle className="w-5 h-5 text-red-600" /> Expired ({expiredEnrollments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {expiredEnrollments.map((e, i) => <EnrollmentCard key={e.id || i} enrollment={e} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Enrollment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Course</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={createForm.course_id}
                  onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
                >
                  <option value="">Select a course...</option>
                  {courses.map(c => <option key={c._pk} value={c._pk}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Days</label>
                <input 
                  type="number" 
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={createForm.enrollment_days}
                  onChange={(e) => setCreateForm({ ...createForm, enrollment_days: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateEnrollment} disabled={isLoading} className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">Create</button>
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Modal */}
      {showExtendModal && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Extend Enrollment</h3>
              <button onClick={() => setShowExtendModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="p-3 mb-4 rounded-lg bg-orange-50">
              <p className="text-sm text-gray-600">Course: <span className="font-medium">{selectedEnrollment.course?.title || selectedEnrollment.course_title}</span></p>
              <p className="text-sm text-gray-600">Current Days: <span className="font-medium text-orange-600">{selectedEnrollment.days_remaining}</span></p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Extend By (days)</label>
              <input 
                type="number" 
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={extendForm.enrollment_days}
                onChange={(e) => setExtendForm({ enrollment_days: e.target.value })}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleExtendEnrollment} disabled={isLoading} className="flex-1 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50">Extend</button>
              <button onClick={() => setShowExtendModal(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentAccess;