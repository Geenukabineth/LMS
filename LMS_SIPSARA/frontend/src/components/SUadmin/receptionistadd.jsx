import React, { useEffect, useState, useCallback } from 'react';
import { Search, Edit3, Trash, X, Plus, Mail, Phone, Loader2, Users, AlertTriangle } from 'lucide-react';

import { userService } from '@/config/user.config';

const ReceptionistManagementPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [receptionists, setreceptionists] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const initialFormState = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    Phone_Number: '',
    gender: '', 
    is_active: true
  };

  const [formData, setFormData] = useState(initialFormState);

  const loadReceptionists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getReceptionistList();
      setreceptionists(data); 
      setError(null);
    } catch (err) {
      console.error("Error fetching receptionists:", err);
      setreceptionists([]);
      setError("Failed to load receptionists.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceptionists();
  }, [loadReceptionists]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'firstName' || name === 'lastName') {
        newState.username = `${newState.firstName}${newState.lastName}`.toLowerCase().replace(/\s+/g, '');
      }
      return newState;
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormState);
    setError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        await userService.putReceptionistList(editingId, formData);
        setSuccess('Receptionist updated successfully!');
      } else {
        await userService.postReceptionistList(formData);
        setSuccess('Receptionist added successfully!');
      }
      await loadReceptionists();
      closeModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        const firstErr = Object.values(errorData)[0];
        setError(Array.isArray(firstErr) ? firstErr[0] : "Check form fields.");
      } else {
        setError("An error occurred during submission.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      // Logic for fetching individual data if needed or filtering from state
      const resData = receptionists.find(r => r.id === id);
      if (!resData) return;

      setFormData({
        firstName: resData.First_Name || '',
        lastName: resData.Last_Name || '',
        username: resData.username || `${resData.First_Name}${resData.Last_Name}`.toLowerCase(),
        email: resData.Email_Address || '',
        Phone_Number: resData.Phone_Number || '',
        gender: resData.gender ? resData.gender.toLowerCase() : '',
        is_active: resData.is_active ?? true
      });
      
      setEditingId(id);
      setShowModal(true);
    } catch (err) {
      setError("Failed to load receptionist details.");
    }
  };

  // FIXED: This function now only handles the API call
  const confirmDelete = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      await userService.deleteReceptionistList(userToDelete);
      setSuccess('Deleted successfully!');
      await loadReceptionists();
      setShowDeleteModal(false);
      setUserToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReceptionists = Array.isArray(receptionists) ? receptionists.filter((r) => {
    const searchable = `${r.First_Name} ${r.Last_Name} ${r.Email_Address}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  }) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {success && (
        <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-lg flex justify-between items-center border border-green-200">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Receptionists</h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
            <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Full Name', 'Gender', 'Email', 'Phone', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : filteredReceptionists.map((receptionist, index) => (
                <tr key={receptionist.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{receptionist.First_Name} {receptionist.Last_Name}</td>
                  <td className="px-6 py-4 text-sm capitalize">{receptionist.gender}</td>
                  <td className="px-6 py-4 text-sm">{receptionist.Email_Address}</td>
                  <td className="px-6 py-4 text-sm">{receptionist.Phone_Number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${receptionist.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {receptionist.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex space-x-3">
                    <button onClick={() => handleEdit(receptionist.id)} className="p-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    {/* FIXED: OnClick only sets the state and opens modal */}
                    <button 
                      onClick={() => { setUserToDelete(receptionist.id); setShowDeleteModal(true); }} 
                      className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h3>
            <p className="text-gray-500 mb-6">This will permanently delete the receptionist record. This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }} 
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingId ? 'Edit' : 'Add'} Receptionist</h3>
              <button onClick={closeModal} className="hover:bg-gray-100 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">First Name</label>
                  <input name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Last Name</label>
                  <input name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Username (Auto-generated)</label>
                <input name="username" value={formData.username} readOnly className="w-full mt-1 p-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} required className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                <input type="tel" name="Phone_Number" value={formData.Phone_Number} onChange={handleInputChange} required className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistManagementPanel;