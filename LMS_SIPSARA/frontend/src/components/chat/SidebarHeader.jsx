import React, { useState, useEffect } from 'react';
import { Search, LogOut, Settings } from 'lucide-react';
// import { API_ENDPOINTS, apiCall } from '@/config/apiConfig';

const SidebarHeader = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onLogout,
  unreadCount = 0,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user info (optional)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          // You can fetch user info from your backend
          // For now, just get from localStorage if stored
          const userData = localStorage.getItem('user');
          if (userData) {
            setCurrentUser(JSON.parse(userData));
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    onLogout?.();
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
      {/* Header with title and user menu */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Messages</h1>

        {/* User menu button */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-center w-10 h-10 text-white transition bg-purple-500 rounded-full hover:bg-purple-400"
            title="User menu"
          >
            {currentUser?.full_name ?.[0]?.toUpperCase() || 'U'}
          </button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 z-50 mt-2 text-gray-900 bg-white rounded-lg shadow-lg min-w-max">
              {currentUser && (
                <>
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold">{currentUser.full_name }</p>
                    <p className="text-xs text-gray-500">{currentUser.email}</p>
                  </div>
                </>
              )}

              <button
                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left hover:bg-gray-100"
                title="Settings (coming soon)"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-600 border-t border-gray-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
        <input
          type="text"
          placeholder="Search users or groups..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full py-2 pl-10 pr-4 text-white placeholder-purple-200 bg-purple-500 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* Tabs */}
      <div className="flex p-1 space-x-1 bg-purple-500 rounded-full">
        <button
          onClick={() => onTabChange('chats')}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition relative ${
            activeTab === 'chats'
              ? 'bg-white text-purple-600'
              : 'text-white hover:bg-purple-400'
          }`}
        >
          Chats
          {unreadCount > 0 && (
            <span className="absolute top-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full right-2">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('friends')}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition ${
            activeTab === 'friends'
              ? 'bg-white text-purple-600'
              : 'text-white hover:bg-purple-400'
          }`}
        >
          Friends
        </button>

        <button
          onClick={() => onTabChange('groups')}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition ${
            activeTab === 'groups'
              ? 'bg-white text-purple-600'
              : 'text-white hover:bg-purple-400'
          }`}
        >
          Groups
        </button>
      </div>
    </div>
  );
};

export default SidebarHeader;