import React, { useEffect, useState } from 'react';
import { Search, Eye, Trash, CheckCircle, XCircle } from 'lucide-react';

const StudentData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCourses, setUserCourses] = useState({}); // Changed from title to userCourses
  const [loadingCourses, setLoadingCourses] = useState({}); // Changed from loadingTitle

  // Fetch all students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch courses for each student once users are loaded
  useEffect(() => {
    if (users.length > 0) {
      users.forEach((user) => {
        fetchUserCourses(user.id);
      });
    }
  }, [users]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:8000/lms/student/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCourses = async (userId) => {
    try {
      // Set loading state for this specific user
      setLoadingCourses(prev => ({ ...prev, [userId]: true }));

      const response = await fetch(
        `http://localhost:8000/lms/Coursemodule/filter/title/?user_id=${userId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const coursesData = await response.json();
      
      // Handle both array and object responses
      const coursesArray = Array.isArray(coursesData) 
        ? coursesData 
        : coursesData.results || coursesData.data || [];

      setUserCourses(prev => ({
        ...prev,
        [userId]: coursesArray
      }));
    } catch (error) {
      console.error(`Error fetching courses for user ${userId}:`, error);
      // Set empty array on error instead of mock data
      setUserCourses(prev => ({
        ...prev,
        [userId]: []
      }));
    } finally {
      setLoadingCourses(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/lms/student/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove user from state
      setUsers(users.filter(u => u.id !== userId));
      // Remove user's courses from state
      setUserCourses(prev => {
        const newCourses = { ...prev };
        delete newCourses[userId];
        return newCourses;
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const handleViewUser = (userId) => {
    // Navigate to user details page or open modal
    console.log('View user:', userId);
    // Example: navigate(`/students/${userId}`);
  };

  const filteredUsers = users.filter(user =>
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.id?.toString() || '').includes(searchTerm) ||
    (user.phone?.toString() || '').includes(searchTerm)
  );

  const getStatusIcon = (isActive) => {
    return isActive 
      ? <CheckCircle size={16} className="text-green-500" /> 
      : <XCircle size={16} className="text-red-500" />;
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
          <p className="text-sm text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Error Loading Students</h2>
            <p className="mb-4 text-sm text-gray-600">{error}</p>
            <button
              onClick={fetchStudents}
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="p-8 mb-8 text-white rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-purple-600">
          <h1 className="mb-2 text-4xl font-bold">Student Management</h1>
          <p className="text-blue-100">Manage student accounts and course assignments</p>
        </div>

        {/* Search Card */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <div className="relative">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, phone, or ID..."
              className="w-full py-3 pl-10 pr-4 transition-all border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table Card */}
        <div className="overflow-hidden bg-white rounded-lg shadow">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="mb-1 text-lg font-medium text-gray-900">No students found</h3>
              <p className="text-sm text-gray-500">
                {users.length === 0 
                  ? 'No students in the system yet.' 
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase">
                        Student Name
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase">
                        Courses
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase">
                        Joined Date
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.username || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{user.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{user.phone || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {getStatusIcon(user.is_active)}
                            {getStatusText(user.is_active)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            {loadingCourses[user.id] ? (
                              <p className="text-xs italic text-gray-500">Loading...</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {(userCourses[user.id] || []).length > 0 ? (
                                  (userCourses[user.id] || []).map((course, index) => (
                                    <span 
                                      key={index}
                                      className="inline-block px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full whitespace-nowrap"
                                    >
                                      {typeof course === 'string' ? course : course.title || course.name || 'Unnamed'}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400">No courses</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{formatDate(user.date_joined || user.date)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleViewUser(user.id)}
                              className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                              title="View details"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-gray-400 transition-colors rounded-lg hover:text-red-600 hover:bg-red-50"
                              title="Delete student"
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer with record count */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-semibold">{filteredUsers.length}</span> of{' '}
                  <span className="font-semibold">{users.length}</span> students
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentData;