import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Check, User, MapPin, Lock, Eye, EyeOff } from 'lucide-react';

const AddReception = ({ onReceptionAdded, closeModal, editingReception }) => {
  const [receptionForm, setReceptionForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',    
    gender: '',
    
  });
  const [receptionErrors, setReceptionErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (editingReception) {
      setReceptionForm({
        firstName: editingReception.First_Name || '',
        lastName: editingReception.Last_Name || '',
        email: editingReception.Email_Address || '',
        phone: editingReception.Phone_Number || '',        
        gender: editingReception.gender || '',
        
      });
    }
  }, [editingReception]);

  const handleReceptionInputChange = (e) => {
    const { name, value } = e.target;
    setReceptionForm((prev) => ({ ...prev, [name]: value }));
    if (receptionErrors[name]) {
      setReceptionErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
    setSuccessMessage('');
  };

  const validateReceptionForm = () => {
    const newErrors = {};
    if (!receptionForm.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!receptionForm.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!receptionForm.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(receptionForm.email)) newErrors.email = 'Email is invalid';
    if (!receptionForm.phone.trim()) newErrors.phone = 'Phone is required';
    
    if (!receptionForm.gender.trim()) newErrors.gender = 'Gender is required';
    
    setReceptionErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddReception = async () => {
    if (!validateReceptionForm()) return;

    const payload = {
      email: receptionForm.email,
      username: editingReception
        ? editingReception.username
        : `${receptionForm.firstName.toLowerCase()}.${receptionForm.lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
      phone: receptionForm.phone,
      user_type: 'receptionist',
      firstName: receptionForm.firstName,
      lastName: receptionForm.lastName,
      
      gender: receptionForm.gender,
    };

    

    try {
      const url = editingReception
        ? `http://localhost:8000/lms/register/receptionist/${editingReception.id}/`
        : 'http://localhost:8000/lms/register/receptionist/';
      const method = editingReception ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors ? JSON.stringify(data.errors) : `Failed to ${editingReception ? 'update' : 'add'} receptionist`);
      }

      setSuccessMessage(data.message || `Receptionist successfully ${editingReception ? 'updated' : 'added'}!`);
      setApiError('');
      setReceptionForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',        
        gender: '',
        
      });
      setReceptionErrors({});
      closeModal();
      if (onReceptionAdded) onReceptionAdded();
    } catch (error) {
      setApiError(error.message || `Failed to ${editingReception ? 'update' : 'add'} receptionist`);
      setSuccessMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{editingReception ? 'Edit Receptionist' : 'Add New Receptionist'}</h3>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage && <p className="mb-4 text-green-600">{successMessage}</p>}
        {apiError && <p className="mb-4 text-red-600">{apiError}</p>}

        <div className="mb-8">
          <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-800">
            <div className="w-2 h-6 mr-3 bg-blue-500 rounded"></div>
            Receptionist Information
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <User className="inline w-4 h-4 mr-1" />
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={receptionForm.firstName}
                onChange={handleReceptionInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  receptionErrors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter first name"
              />
              {receptionErrors.firstName && <p className="mt-1 text-sm text-red-600">{receptionErrors.firstName}</p>}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <User className="inline w-4 h-4 mr-1" />
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={receptionForm.lastName}
                onChange={handleReceptionInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  receptionErrors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter last name"
              />
              {receptionErrors.lastName && <p className="mt-1 text-sm text-red-600">{receptionErrors.lastName}</p>}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <Mail className="inline w-4 h-4 mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={receptionForm.email}
                onChange={handleReceptionInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  receptionErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="receptionist@example.com"
              />
              {receptionErrors.email && <p className="mt-1 text-sm text-red-600">{receptionErrors.email}</p>}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={receptionForm.phone}
                onChange={handleReceptionInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  receptionErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(555) 123-4567"
              />
              {receptionErrors.phone && <p className="mt-1 text-sm text-red-600">{receptionErrors.phone}</p>}
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Gender *
              </label>
              <select
                name="gender"
                value={receptionForm.gender}
                onChange={handleReceptionInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  receptionErrors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {receptionErrors.gender && <p className="mt-1 text-sm text-red-600">{receptionErrors.gender}</p>}
            </div>
            
          </div>
        </div>

        <div className="flex mt-6 space-x-3">
          <button
            onClick={handleAddReception}
            className="flex items-center justify-center flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Check className="w-4 h-4 mr-2" />
            {editingReception ? 'Update Receptionist' : 'Add Receptionist'}
          </button>
          <button
            onClick={closeModal}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReception;