import React, { useState } from 'react';
import { MoreVertical, Trash2 } from 'lucide-react';
import notificationConfig from "@/config/notification.config";

const ChatHeader = ({ selectedChat, onlineUsers, onDeleteChat, onNotification }) => {
  const [showMenu, setShowMenu] = useState(false);

  if (!selectedChat) return null;

  const isGroup = !!selectedChat.name;
  
  // ✅ FIX: Use 'other_user' for direct chats
  const friend = selectedChat.other_user || selectedChat.user;
  
  // Determine name and image based on Group vs Direct Chat
  const participantName = isGroup ? selectedChat.name : (friend?.full_name || friend?.username);
  
  const displayImage = isGroup ? selectedChat.group_image : friend?.display_image;
  const imageUrl = displayImage?.startsWith('http') 
    ? displayImage 
    : displayImage ? `http://localhost:8000${displayImage}` : null;

  const isOnline = !isGroup && friend && onlineUsers.has(friend.id);

  const handleLeaveGroup = async () => {
    // ... (keep existing logic) ...
  };

  return (
    <div className="flex items-center justify-between p-4 text-white shadow-md bg-gradient-to-r from-purple-600 to-purple-700">
      <div className="flex items-center space-x-4">
        <div className="relative">
          {/* ✅ FIX: Image Display Logic */}
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={participantName} 
              className="object-cover w-12 h-12 border-2 border-white rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 font-bold text-purple-600 bg-white rounded-full">
              {participantName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          
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
               {/* ... (Menu items remain same) ... */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;