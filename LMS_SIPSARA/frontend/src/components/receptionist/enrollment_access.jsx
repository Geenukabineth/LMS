import React, { useState, useEffect } from 'react';
import {
  Plus, X, AlertCircle, Loader, Trash2, Clock,
  CheckCircle, XCircle, Edit2, TrendingUp, RefreshCw
} from 'lucide-react';
import authService from '@/context/authService';

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
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [localEnrollments, setLocalEnrollments] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const [createForm, setCreateForm] = useState({
    course_id: '', // IMPORTANT: this will hold Course.id (PK)
    enrollment_days: 30,
  });

  const [extendForm, setExtendForm] = useState({
    enrollment_days: 30,
  });

  useEffect(() => {
    const authToken = authService.getToken();
    setToken(authToken);

    // only fetch when student changes
    fetchCourses();
    fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent]);

  // ✅ Fetch enrollments for the selected student
  // Your backend filters using Student.user_id (User id), so we must pass user_id
  const fetchEnrollments = async () => {
    if (!selectedStudent) {
      setLocalEnrollments([]);
      return;
    }

    const studentUserId =
      selectedStudent.user_id ??
      selectedStudent.user?.id ??
      selectedStudent.user?.user_id;

    if (!studentUserId) {
      // fallback: avoid calling wrong id
      setLocalEnrollments([]);
      return;
    }

    try {
      setFetchError(null);
      const t = authService.getToken();

      const response = await fetch(
        `http://localhost:8000/Course/enrollments/?student_id=${studentUserId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${t}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`📥 Fetching enrollments for student user_id=${studentUserId}`);

      if (response.ok) {
        const data = await response.json();

        let enrollmentList = [];
        if (Array.isArray(data)) enrollmentList = data;
        else if (data.results) enrollmentList = data.results;
        else if (data.enrollments) enrollmentList = data.enrollments;
        else if (data.data) enrollmentList = data.data;

        console.log('✅ Enrollments fetched:', enrollmentList);
        setLocalEnrollments(enrollmentList);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Fetch error:', response.status, errorData);
        setFetchError(errorData?.detail || errorData?.error || `Failed to fetch enrollments: ${response.status}`);
        setLocalEnrollments([]);
      }
    } catch (err) {
      console.error('❌ Error fetching enrollments:', err);
      setFetchError(`Error: ${err.message}`);
      setLocalEnrollments([]);
    }
  };

  // ✅ Fetch available courses
  const fetchCourses = async () => {
    try {
      setCourseLoading(true);
      const t = authService.getToken();

      let response = await fetch('http://localhost:8000/Course/courses/list/admin/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${t}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        response = await fetch('http://localhost:8000/Course/courses/list/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${t}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (!response.ok) {
        response = await fetch('http://localhost:8000/Course/courses/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${t}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (response.ok) {
        const data = await response.json();

        let courseList = [];
        if (Array.isArray(data)) courseList = data;
        else if (data.results) courseList = data.results;
        else if (data.courses) courseList = data.courses;
        else if (data.data) courseList = data.data;

        // Normalize: ensure we have course PK as `id`
        const normalized = (courseList || []).filter(Boolean).map((c) => ({
          ...c,
          _pk: c.id,                 // backend EnrollmentCreateAPIView uses Course.id
          _publicCourseId: c.course_id, // optional: useful for payment module if needed
        }));

        console.log('✅ Courses loaded:', normalized);
        setCourses(normalized);
      } else {
        console.error('❌ Failed to fetch courses:', response.statusText);
        setCourses([]);
      }
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
      setCourses([]);
    } finally {
      setCourseLoading(false);
    }
  };

  // ✅ Create enrollment
  const handleCreateEnrollment = async () => {
    if (!createForm.course_id) {
      alert('Please select a course');
      return;
    }

    if (!selectedStudent?.id) {
      alert('No student selected');
      return;
    }

    try {
      setIsLoading(true);

      // IMPORTANT:
      // - course_id MUST be Course.id (PK) because backend does Course, id=course_id :contentReference[oaicite:3]{index=3}
      // - student_ids currently expects Student.id because backend does Student, id=int(student_ids[0]) :contentReference[oaicite:4]{index=4}
      const requestBody = {
        course_id: parseInt(createForm.course_id, 10),
        student_ids: [selectedStudent.id],
        enrollment_days: createForm.enrollment_days,
      };

      console.log('📤 Sending enrollment request:', requestBody);

      const response = await fetch('http://localhost:8000/Course/enrollments/create/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.error('❌ Response error:', errJson);
        throw new Error(errJson.error || errJson.detail || errJson.message || 'Failed to create enrollment');
      }

      const data = await response.json();
      console.log('✅ Enrollment created:', data);

      if (data.enrollment) {
        setLocalEnrollments((prev) => [...prev, data.enrollment]);
      }

      alert('Enrollment created successfully!');
      setCreateForm({ course_id: '', enrollment_days: 30 });
      setShowCreateModal(false);

      fetchEnrollments();
      onRefresh?.();
    } catch (err) {
      console.error('❌ Error creating enrollment:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Extend enrollment
  const handleExtendEnrollment = async () => {
    if (!selectedEnrollment || !extendForm.enrollment_days) {
      alert('Please enter number of days to extend');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:8000/Course/enrollments/${selectedEnrollment.id}/update/`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enrollment_days: extendForm.enrollment_days,
          }),
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.detail || 'Failed to extend enrollment');
      }

      alert('Enrollment extended successfully!');
      setShowExtendModal(false);
      setSelectedEnrollment(null);
      setExtendForm({ enrollment_days: 30 });

      fetchEnrollments();
      onRefresh?.();
    } catch (err) {
      console.error('❌ Error extending enrollment:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Delete enrollment
  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to revoke this enrollment?')) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:8000/Course/enrollments/${enrollmentId}/delete/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete enrollment');

      alert('Enrollment revoked successfully!');
      setLocalEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));

      fetchEnrollments();
      onRefresh?.();
    } catch (err) {
      console.error('❌ Error deleting enrollment:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Combine both local and parent enrollments
  const allEnrollments = [...localEnrollments, ...enrollments];

  // Deduplicate enrollments by course_id
  const deduplicateEnrollments = (enrollmentList) => {
    const seen = new Set();
    return enrollmentList.filter((enrollment) => {
      const courseId = enrollment.course_id || enrollment.course?.id;
      if (seen.has(courseId)) return false;
      seen.add(courseId);
      return true;
    });
  };

  const uniqueEnrollments = deduplicateEnrollments(allEnrollments);

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
          <span className={`font-medium ${enrollment.is_expired ? 'text-red-600' : 'text-blue-600'}`}>
            {enrollment.days_remaining} days
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Access:</span>
          <span className={`font-medium ${enrollment.has_access ? 'text-green-600' : 'text-red-600'}`}>
            {enrollment.has_access ? 'Active' : 'Revoked'}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setSelectedEnrollment(enrollment);
            setShowExtendModal(true);
          }}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 transition border border-blue-300 rounded-lg hover:bg-blue-50"
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Enrollment Management</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchEnrollments}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200"
            title="Refresh enrollments"
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            New Enrollment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{uniqueEnrollments.length}</p>
        </div>
        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeEnrollments.length}</p>
        </div>
        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <p className="text-sm text-gray-600">Expiring Soon</p>
          <p className="text-2xl font-bold text-yellow-600">{expiringEnrollments.length}</p>
        </div>
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-2xl font-bold text-red-600">{expiredEnrollments.length}</p>
        </div>
      </div>

      {/* Errors */}
      {(error || fetchError) && (
        <div className="flex gap-3 p-4 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error || fetchError}</p>
        </div>
      )}

      {/* Loading / Empty / List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="text-blue-600 animate-spin" size={32} />
          <p className="ml-3 text-gray-600">Loading enrollments...</p>
        </div>
      ) : allEnrollments.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="mb-4 text-gray-600">No enrollments yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Create First Enrollment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeEnrollments.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Active Enrollments ({activeEnrollments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {activeEnrollments.map((enrollment, index) => (
                  <EnrollmentCard key={`active-${enrollment.id}-${index}`} enrollment={enrollment} />
                ))}
              </div>
            </div>
          )}

          {expiringEnrollments.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <Clock className="w-5 h-5 text-yellow-600" />
                Expiring Soon ({expiringEnrollments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {expiringEnrollments.map((enrollment, index) => (
                  <EnrollmentCard key={`expiring-${enrollment.id}-${index}`} enrollment={enrollment} />
                ))}
              </div>
            </div>
          )}

          {expiredEnrollments.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <XCircle className="w-5 h-5 text-red-600" />
                Expired ({expiredEnrollments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {expiredEnrollments.map((enrollment, index) => (
                  <EnrollmentCard key={`expired-${enrollment.id}-${index}`} enrollment={enrollment} />
                ))}
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
              <h3 className="text-xl font-semibold text-gray-900">Create New Enrollment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {selectedStudent && (
              <div className="p-3 mb-4 rounded-lg bg-blue-50">
                <p className="text-sm text-gray-600">
                  Student:{' '}
                  <span className="font-medium text-gray-900">
                    {selectedStudent.firstName || selectedStudent.username}{' '}
                    {selectedStudent.lastName || ''}
                  </span>
                </p>
                <p className="text-xs text-gray-500">Student ID: {selectedStudent.id}</p>
                {selectedStudent.user_id && (
                  <p className="text-xs text-gray-500">User ID: {selectedStudent.user_id}</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Course</label>
                {courseLoading ? (
                  <div className="flex items-center gap-2 p-3 text-gray-600">
                    <Loader size={16} className="animate-spin" />
                    Loading courses...
                  </div>
                ) : courses.length > 0 ? (
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={createForm.course_id}
                    onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
                  >
                    <option value="">Select a course...</option>
                    {courses.map((course) => (
                      <option key={course._pk} value={course._pk}>
                        {course.title} {course.level ? `- ${course.level}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 text-sm text-red-600 rounded-lg bg-red-50">
                    ❌ No courses available. Try refreshing the page.
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Enrollment Days</label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={createForm.enrollment_days}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      enrollment_days: parseInt(e.target.value, 10) || 30,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateEnrollment}
                disabled={isLoading || courses.length === 0}
                className="flex-1 px-4 py-2 font-medium text-white transition bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Enrollment'}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 font-medium text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
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
              <button
                onClick={() => setShowExtendModal(false)}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-3 mb-4 rounded-lg bg-blue-50">
              <p className="text-sm text-gray-600">
                Course:{' '}
                <span className="font-medium">
                  {selectedEnrollment.course?.title || selectedEnrollment.course_title}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Current Days Remaining:{' '}
                <span className="font-medium text-blue-600">{selectedEnrollment.days_remaining}</span>
              </p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Extend By (days)</label>
              <input
                type="number"
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={extendForm.enrollment_days}
                onChange={(e) => setExtendForm({ enrollment_days: parseInt(e.target.value, 10) || 30 })}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleExtendEnrollment}
                disabled={isLoading}
                className="flex-1 px-4 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Extending...' : 'Extend Enrollment'}
              </button>
              <button
                onClick={() => setShowExtendModal(false)}
                className="flex-1 px-4 py-2 font-medium text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
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

export default EnrollmentAccess;
