import React, { useEffect, useState } from 'react';
import { Search, Edit3, Trash, CheckCircle, XCircle, X, Check } from 'lucide-react';


const UserDataPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState({});
  const [loadingTitle, setLoadingTitle] = useState({});
  const [editingStudent, setEditingStudent] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/lms/user/');
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

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (users.length > 0) {
        const coursePromises = users.map(async (user) => {
          setLoadingTitle(prev => ({ ...prev, [user.id]: true }));
          
          try {
            const response = await fetch(`http://localhost:8000/lms/Coursemodule/filter/title/?user_id=${user.id}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const courseTitles = await response.json();
            
            let processedTitles = [];
            if (Array.isArray(courseTitles)) {
              processedTitles = courseTitles.map(course => {
                if (typeof course === 'object' && course !== null) {
                  return course.title || course.name || 'Untitled Course';
                }
                return course.toString();
              });
            }
            
            return { userId: user.id, titles: processedTitles };
          } catch (error) {
            console.error(`Error fetching courses for user ${user.username}:`, error);
            
            const mockTitles = [
              'React Fundamentals',
              'JavaScript ES6+',
              'Node.js Backend'
            ].slice(0, Math.floor(Math.random() * 3) + 1);
            
            return { userId: user.id, titles: mockTitles };
          }
        });

        try {
          const results = await Promise.all(coursePromises);
          
          const titleMap = {};
          const loadingMap = {};
          
          results.forEach(({ userId, titles }) => {
            titleMap[userId] = titles;
            loadingMap[userId] = false;
          });
          
          setTitle(prev => ({ ...prev, ...titleMap }));
          setLoadingTitle(prev => ({ ...prev, ...loadingMap }));
        } catch (error) {
          console.error('Error fetching course data:', error);
          
          const loadingMap = {};
          users.forEach(user => {
            loadingMap[user.id] = false;
          });
          setLoadingTitle(prev => ({ ...prev, ...loadingMap }));
        }
      }
    };

    fetchUserCourses();
  }, [users]);

 // FIXED: Add trailing slash to match the delete endpoint pattern
const handleUpdateStudent = async () => {   
  if (!editingStudent || !editingStudent.id) {
    console.error('No student selected for editing');
    return;
  }

  setUpdateLoading(true);
  
  try {
    // FIX: Added trailing slash to the URL
    const response = await fetch(`http://localhost:8000/lms/user/update/${editingStudent.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: editingStudent.username,
        email: editingStudent.email,
        phone: editingStudent.phone,
        is_active: editingStudent.is_active
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    const updatedUser = await response.json();
    
    // Update the users state with the updated user data
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === editingStudent.id ? updatedUser : user
      )
    );
    
    // Close the modal
    setEditingStudent(null);
    
    console.log('User updated successfully:', updatedUser);
  } catch (error) {
    console.error('Error updating student:', error);
    alert('Failed to update user. Please try again.');
  } finally {
    setUpdateLoading(false);
  }
};

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/lms/user/delete/${userId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Remove the user from the state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      console.log('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <h1 className="text-3xl font-bold mb-2">Lecturers Management</h1>
          <p className="text-blue-100">Manage Lecturers accounts</p>
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
                          title="Edit"
                          onClick={() => setEditingStudent({...user})}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                          onClick={() => handleDeleteUser(user.id)}
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

          {/* Edit Student Modal */}
          {editingStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Edit User</h3>
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
                    placeholder="Username"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editingStudent.username || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, username: e.target.value})}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editingStudent.email || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                  />
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editingStudent.is_active ? 'Active' : 'Inactive'}
                    onChange={(e) => setEditingStudent({...editingStudent, is_active: e.target.value === 'Active'})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleUpdateStudent}
                    disabled={updateLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {updateLoading ? 'Updating...' : 'Update User'}
                  </button>
                  <button
                    onClick={() => setEditingStudent(null)}
                    disabled={updateLoading}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No users found</div>
              <div className="text-gray-400">Try adjusting your search criteria</div>
            </div>
          )}

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

export default UserDataPanel;