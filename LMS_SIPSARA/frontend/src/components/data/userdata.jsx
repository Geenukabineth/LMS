import React, { useEffect, useState, useCallback } from 'react';
import { Search, Edit3, Trash, Users, UserCheck, X, Plus, Mail, Phone } from 'lucide-react';
import AddTeacher from '@/components/SUadmin/teacheradd';
import AddReceptionist from '@/components/SUadmin/receptionist'; // Added import
import { userService } from '@/config/user.config';

const UserManagementPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teachers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('teacher'); 
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // --- Data Fetching Functions ---
  const loadTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const teacherData = await userService.getTeacherList();
      setTeachers(teacherData);
      setError(null);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setTeachers([]);
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReceptionists = useCallback(async () => {
    try {
      setLoading(true);
      const receptionistData = await userService.getReceptionistList();
      setReceptionists(receptionistData);
      setError(null);
    } catch (err) {
      console.error("Error fetching receptionists:", err);
      setReceptionists([]);
      setError("Failed to load receptionists.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (activeTab === 'teachers') {
      loadTeachers();
    } else {
      fetchReceptionists();
    }
  }, [activeTab, loadTeachers, fetchReceptionists]);

  // --- Handlers ---
  const handleDelete = async (userId) => {
    try {
      if (activeTab === 'teachers') {
        await userService.deleteTeacherList(userId);
      } else {
        await userService.deleteReceptionistList(userId);
      }

      // Refresh data after deletion
      if (activeTab === 'teachers') {
        loadTeachers();
      } else {
        fetchReceptionists();
      }
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      setError(error.message || "Failed to delete user.");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setModalType(activeTab === 'teachers' ? 'teacher' : 'receptionist');
    setShowAddModal(true);
  };

  const currentData = activeTab === 'teachers' ? teachers : receptionists;

  const filteredUsers = currentData.filter((user) =>
    user && user.First_Name && user.First_Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && teachers.length === 0 && receptionists.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading users...</div>;
  }

  return (
    <div className="p-8">
      {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}
      
      <div className="bg-white shadow-lg rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="py-2 pl-10 pr-4 border border-gray-300 rounded-md" 
                />
                <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              </div>
              <button 
                onClick={() => { 
                  setModalType(activeTab === 'teachers' ? 'teacher' : 'receptionist'); 
                  setShowAddModal(true); 
                  setEditingUser(null); 
                }} 
                className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-md"
              >
                <Plus className="w-5 h-5" />
                <span>Add {activeTab === 'teachers' ? 'Teacher' : 'Receptionist'}</span>
              </button>
            </div>
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTab('teachers')} 
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'teachers' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
            >
              <Users className="w-4 h-4" />
              <span>Teachers ({teachers.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('receptionists')} 
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'receptionists' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Receptionists ({receptionists.length})</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Full Name</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">{activeTab === 'teachers' ? 'Department' : ''}</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.First_Name} {user.Last_Name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500"><Mail className="inline w-4 h-4 mr-2" />{user.Email_Address}</td>
                    <td className="px-6 py-4 text-sm text-gray-500"><Phone className="inline w-4 h-4 mr-2" />{user.Phone_Number}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.Department}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-3">
                        <button onClick={() => handleEdit(user)} className="text-gray-500 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => { setUserToDelete(user.id); setShowDeleteModal(true); }} className="text-gray-500 hover:text-red-500"><Trash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="py-10 text-center text-gray-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Conditional Modal Rendering --- */}
      {showAddModal && modalType === 'teacher' && (
        <AddTeacher 
          onTeacherAdded={loadTeachers} 
          closeModal={() => { setShowAddModal(false); setEditingUser(null); }} 
          editingTeacher={editingUser} 
        />
      )}

      {showAddModal && modalType === 'receptionist' && (
        <AddReceptionist 
          onReceptionistAdded={fetchReceptionists} 
          closeModal={() => { setShowAddModal(false); setEditingUser(null); }} 
          editingReceptionist={editingUser} 
        />
      )}

      {/* --- Delete Confirmation Modal --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-600 bg-opacity-50">
          <div className="w-full max-w-sm p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold">Confirm Deletion</h3>
            <p className="mb-6 text-sm text-gray-600">Are you sure you want to delete this {activeTab === 'teachers' ? 'teacher' : 'receptionist'}?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md">Cancel</button>
              <button onClick={() => handleDelete(userToDelete)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;