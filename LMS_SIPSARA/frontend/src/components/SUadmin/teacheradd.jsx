import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Check } from 'lucide-react';

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

  // FIX: Use import.meta.env for Vite instead of process.env
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    if (teacherErrors[name]) {
      setTeacherErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
    setSuccessMessage('');
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
    const payload = {
      email: teacherForm.email,
      username: editingTeacher
        ? editingTeacher.username
        : `${teacherForm.firstName.toLowerCase()}.${teacherForm.lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
      phone: teacherForm.phone,
      user_type: 'instructor',
      firstName: teacherForm.firstName,
      lastName: teacherForm.lastName,
      department: teacherForm.department,
      gender: teacherForm.gender,
    };

    try {
      // Use correct endpoint based on fixed urls.py
      const url = editingTeacher
        ? `${API_BASE_URL}/lms/register/teacher/${editingTeacher.user}/`
        : `${API_BASE_URL}/lms/register/teacher/`;
      const method = editingTeacher ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.errors 
            ? JSON.stringify(data.errors) 
            : data.message 
            ? data.message
            : `Failed to ${editingTeacher ? 'update' : 'add'} teacher`
        );
      }

      setSuccessMessage(data.message || `Teacher successfully ${editingTeacher ? 'updated' : 'added'}!`);
      setApiError('');
      setTeacherForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        gender: '',
      });
      setTeacherErrors({});
      
      // Close modal after success
      setTimeout(() => {
        closeModal();
        if (onTeacherAdded) onTeacherAdded();
      }, 1500);
    } catch (error) {
      setApiError(error.message || `Failed to ${editingTeacher ? 'update' : 'add'} teacher`);
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
          <button 
            onClick={closeModal} 
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage && (
          <div className="p-3 mb-4 border border-green-200 rounded-lg bg-green-50">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}
        {apiError && (
          <div className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-600">{apiError}</p>
          </div>
        )}

        <div className="mb-8">
          <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-800">
            <div className="w-2 h-6 mr-3 bg-blue-500 rounded"></div>
            Teacher Information
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={teacherForm.firstName}
                onChange={handleTeacherInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 ${
                  teacherErrors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter first name"
              />
              {teacherErrors.firstName && <p className="mt-1 text-sm text-red-600">{teacherErrors.firstName}</p>}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={teacherForm.lastName}
                onChange={handleTeacherInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 ${
                  teacherErrors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter last name"
              />
              {teacherErrors.lastName && <p className="mt-1 text-sm text-red-600">{teacherErrors.lastName}</p>}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <Mail className="inline w-4 h-4 mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={teacherForm.email}
                onChange={handleTeacherInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 ${
                  teacherErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="teacher@example.com"
              />
              {teacherErrors.email && <p className="mt-1 text-sm text-red-600">{teacherErrors.email}</p>}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={teacherForm.phone}
                onChange={handleTeacherInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 ${
                  teacherErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(555) 123-4567"
              />
              {teacherErrors.phone && <p className="mt-1 text-sm text-red-600">{teacherErrors.phone}</p>}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={teacherForm.department}
                onChange={handleTeacherInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 ${
                  teacherErrors.department ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Computer Science"
              />
              {teacherErrors.department && <p className="mt-1 text-sm text-red-600">{teacherErrors.department}</p>}
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Gender *
              </label>
              <select
                name="gender"
                value={teacherForm.gender}
                onChange={handleTeacherInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 ${
                  teacherErrors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {teacherErrors.gender && <p className="mt-1 text-sm text-red-600">{teacherErrors.gender}</p>}
            </div>
          </div>
        </div>

        <div className="flex mt-6 space-x-3">
          <button
            onClick={handleAddTeacher}
            disabled={isLoading}
            className="flex items-center justify-center flex-1 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Check className="w-4 h-4 mr-2" />
            {isLoading ? 'Processing...' : (editingTeacher ? 'Update Teacher' : 'Add Teacher')}
          </button>
          <button
            onClick={closeModal}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 transition-colors bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTeacher;