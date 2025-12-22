import React, { useState } from 'react';
import { Plus, X, AlertCircle, Loader, Trash2, Clock, CheckCircle, XCircle, RefreshCw, Edit2 } from 'lucide-react';
import authService from '@/context/authService';

const EnrollmentAccess = ({ 
  enrollments, 
  loading, 
  error, 
  onRefresh,
  activeEnrollments,
  expiredEnrollments,
  expiringEnrollments 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    student_id: '',
    course_id: '',
    enrollment_days: 30,
  });

  const [extendForm, setExtendForm] = useState({
    enrollment_days: 30,
  });

  React.useEffect(() => {
    const authToken = authService.getToken();
    setToken(authToken);
  }, []);

  // ✅ Create enrollment
  const handleCreateEnrollment = async () => {
    if (!createForm.student_id || !createForm.course_id) {
      alert('Please select student and course');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/Course/enrollments/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: parseInt(createForm.student_id),
          course_id: parseInt(createForm.course_id),
          enrollment_days: createForm.enrollment_days,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create enrollment');
      }

      const data = await response.json();
      alert('Enrollment created successfully!');
      setCreateForm({ student_id: '', course_id: '', enrollment_days: 30 });
      setShowCreateModal(false);
      onRefresh();
    } catch (err) {
      console.error('Error creating enrollment:', err);
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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enrollment_days: extendForm.enrollment_days,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extend enrollment');
      }

      alert('Enrollment extended successfully!');
      setShowExtendModal(false);
      setSelectedEnrollment(null);
      setExtendForm({ enrollment_days: 30 });
      onRefresh();
    } catch (err) {
      console.error('Error extending enrollment:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Delete enrollment
  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to revoke this enrollment?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:8000/Course/enrollments/${enrollmentId}/delete/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete enrollment');
      }

      alert('Enrollment revoked successfully!');
      onRefresh();
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Get badge color based on status
  const getStatusBadgeColor = (enrollment) => {
    if (enrollment.is_expired) {
      return 'bg-red-100 text-red-800';
    } else if (enrollment.days_remaining && enrollment.days_remaining <= 7) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  };

  // ✅ Get status icon
  const getStatusIcon = (enrollment) => {
    if (enrollment.is_expired) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else if (enrollment.days_remaining && enrollment.days_remaining <= 7) {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    } else {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  // ✅ Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ Render enrollment card
  const EnrollmentCard = ({ enrollment }) => (
    <div className="p-5 transition border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{enrollment.course_title}</h3>
          <p className="mt-1 text-sm text-gray-600">Student: {enrollment.student_name}</p>
          <p className="text-sm text-gray-600">Level: {enrollment.course_level}</p>
          {enrollment.teacher_name && enrollment.teacher_name !== 'N/A' && (
            <p className="text-sm text-gray-600">Teacher: {enrollment.teacher_name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedEnrollment(enrollment);
              setExtendForm({ enrollment_days: 30 });
              setShowExtendModal(true);
            }}
            className="p-2 text-blue-600 transition rounded hover:bg-blue-50"
            title="Extend enrollment"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDeleteEnrollment(enrollment.id)}
            className="p-2 text-red-600 transition rounded hover:bg-red-50"
            title="Revoke enrollment"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Enrollment Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Started:</span>
          <p className="font-medium text-gray-900">{formatDate(enrollment.started_at)}</p>
        </div>
        <div>
          <span className="text-gray-600">Expires:</span>
          <p className="font-medium text-gray-900">{formatDate(enrollment.ended_at)}</p>
        </div>
        <div>
          <span className="text-gray-600">Days Remaining:</span>
          <p className={`font-medium ${
            enrollment.is_expired ? 'text-red-600' : 
            enrollment.days_remaining <= 7 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {enrollment.is_expired ? 'Expired' : `${enrollment.days_remaining} days`}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Progress:</span>
          <p className="font-medium text-gray-900">{enrollment.progress_percent}%</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {getStatusIcon(enrollment)}
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(enrollment)}`}>
          {enrollment.is_expired ? 'Expired' : 
           enrollment.days_remaining && enrollment.days_remaining <= 7 ? `Expiring Soon (${enrollment.days_remaining} days)` : 
           'Active'}
        </span>
      </div>

      {/* Access Status */}
      <div className="pt-3 mt-3 border-t border-gray-200">
        {enrollment.has_access ? (
          <p className="text-sm font-medium text-green-600">✓ Access Granted</p>
        ) : (
          <p className="text-sm font-medium text-red-600">✗ Access Revoked</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Enrollment Access Management</h2>
          <p className="mt-1 text-gray-600">Manage student enrollments and expiration dates</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Enrollment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Enrollments</p>
          <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
        </div>
        <div className="p-4 border border-green-200 rounded-lg shadow bg-green-50">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeEnrollments.length}</p>
        </div>
        <div className="p-4 border border-yellow-200 rounded-lg shadow bg-yellow-50">
          <p className="text-sm text-gray-600">Expiring Soon (7 days)</p>
          <p className="text-2xl font-bold text-yellow-600">{expiringEnrollments.length}</p>
        </div>
        <div className="p-4 border border-red-200 rounded-lg shadow bg-red-50">
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-2xl font-bold text-red-600">{expiredEnrollments.length}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-3 p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="text-blue-600 animate-spin" size={32} />
          <p className="ml-3 text-gray-600">Loading enrollments...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
          <p className="mb-4 text-gray-600">No enrollments found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Create First Enrollment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Enrollments */}
          {activeEnrollments.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Active Enrollments ({activeEnrollments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {activeEnrollments.map((enrollment) => (
                  <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon */}
          {expiringEnrollments.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <Clock className="w-5 h-5 text-yellow-600" />
                Expiring Soon ({expiringEnrollments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {expiringEnrollments.map((enrollment) => (
                  <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            </div>
          )}

          {/* Expired */}
          {expiredEnrollments.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                <XCircle className="w-5 h-5 text-red-600" />
                Expired ({expiredEnrollments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {expiredEnrollments.map((enrollment) => (
                  <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
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

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Student ID</label>
                <input
                  type="number"
                  placeholder="Enter student user ID"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={createForm.student_id}
                  onChange={(e) => setCreateForm({ ...createForm, student_id: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Course ID</label>
                <input
                  type="number"
                  placeholder="Enter course ID"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={createForm.course_id}
                  onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Enrollment Days</label>
                <input
                  type="number"
                  placeholder="Default: 30 days"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={createForm.enrollment_days}
                  onChange={(e) => setCreateForm({ ...createForm, enrollment_days: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateEnrollment}
                disabled={isLoading}
                className="flex-1 px-4 py-2 font-medium text-white transition bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
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
              <p className="text-sm text-gray-600">Course: <span className="font-medium">{selectedEnrollment.course_title}</span></p>
              <p className="text-sm text-gray-600">Student: <span className="font-medium">{selectedEnrollment.student_name}</span></p>
              <p className="text-sm text-gray-600">Current Days Remaining: <span className="font-medium text-blue-600">{selectedEnrollment.days_remaining}</span></p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Extend By (days)</label>
              <input
                type="number"
                placeholder="Number of days to add"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={extendForm.enrollment_days}
                onChange={(e) => setExtendForm({ enrollment_days: parseInt(e.target.value) })}
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