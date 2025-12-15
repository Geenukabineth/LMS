import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { API_ENDPOINTS, apiCall } from '@/config/apiConfig';

const AddFriendModal = ({ isOpen, onClose, onSendRequest, onNotification }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search for users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setAvailableUsers([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        // Using the friends list endpoint with search - adjust based on your backend
        const response = await apiCall(
          `${API_ENDPOINTS.FRIENDSHIPS}?search=${searchQuery}`
        );
        setAvailableUsers(response.results || []);
      } catch (error) {
        console.error('Error searching users:', error);
        onNotification?.({
          type: 'error',
          message: 'Failed to search users',
        });
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, onNotification]);

  const handleSendRequest = async (userId) => {
    try {
      // Send friend request
      const response = await apiCall(API_ENDPOINTS.FRIEND_REQUESTS, {
        method: 'POST',
        body: JSON.stringify({
          to_user: userId,
        }),
      });

      if (response) {
        onNotification?.({
          type: 'success',
          message: 'Friend request sent!',
        });
        onSendRequest?.(userId);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to send friend request',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-6 bg-white rounded-lg shadow-xl w-96">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add Friend</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
        />

        <div className="space-y-2 overflow-y-auto max-h-64">
          {loading && (
            <div className="py-4 text-center text-gray-500">
              <div className="inline-block w-4 h-4 border-2 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="mt-2">Searching...</p>
            </div>
          )}

          {!loading && availableUsers.length === 0 && searchQuery && (
            <p className="py-4 text-center text-gray-500">No users found</p>
          )}

          {!loading && availableUsers.length > 0 && (
            availableUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.full_name  || user.username}
                    </p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSendRequest(user.id)}
                  className="p-2 text-purple-600 transition rounded-lg hover:bg-purple-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;