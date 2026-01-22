import React, { useState, useEffect } from 'react';
import { MoreVertical, Trash2, Ban, UserCheck } from 'lucide-react'; 
import notificationConfig from "@/config/notification.config";

const ChatHeader = ({ selectedChat, onlineUsers, onDeleteChat, onNotification }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockRecordId, setBlockRecordId] = useState(null);

  if (!selectedChat) return null;

  const isGroup = !!selectedChat.name;
  
  
  const friend = selectedChat.other_user || selectedChat.user;
  
  const participantName = isGroup ? selectedChat.name : (friend?.full_name || friend?.username);
  
  const displayImage = isGroup ? selectedChat.group_image : friend?.display_image;
  const imageUrl = displayImage?.startsWith('http') 
    ? displayImage 
    : displayImage ? `http://localhost:8000${displayImage}` : null;

  const isOnline = !isGroup && friend && onlineUsers.has(friend.id);

  
  useEffect(() => {
    if (isGroup || !friend) return;

    const checkBlockStatus = async () => {
      try {
        const response = await notificationConfig.BLOCKED_USERS();
        const blockedList = response.results || response; 
        
        const blockedEntry = blockedList.find(item => item.blocked_user.id === friend.id);
        
        if (blockedEntry) {
          setIsBlocked(true);
          setBlockRecordId(blockedEntry.id); 
        } else {
          setIsBlocked(false);
          setBlockRecordId(null);
        }
      } catch (error) {
        console.error("Error checking block status:", error);
      }
    };

    checkBlockStatus();
  }, [selectedChat, friend, isGroup]);

  const handleLeaveGroup = async () => {
  
  };

  
  const handleBlockUser = async () => {
    if (!friend) return;
    try {
      await notificationConfig.BLOCK_USER({ blocked_user_id: friend.id });
      setIsBlocked(true);
      setShowMenu(false);
      
      const response = await notificationConfig.BLOCKED_USERS();
      const list = response.results || response;
      const entry = list.find(item => item.blocked_user.id === friend.id);
      if (entry) setBlockRecordId(entry.id);
      
      if (onNotification) onNotification("User blocked successfully");
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  
  const handleUnblockUser = async () => {
    if (!blockRecordId) return;
    try {
      await notificationConfig.UNBLOCK_USER(blockRecordId);
      setIsBlocked(false);
      setBlockRecordId(null);
      setShowMenu(false);
      if (onNotification) onNotification("User unblocked successfully");
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 text-white shadow-md bg-gradient-to-r from-orange-600 to-orange-700">
      <div className="flex items-center space-x-4">
        <div className="relative">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={participantName} 
              className="object-cover w-12 h-12 border-2 border-white rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 font-bold text-orange-600 bg-white rounded-full">
              {participantName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          
          {!isGroup && isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold">{participantName}</h2>
          <p className="text-sm text-orange-200">
            {isGroup
              ? `${selectedChat.members?.length || 0} members`
              : isBlocked 
                ? 'Blocked' 
                : isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 transition rounded-lg hover:bg-orange-500"
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 z-50 mt-2 overflow-hidden text-gray-900 bg-white rounded-lg shadow-lg min-w-max ring-1 ring-black ring-opacity-5">
               <div className="py-1">
                 {/* Existing Delete Option */}
                 <button
                    onClick={() => {
                        onDeleteChat(selectedChat.id);
                        setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                 >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Chat
                 </button>

                 {/* Block/Unblock Options (Only for Direct Chats) */}
                 {!isGroup && (
                    isBlocked ? (
                        <button
                            onClick={handleUnblockUser}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Unblock User
                        </button>
                    ) : (
                        <button
                            onClick={handleBlockUser}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                            <Ban className="w-4 h-4 mr-2" />
                            Block User
                        </button>
                    )
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;