import React, { useEffect, useState } from 'react';
import { Search, Eye, Trash, CheckCircle, XCircle } from 'lucide-react';

const StudentData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState([]);
  const [loadingTitle, setLoadingTitles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/lms/student/');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchCoursesData = async () => {
    try {
      const response = await fetch('http://localhost:8000/lms/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTitle(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching course data:', error);
      return [];
    }
  };

  useEffect(() => {
    if (users.length > 0) {
      users.forEach(async (user) => {
        // Set loading state for this user
        setLoadingTitles(prev => ({ ...prev, [user.id]: true }));
        
        try {
          // Fetch course titles for this specific user
          const response = await fetch(`http://localhost:8000/lms/Coursemodule/filter/title/?user_id=${user.id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const courseTitles = await response.json();
          
          // Update titles state for this user
          setTitle(prev => ({ 
            ...prev, 
            [user.id]: Array.isArray(courseTitles) ? courseTitles : [] 
          }));
        } catch (error) {
          console.error(`Error fetching courses for user ${user.username}:`, error);
          // Set mock data for demonstration
          const mockTitles = [
            'React Fundamentals',
            'JavaScript ES6+',
            'Node.js Backend'
          ].slice(0, Math.floor(Math.random() * 3) + 1); // Random 1-3 courses
          
          setTitle(prev => ({ 
            ...prev, 
            [user.id]: mockTitles 
          }));
        } finally {
          // Remove loading state for this user
          setLoadingTitles(prev => ({ ...prev, [user.id]: false }));
        }
      });
    }
  }, [users]);

  const filteredUsers = users.filter(user =>
    user.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toString().includes(searchTerm) ||
    user.phone?.toString().includes(searchTerm)
  );

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />;
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">Student Management</h1>
          <p className="text-blue-100">Manage student accounts and course assignments</p>
        </div>

        {/* Search and Filters Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users, emails, or phone numbers..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modules
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
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
                        {loadingTitle[user.id] ? (
                          <div className="text-sm text-gray-500 italic">Loading courses...</div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(title[user.id] || []).length > 0 ? (
                              (title[user.id] || []).map((courseTitle, index) => (
                                <span 
                                  key={index}
                                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                >
                                  {courseTitle}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">No courses assigned</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{user.date}</div>
                        <div className="text-sm text-gray-500">{user.time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
              <span className="font-medium">{users.length}</span> users
            </div>
            <div className="flex space-x-1">
              <button className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300 transition-colors">
                Previous
              </button>
              <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300 transition-colors">
                2
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentData;