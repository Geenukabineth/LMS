import React, { useEffect, useState, useCallback } from 'react';
import { Search, Edit3, Trash, Users, X, Plus, Mail, Phone, Check } from 'lucide-react';
import { userService } from '@/config/user.config';

// --- Internal AddTeacher Component ---
const AddTeacher = ({ onTeacherAdded, closeModal, editingTeacher }) => {
  const [teacherForm, setTeacherForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    gender: '',
  });
  const [teacherErrors, setTeacherErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync form when editingTeacher changes
  useEffect(() => {
    if (editingTeacher) {
      setTeacherForm({
        firstName: editingTeacher.First_Name || '',
        lastName: editingTeacher.Last_Name || '',
        email: editingTeacher.Email_Address || '',
        phone: editingTeacher.Phone_Number || '',
        department: editingTeacher.Department || '',
        gender: editingTeacher.gender || '',
      });
    }
  }, [editingTeacher]);

  const handleTeacherInputChange = (e) => {
    const { name, value } = e.target;
    setTeacherForm((prev) => ({ ...prev, [name]: value }));
    if (teacherErrors[name]) setTeacherErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validateTeacherForm = () => {
    const newErrors = {};
    if (!teacherForm.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!teacherForm.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!teacherForm.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(teacherForm.email)) newErrors.email = 'Email is invalid';
    if (!teacherForm.phone.trim()) newErrors.phone = 'Phone is required';
    if (!teacherForm.department.trim()) newErrors.department = 'Department is required';
    if (!teacherForm.gender.trim()) newErrors.gender = 'Gender is required';
    setTeacherErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTeacher = async () => {
    if (!validateTeacherForm()) return;

    setIsLoading(true);

    // FIX: Generate the required username from First Name + Last Name
    const generatedUsername = `${teacherForm.firstName}${teacherForm.lastName}`
      .toLowerCase()
      .replace(/\s+/g, ''); // Removes any spaces

    const payload = {
      email: teacherForm.email,
      phone: teacherForm.phone,
      firstName: teacherForm.firstName,
      lastName: teacherForm.lastName,
      department: teacherForm.department,
      gender: teacherForm.gender,
      username: generatedUsername, // satisfy User model requirement
    };

    try {
      if (editingTeacher) {
        // Use the ID from the teacher object for the URL
        await userService.putTeacherList(editingTeacher.id, payload);
      } else {
        // Create new teacher record
        await userService.postTeacherList(payload);
      }

      setSuccessMessage(`Teacher successfully ${editingTeacher ? 'updated' : 'added'}!`);
      setTimeout(() => {
        closeModal();
        if (onTeacherAdded) onTeacherAdded();
      }, 1500);
    } catch (error) {
      // Extract specific field errors from Django Response if available
      const errorData = error.response?.data;
      if (typeof errorData === 'object') {
        // Join errors like "Username already exists" or "Email already exists"
        setApiError(Object.values(errorData).flat().join(", "));
      } else {
        setApiError(error.message || "Operation failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] p-6 overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600" disabled={isLoading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage && <div className="p-3 mb-4 border border-green-200 rounded-lg bg-green-50 text-green-600">{successMessage}</div>}
        {apiError && <div className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50 text-red-600 font-medium">{apiError}</div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">First Name *</label>
            <input type="text" name="firstName" value={teacherForm.firstName} onChange={handleTeacherInputChange} disabled={isLoading} className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 transition-colors ${teacherErrors.firstName ? 'border-red-500' : 'border-gray-300'}`} />
            {teacherErrors.firstName && <p className="mt-1 text-sm text-red-600">{teacherErrors.firstName}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Last Name *</label>
            <input type="text" name="lastName" value={teacherForm.lastName} onChange={handleTeacherInputChange} disabled={isLoading} className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 transition-colors ${teacherErrors.lastName ? 'border-red-500' : 'border-gray-300'}`} />
            {teacherErrors.lastName && <p className="mt-1 text-sm text-red-600">{teacherErrors.lastName}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700"><Mail className="inline w-4 h-4 mr-1" />Email *</label>
            <input type="email" name="email" value={teacherForm.email} onChange={handleTeacherInputChange} disabled={isLoading} className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 transition-colors ${teacherErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
            {teacherErrors.email && <p className="mt-1 text-sm text-red-600">{teacherErrors.email}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700"><Phone className="inline w-4 h-4 mr-1" />Phone *</label>
            <input type="tel" name="phone" value={teacherForm.phone} onChange={handleTeacherInputChange} disabled={isLoading} className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 transition-colors ${teacherErrors.phone ? 'border-red-500' : 'border-gray-300'}`} />
            {teacherErrors.phone && <p className="mt-1 text-sm text-red-600">{teacherErrors.phone}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Department *</label>
            <input type="text" name="department" value={teacherForm.department} onChange={handleTeacherInputChange} disabled={isLoading} className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 transition-colors ${teacherErrors.department ? 'border-red-500' : 'border-gray-300'}`} />
            {teacherErrors.department && <p className="mt-1 text-sm text-red-600">{teacherErrors.department}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Gender *</label>
            <select name="gender" value={teacherForm.gender} onChange={handleTeacherInputChange} disabled={isLoading} className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 transition-colors ${teacherErrors.gender ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {teacherErrors.gender && <p className="mt-1 text-sm text-red-600">{teacherErrors.gender}</p>}
          </div>
        </div>

        <div className="flex mt-8 space-x-3">
          <button onClick={handleAddTeacher} disabled={isLoading} className="flex-1 px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:bg-gray-400">
            <Check className="w-4 h-4 mr-2" />
            {isLoading ? 'Processing...' : (editingTeacher ? 'Update Teacher' : 'Add Teacher')}
          </button>
          <button onClick={closeModal} className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Panel Component ---
const UserManagementPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const loadTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const teacherData = await userService.getTeacherList(); 
      setTeachers(teacherData);
    } catch (err) {
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeachers(); }, [loadTeachers]);

  const handleDelete = async (userId) => {
    try {
      await userService.deleteTeacherList(userId); 
      loadTeachers();
      setShowDeleteModal(false);
    } catch (err) {
      setError("Delete failed.");
    }
  };

  const filteredUsers = teachers.filter(u => 
    u.First_Name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.Last_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Teacher Management</h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search teachers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button onClick={() => { setEditingUser(null); setShowAddModal(true); }} className="bg-blue-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all">
              <Plus className="w-4 h-4" /> Add Teacher
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 text-left">Full Name</th>
                <th className="px-6 py-4 text-left">Contact Info</th>
                <th className="px-6 py-4 text-left">Department</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Loading teachers...</td></tr>
              ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.First_Name} {user.Last_Name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.Email_Address}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user.Phone_Number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{user.Department}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingUser(user); setShowAddModal(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => { setUserToDelete(user.id); setShowDeleteModal(true); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No teachers found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddTeacher onTeacherAdded={loadTeachers} closeModal={() => setShowAddModal(false)} editingTeacher={editingUser} />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Delete Teacher?</h3>
            <p className="text-gray-500 mb-6">This action cannot be undone. Are you sure you want to remove this user from the system?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
              <button onClick={() => handleDelete(userToDelete)} className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;