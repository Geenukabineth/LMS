import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Lock, 
  Loader2, 
  Upload, 
  User, 
  Eye, 
  EyeOff,
  Settings
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/lms'; 

const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('No authentication token found');
  }
  return token;
};

const logoutUser = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.warn('No refresh token found. Clearing local tokens.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      window.location.href = '/login';
      return;
    }

    const response = await fetch(`${API_BASE_URL}/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok || response.status === 205) {
      console.log('Logout successful');
    } else {
      const errorData = await response.json().catch(() => ({
        error: 'Logout failed, no JSON response.',
      }));
      console.error('Logout failed:', errorData);
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = '/login';
  }
};

const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        logoutUser();
        throw new Error('No refresh token available');
      }

      const refreshResponse = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        localStorage.setItem('authToken', refreshData.access);
        
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...defaultHeaders,
            'Authorization': `Bearer ${refreshData.access}`,
          },
        });
        
        return retryResponse;
      } else {
        logoutUser();
        throw new Error('Token refresh failed');
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

const SettingsComponent = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    full_name: '',
    profileImage: null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsSaving(true);
        const token = getAuthToken();
        if (!token) {
          setError('Please log in to view your settings.');
          return;
        }

        const response = await apiRequest(`${API_BASE_URL}/user/me/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          username: data.username || '',
          email: data.email || '',
          phoneNumber: data.phone || '',
          full_name: data.profile?.full_name || data.username || '',
        }));
        
        if (data.profile?.image) {
          const imageUrl = data.profile.image.startsWith('http') 
            ? data.profile.image 
            : `http://localhost:8000${data.profile.image}`;
          setPreviewImage(imageUrl);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message || 'Failed to fetch user data');
      } finally {
        setIsSaving(false);
      }
    };
    fetchUserData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profileImage: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!formData.profileImage || typeof formData.profileImage === 'string') return;

    setIsSaving(true);
    setError(null);

    try {
      const imageData = new FormData();
      imageData.append('image', formData.profileImage);

      const response = await apiRequest(`${API_BASE_URL}/profile/image/upload/`, {
        method: 'POST',
        body: imageData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.image_url.startsWith('http') 
          ? data.image_url 
          : `http://localhost:8000${data.image_url}`;
        setPreviewImage(imageUrl);
        setSuccessMessage('Profile image uploaded successfully');
        setFormData(prev => ({ ...prev, profileImage: null }));
      } else {
        throw new Error('Image upload failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handlePasswordChange = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All password fields are required.');
      setSuccessMessage('');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      setSuccessMessage('');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsSaving(false);
        return;
      }

      const response = await apiRequest(`${API_BASE_URL}/profile/password/change/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Password updated successfully! You will be logged out in 2 seconds.');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        setTimeout(() => {
          logoutUser();
        }, 2000);
      } else {
        const errorData = await response.json();
        let errorMsg = 'Failed to change password. Please check your current password.';

        if (errorData) {
          if (errorData.current_password) {
            errorMsg = errorData.current_password[0];
          } else if (errorData.new_password) {
            errorMsg = errorData.new_password[0];
          } else if (errorData.confirm_password) {
            errorMsg = errorData.confirm_password[0];
          } else if (errorData.detail) {
            errorMsg = errorData.detail;
          } else if (typeof errorData === 'object') {
            const firstKey = Object.keys(errorData)[0];
            if (firstKey) errorMsg = Array.isArray(errorData[firstKey]) ? errorData[firstKey][0] : errorData[firstKey];
          }
        }

        setError(`Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError(`Error: ${err.message || 'Failed to change password'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (activeTab === 'security') {
      handlePasswordChange();
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const profileData = {
        username: formData.username,
        email: formData.email,
        phone: formData.phoneNumber,
        full_name: formData.full_name,
      };

      const endpoints = [
        { url: `${API_BASE_URL}/profile/update/`, method: 'PUT' },
        { url: `${API_BASE_URL}/user/me/`, method: 'PATCH' },
      ];

      let updateSuccess = false;
      for (const endpoint of endpoints) {
        try {
          const response = await apiRequest(endpoint.url, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
          });

          if (response.ok) {
            setSuccessMessage('Profile updated successfully');
            updateSuccess = true;
            break;
          } else {
            console.warn(`Failed ${endpoint.method} to ${endpoint.url}: ${response.status}`);
          }
        } catch (err) {
          console.error(`Error in ${endpoint.method} to ${endpoint.url}:`, err);
        }
      }

      if (!updateSuccess) {
        throw new Error('Failed to update profile on all attempted endpoints');
      }

      await handleImageUpload();

    } catch (err) {
      setError(`Failed to save settings: ${err.message}`);
      console.error('Save settings error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  const renderTabContent = () => {
    if (activeTab === 'general') {
      return (
        <div className="p-6">
          <h3 className="pb-2 mb-6 text-xl font-semibold text-gray-800 border-b">
            General Settings
          </h3>
          <div className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="object-cover w-32 h-32 border-4 border-white rounded-full shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'default-user.jpg';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-32 h-32 bg-indigo-500 border-4 border-white rounded-full shadow-lg">
                    <User size={48} className="text-white" />
                  </div>
                )}
                <label
                  htmlFor="profileImage"
                  className="absolute bottom-0 right-0 p-2 text-white transition-colors bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700"
                >
                  <Upload className="w-5 h-5" />
                </label>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">Upload a new profile picture</p>
            </div>
            <div>
              <label htmlFor="full_name" className="block mb-1 text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block mb-1 text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'security') {
      return (
        <div className="p-6">
          <h3 className="pb-2 mb-6 text-xl font-semibold text-gray-800 border-b">
            Security Settings
          </h3>
          {error && <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg" role="alert">{error}</div>}
          {successMessage && <div className="p-4 mb-4 text-sm text-green-800 bg-green-100 rounded-lg" role="alert">{successMessage}</div>}
          <div className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block mb-1 text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute text-gray-500 right-3 top-3"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="newPassword" className="block mb-1 text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute text-gray-500 right-3 top-3"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute text-gray-500 right-3 top-3"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={isSaving}
              className={`bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold transition-colors duration-200 ease-in-out ${
                isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700 shadow-md'
              }`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>{isSaving ? 'Changing...' : 'Change Password'}</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Settings</h1>

      {activeTab !== 'security' && (
        <>
          {error && <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg" role="alert">{error}</div>}
          {successMessage && <div className="p-4 mb-4 text-sm text-green-800 bg-green-100 rounded-lg" role="alert">{successMessage}</div>}
        </>
      )}

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="lg:w-1/4">
          <div className="p-6 bg-white border border-gray-200 shadow-lg rounded-xl">
            <h2 className="pb-2 mb-4 text-lg font-semibold text-gray-900 border-b">
              Settings Menu
            </h2>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setError(null);
                      setSuccessMessage('');
                    }}
                    className={`w-full text-left flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ease-in-out ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="overflow-hidden bg-white border border-gray-200 shadow-lg rounded-xl">
            {renderTabContent()}
            {activeTab !== 'security' && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold transition-colors duration-200 ease-in-out ${
                    isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700 shadow-md'
                  }`}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;