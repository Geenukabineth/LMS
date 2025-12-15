import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { API_ENDPOINTS, apiCall } from '@/config/apiConfig';

const FriendsList = ({
  friends,
  chats,
  onSelectChat,
  onRemoveFriend,
  onlineUsers,
  onNotification,
}) => {
  const [removingId, setRemovingId] = useState(null);

  const handleStartChat = async (friend) => {
    try {
      const response = await apiCall(API_ENDPOINTS.START_CHAT, {
        method: 'POST',
        body: JSON.stringify({
          user_id: friend.id,
        }),
      });

      if (response) {
        onSelectChat?.(response);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      // Try to find existing chat
      const existingChat = chats.find((c) => c.user?.id === friend.id);
      if (existingChat) {
        onSelectChat?.(existingChat);
      } else {
        onNotification?.({
          type: 'error',
          message: 'Failed to start chat',
        });
      }
    }
  };

  const handleRemoveFriend = async (friendId) => {
    setRemovingId(friendId);
    try {
      await apiCall(API_ENDPOINTS.REMOVE_FRIEND, {
        method: 'POST',
        body: JSON.stringify({
          friend_id: friendId,
        }),
      });

      onNotification?.({
        type: 'success',
        message: 'Friend removed',
      });

      onRemoveFriend?.(friendId);
    } catch (error) {
      console.error('Error removing friend:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to remove friend',
      });
    } finally {
      setRemovingId(null);
    }
  };

  if (friends.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No friends yet.</p>
        <p className="mt-1 text-xs">Send friend requests to get started</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="px-2 mb-2 font-semibold text-gray-700">
        Friends ({friends.length})
      </h3>
      <div className="space-y-2">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center justify-between p-3 mb-2 transition rounded-lg cursor-pointer group hover:bg-gray-100"
            onClick={() => handleStartChat(friend)}
          >
            <div className="flex items-center flex-1 min-w-0 space-x-3">
              <div className="relative flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-full bg-gradient-to-br from-pink-400 to-pink-600">
                  {(friend.full_name || friend.username || 'U')?.[0]?.toUpperCase()}
                </div>
                {onlineUsers.has(friend.id) && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {friend.full_name  || friend.username}
                </p>
                {onlineUsers.has(friend.id) ? (
                  <p className="text-xs text-green-600">Online</p>
                ) : (
                  <p className="text-xs text-gray-500">Offline</p>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFriend(friend.id);
              }}
              disabled={removingId === friend.id}
              className="flex-shrink-0 text-gray-400 transition hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove friend"
            >
              {removingId === friend.id ? (
                <div className="w-4 h-4 border-2 border-red-500 rounded-full border-t-transparent animate-spin"></div>
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsList;