import React, { useEffect, useState } from 'react';
import { Search, Edit3, Trash, CheckCircle, XCircle, Users, UserCheck, X, Plus, Mail, Phone } from 'lucide-react';
import AddTeacher from '@/SUadmin/teacheradd';
import ReceptionistForm from '@/receptionist/addreception';
import { API_USER_ENDPOINTS } from '@/config/userapi';

const UserManagementPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teachers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('teacher'); // 'teacher' or 'receptionist'
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);


  // Form state for adding/editing receptionists
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    Email_Address: '',
    Phone_Number: '',
    Department: '',
    
    is_active: true
  });

  // Function to fetch teachers
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_USER_ENDPOINTS.TEACHER_LIST);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("API did not return an array:", data);
        setUsers([]);
        setError("Invalid data received from API. Expected an array.");
      }
      setError(null);
    } catch (error) {
      setError(error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch receptionists
  const fetchReceptionists = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_USER_ENDPOINTS.RECEPTIONIST_LIST);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        setReceptionists(data);
      } else {
        console.error("API did not return an array:", data);
        setReceptionists([]);
        setError("Invalid data received from API. Expected an array.");
      }
      setError(null);
    } catch (error) {
      setError(error.message);
      setReceptionists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeachers();
    } else {
      fetchReceptionists();
    }
  }, [activeTab]);

  // Handle receptionist form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle receptionist form submission
  const handleReceptionistFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser 
        ? `${BASE_URL}/receptionist/update/${editingUser}/`
        : `${BASE_URL}/receptionist/add/`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingUser ? 'update' : 'add'} receptionist`);
      }

      fetchReceptionists();
      setFormData({
        First_Name: '',
        Last_Name: '',
        Email_Address: '',
        Phone_Number: '',
        Department: '',
        
        is_active: true
      });
      setShowAddModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(error.message);
    }
  };

  // Handle delete
  const handleDelete = async (userId) => {
    try {
      const endpoint = activeTab === 'teachers' ? 'teacher' : 'receptionist';
      const response = await fetch(`${BASE_URL}/${endpoint}/delete/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      if (activeTab === 'teachers') {
        fetchTeachers();
      } else {
        fetchReceptionists();
      }
      
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(error.message);
    }
  };

  // Handle edit
  const handleEdit = (user) => {
    if (activeTab === 'teachers') {
      setEditingUser(user);
      setModalType('teacher');
      setShowAddModal(true);
    } else {
      setFormData({
        First_Name: user.First_Name || '',
        Last_Name: user.Last_Name || '',
        Email_Address: user.Email_Address || '',
        Phone_Number: user.Phone_Number || '',
        Department: user.Department || '',
        
        is_active: user.is_active !== undefined ? user.is_active : true
      });
      setEditingUser(user.id);
      setModalType('receptionist');
      setShowAddModal(true);
    }
  };

  // Get current data based on active tab
  const currentData = activeTab === 'teachers' ? users : receptionists;
  
  // Filter users based on search term
  const filteredUsers = currentData.filter((user) =>
    user && user.First_Name && user.First_Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Receptionist Modal Component
  const AddReceptionistModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-600 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingUser ? 'Edit' : 'Add'} Receptionist
          </h3>
          <button
            onClick={() => {
              setShowAddModal(false);
              setEditingUser(null);
              setFormData({
                First_Name: '',
                Last_Name: '',
                Email_Address: '',
                Phone_Number: '',
                Department: '',
                
                is_active: true
              });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReceptionistFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                name="First_Name"
                value={formData.First_Name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                name="Last_Name"
                value={formData.Last_Name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              type="email"
              name="Email_Address"
              value={formData.Email_Address}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <input
              type="tel"
              name="Phone_Number"
              value={formData.Phone_Number}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Work Area *
            </label>
            <input
              type="text"
              name="Department"
              value={formData.Department}
              onChange={handleInputChange}
              required
              placeholder="e.g., Front Desk, Administration"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="block ml-2 text-sm text-gray-900">
              Active Status
            </label>
          </div>

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingUser(null);
                setFormData({
                  First_Name: '',
                  Last_Name: '',
                  Email_Address: '',
                  Phone_Number: '',
                  Department: '',
                  
                  is_active: true
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {editingUser ? 'Update' : 'Add'} Receptionist
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <div className="bg-white shadow-lg rounded-xl">
        {/* Header with tabs */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-2 pl-10 pr-4 transition-colors border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              </div>
              <button
                onClick={() => {
                  setModalType(activeTab === 'teachers' ? 'teacher' : 'receptionist');
                  setShowAddModal(true);
                  setEditingUser(null);
                }}
                className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                <span>Add {activeTab === 'teachers' ? 'Teacher' : 'Receptionist'}</span>
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors ${
                activeTab === 'teachers'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Teachers ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('receptionists')}
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors ${
                activeTab === 'receptionists'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Receptionists ({receptionists.length})</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Full Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Phone
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  {activeTab === 'teachers' ? 'Department' : 'Work Area'}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {user.First_Name} {user.Last_Name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{user.Email_Address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{user.Phone_Number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{user.Department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-gray-500 transition-colors hover:text-blue-500"
                          title="Edit user"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(user.id);
                            setShowDeleteModal(true);
                          }}
                          className="text-gray-500 transition-colors hover:text-red-500"
                          title="Delete user"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="mt-2 text-lg font-medium">
                        No {activeTab === 'teachers' ? 'teachers' : 'receptionists'} found
                      </div>
                      <div className="text-gray-400">Try adjusting your search criteria</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200 rounded-b-xl">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
            <span className="font-medium">{currentData.length}</span> {activeTab === 'teachers' ? 'teachers' : 'receptionists'}
          </div>
          <div className="flex space-x-1">
            <button className="px-3 py-2 text-sm font-medium text-gray-500 transition-colors border border-gray-300 rounded-md hover:text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-2 text-sm font-medium text-blue-600 transition-colors bg-blue-100 border border-blue-600 rounded-md">
              1
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 transition-colors border border-gray-300 rounded-md hover:text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 transition-colors border border-gray-300 rounded-md hover:text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modals */}
      {showAddModal && modalType === 'teacher' && (
        <AddTeacher
          onTeacherAdded={fetchTeachers}
          closeModal={() => {
            setShowAddModal(false);
            setEditingUser(null);
          }}
          editingTeacher={editingUser}
        />
      )}
      {showAddModal && modalType === 'receptionist' && <ReceptionistForm />}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-600 bg-opacity-50">
          <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Confirm Deletion
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete this {activeTab === 'teachers' ? 'teacher' : 'receptionist'}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(userToDelete)}
                className="px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;