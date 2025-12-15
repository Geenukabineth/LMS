import React, { useState } from 'react';
import { Phone, Video, MoreVertical, Trash2 } from 'lucide-react';
import { API_ENDPOINTS, apiCall } from '@/config/apiConfig';

const ChatHeader = ({ selectedChat, onlineUsers, onDeleteChat, onNotification }) => {
  const [showMenu, setShowMenu] = useState(false);

  if (!selectedChat) return null;

  const isGroup = !!selectedChat.name;
  const isOnline = !isGroup && onlineUsers.has(selectedChat.user?.id);
  const participantName = selectedChat.name || selectedChat.user?.full_name  || selectedChat.user?.username;

  const handleLeaveGroup = async () => {
    if (!isGroup || !selectedChat.id) return;

    try {
      await apiCall(API_ENDPOINTS.GROUP_LEAVE(selectedChat.id), {
        method: 'POST',
      });

      onNotification?.({
        type: 'success',
        message: 'Left the group',
      });

      onDeleteChat?.(selectedChat.id);
      setShowMenu(false);
    } catch (error) {
      console.error('Error leaving group:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to leave group',
      });
    }
  };

  const handleCallClick = () => {
    onNotification?.({
      type: 'info',
      message: 'Voice call feature coming soon',
    });
  };

  const handleVideoClick = () => {
    onNotification?.({
      type: 'info',
      message: 'Video call feature coming soon',
    });
  };

  return (
    <div className="flex items-center justify-between p-4 text-white shadow-md bg-gradient-to-r from-purple-600 to-purple-700">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="flex items-center justify-center w-12 h-12 font-bold bg-purple-400 rounded-full">
            {participantName?.[0]?.toUpperCase() || '?'}
          </div>
          {!isGroup && isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold">{participantName}</h2>
          <p className="text-sm text-purple-200">
            {isGroup
              ? `${selectedChat.members?.length || 0} members`
              : isOnline
              ? 'Online'
              : 'Offline'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={handleCallClick}
          className="p-2 transition rounded-lg hover:bg-purple-500"
          title="Voice call"
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          onClick={handleVideoClick}
          className="p-2 transition rounded-lg hover:bg-purple-500"
          title="Video call"
        >
          <Video className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 transition rounded-lg hover:bg-purple-500"
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 z-50 mt-2 text-gray-900 bg-white rounded-lg shadow-lg min-w-max">
              {isGroup && (
                <button
                  onClick={handleLeaveGroup}
                  className="flex items-center w-full gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Leave Group
                </button>
              )}
              {!isGroup && (
                <button
                  onClick={() => {
                    onNotification?.({
                      type: 'info',
                      message: 'Block user feature coming soon',
                    });
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full gap-2 px-4 py-2 text-left hover:bg-gray-100"
                >
                  Block User
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;