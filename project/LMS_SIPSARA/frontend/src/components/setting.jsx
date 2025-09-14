import React, { useState, useCallback, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Save, 
  X, 
  Check, 
  Camera, 
  Lock, 
  Mail, 
  Smartphone, 
  Eye, 
  Moon, 
  AlertTriangle, 
  Upload,
  Trash2,
  Key,
  Globe,
  Zap
} from 'lucide-react';

const SettingsPanel = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: '',
    phone: '',
    
  });

  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    emailUpdates: true,
    twoFactor: false,
    publicProfile: true,
    marketingEmails: false,
    desktopNotifications: true,
    soundEffects: true,
    autoSave: true
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowDeleteConfirm(false);
        setShowAvatarModal(false);
      }
    };



    if (showDeleteConfirm || showAvatarModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDeleteConfirm, showAvatarModal]);

  // Validation
  const validateProfile = useCallback((profileData) => {
    const newErrors = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (profileData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (profileData.bio.length > 300) {
      newErrors.bio = 'Bio must be less than 300 characters';
    }
    
    return newErrors;
  }, []);

  const handleProfileChange = useCallback((field, value) => {
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);
    setHasChanges(true);
    
    const newErrors = validateProfile(newProfile);
    setErrors(newErrors);
  }, [profile, validateProfile]);

  const handleSettingToggle = useCallback((setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    const validationErrors = validateProfile(profile);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowSuccess(true);
      setHasChanges(false);
      setErrors({});
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setProfile({
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      bio: 'UX Designer passionate about creating intuitive and accessible digital experiences.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      phone: '+1 (555) 123-4567',
     
    });
    setSettings({
      notifications: true,
      darkMode: false,
      emailUpdates: true,
      twoFactor: false,
      publicProfile: true,
      marketingEmails: false,
      desktopNotifications: true,
      soundEffects: true,
      autoSave: true
    });
    setHasChanges(false);
    setErrors({});
  }, []);

  const handleAvatarUpload = (newAvatar) => {
    handleProfileChange('avatar', newAvatar);
    setShowAvatarModal(false);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    alert('Account would be deleted - this is just a demo!');
  };

  // Components
  const Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-sm w-full',
      md: 'max-w-md w-full',
      lg: 'max-w-lg w-full',
      xl: 'max-w-3xl w-full',
      full: 'w-full h-full'
    };
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className={`bg-white rounded-3xl p-8 ${sizeClasses[size]} shadow-2xl transform transition-all`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const ToggleSwitch = ({ active, onClick, disabled = false }) => (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
        active 
          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg' 
          : 'bg-gray-300 hover:bg-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
        active ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  );

  const InputField = ({ label, icon: Icon, error, ...props }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        {label}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-4 hover:border-gray-300 bg-gray-50 focus:bg-white ${
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
        }`}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, color: 'from-blue-500 to-indigo-600' },
    { id: 'privacy', label: 'Privacy', icon: Shield, color: 'from-green-500 to-emerald-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-orange-500 to-red-600' },
    { id: 'advanced', label: 'Advanced', icon: Zap, color: 'from-purple-500 to-pink-600' }
  ];

  const settingsGroups = {
    notifications: [
      { key: 'notifications', title: 'Push Notifications', desc: 'Receive real-time updates and alerts', icon: Smartphone },
      { key: 'emailUpdates', title: 'Email Digest', desc: 'Weekly summary of your activity and updates', icon: Mail },
      { key: 'desktopNotifications', title: 'Desktop Alerts', desc: 'Show notifications on your desktop', icon: Bell },
      { key: 'marketingEmails', title: 'Marketing Communications', desc: 'Receive product updates and promotions', icon: Globe }
    ],
    privacy: [
      { key: 'publicProfile', title: 'Public Profile', desc: 'Make your profile visible to other users', icon: Eye },
      { key: 'twoFactor', title: 'Two-Factor Authentication', desc: 'Secure your account with 2FA', icon: Lock }
    ],
    advanced: [
      { key: 'darkMode', title: 'Dark Theme', desc: 'Use dark mode for comfortable viewing', icon: Moon },
      { key: 'soundEffects', title: 'Sound Effects', desc: 'Play sounds for interactions and notifications', icon: Zap },
      { key: 'autoSave', title: 'Auto-save Changes', desc: 'Automatically save your work as you type', icon: Save }
    ]
  };

  const avatarOptions = [
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Account Settings
              </h1>
              <p className="text-gray-600 mt-1 text-sm">Manage your account preferences and security</p>
            </div>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Unsaved changes</span>
            </div>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="flex items-center gap-3 bg-green-100 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-sm">Your settings have been saved successfully!</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="relative">
                <img 
                  src={profile.avatar} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h2>
                <p className="text-gray-600 mb-4 text-sm">{profile.email}</p>
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border-2 border-blue-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-medium text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Change Photo
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Full Name"
                icon={User}
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                placeholder="Enter your full name"
                error={errors.name}
              />

              <InputField
                label="Email Address"
                icon={Mail}
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                placeholder="Enter your email"
                error={errors.email}
              />

              <InputField
                label="Phone Number"
                icon={Smartphone}
                type="tel"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />

          
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                Bio ({profile.bio.length}/300)
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-4 hover:border-gray-300 bg-gray-50 focus:bg-white resize-none ${
                  errors.bio 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
                placeholder="Tell us about yourself..."
              />
              {errors.bio && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.bio}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Settings Tabs */}
        {(['privacy', 'notifications', 'advanced'].includes(activeTab)) && (
          <div className="space-y-4">
            {settingsGroups[activeTab]?.map((setting) => {
              const Icon = setting.icon;
              return (
                <div 
                  key={setting.key} 
                  className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{setting.title}</h3>
                      <p className="text-gray-600 mt-1 text-sm">{setting.desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch 
                    active={settings[setting.key]} 
                    onClick={() => handleSettingToggle(setting.key)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={handleSave}
          disabled={isLoading || Object.keys(errors).length > 0}
          className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isLoading ? 'Saving Changes...' : 'Save All Changes'}
        </button>
        
        
        
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed sm:ml-auto text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Your Account?"
        size="lg"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-600 text-sm">
            This action cannot be undone. All your data, settings, and content will be permanently deleted
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={confirmDelete}
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold text-sm"
          >
            Yes, Delete Account
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold text-sm"
          >
            Keep Account
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPanel;