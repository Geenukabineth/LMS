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
    <div className="p-8 mx-auto max-w-7xl">
      {success && (
        <div className="flex items-center justify-between p-4 mb-4 text-green-700 bg-green-100 border border-green-200 rounded-lg">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="overflow-hidden bg-white border border-gray-100 shadow-lg rounded-xl">
        <div className="flex flex-col gap-4 p-6 mb-6 text-white rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
          <h2 className="text-2xl font-bold text-white uppercase">Receptionists</h2>
          <div className="flex items-center w-full gap-3 md:w-auto">
             <div className="relative flex-1">
                <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full py-2 pl-10 pr-4 text-black border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
            <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-orange-600 rounded-lg hover:bg-red-600">
              <Plus className="w-5 h-5" />
              <span>Add Reception</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Full Name', 'Gender', 'Email', 'Phone', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-left text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="py-10 text-center text-gray-400">Loading...</td></tr>
              ) : filteredReceptionists.map((receptionist, index) => (
                <tr key={receptionist.id || index} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{receptionist.First_Name} {receptionist.Last_Name}</td>
                  <td className="px-6 py-4 text-sm capitalize">{receptionist.gender}</td>
                  <td className="px-6 py-4 text-sm">{receptionist.Email_Address}</td>
                  <td className="px-6 py-4 text-sm">{receptionist.Phone_Number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${receptionist.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {receptionist.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="flex px-6 py-4 space-x-3 text-sm">
                    <button onClick={() => handleEdit(receptionist.id)} className="p-1 text-orange-600 transition-colors rounded hover:bg-orange-50"><Edit3 className="w-4 h-4" /></button>
                    {/* FIXED: OnClick only sets the state and opens modal */}
                    <button 
                      onClick={() => { setUserToDelete(receptionist.id); setShowDeleteModal(true); }} 
                      className="p-1 text-red-600 transition-colors rounded hover:bg-red-50"
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
          <div className="w-full max-w-sm p-6 text-center bg-white shadow-2xl rounded-xl">
            <div className="flex justify-center mb-4">
              <div className="p-3 text-red-600 bg-red-100 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Are you sure?</h3>
            <p className="mb-6 text-gray-500">This will permanently delete the receptionist record. This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }} 
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white shadow-2xl rounded-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold">{editingId ? 'Edit' : 'Add'} Receptionist</h3>
              <button onClick={closeModal} className="p-1 transition-colors rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 text-sm text-red-600 border border-red-100 rounded-lg bg-red-50">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">First Name</label>
                  <input name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full p-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Last Name</label>
                  <input name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full p-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Username (Auto-generated)</label>
                <input name="username" value={formData.username} readOnly className="w-full p-2 mt-1 text-gray-500 border rounded-lg cursor-not-allowed bg-gray-50" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} required className="w-full p-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full p-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                <input type="tel" name="Phone_Number" value={formData.Phone_Number} onChange={handleInputChange} required className="w-full p-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div className="flex justify-end pt-4 space-x-3 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50">
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