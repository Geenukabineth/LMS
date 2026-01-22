import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import notificationConfig from "@/config/notification.config";

const ChatList = ({ chats, selectedChat, onSelectChat, onlineUsers, onChatDeleted, onNotification }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDeleteChat = async (chatId) => {
    try {
      await notificationConfig.CHAT_DETAIL(chatId); // Assuming DELETE is handled inside config or change to api call
      onNotification?.({ type: 'success', message: 'Chat deleted' });
      onChatDeleted?.(chatId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
      onNotification?.({ type: 'error', message: 'Failed to delete chat' });
    }
  };

  if (chats.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No chats yet. Start a conversation!</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {chats.map((chat) => {
        // ✅ FIX: Use 'other_user' instead of 'user'
        const friend = chat.other_user || chat.user; 
        const displayName = friend?.full_name || friend?.username || 'Unknown';
        const displayImage = friend?.display_image; // Serializer sends 'display_image'

        // Fix image URL if it's relative
        const imageUrl = displayImage?.startsWith('http') 
          ? displayImage 
          : displayImage ? `http://localhost:8000${displayImage}` : null;

        return (
          <div key={chat.id}>
            <div
              onClick={() => onSelectChat(chat)}
              className={`p-3 rounded-lg cursor-pointer transition flex items-center justify-between group ${
                selectedChat?.id === chat.id
                  ? 'bg-orange-100 border-2 border-orange-600'
                  : 'hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center flex-1 min-w-0 space-x-3">
                <div className="relative flex-shrink-0">
                  {/* ✅ FIX: Logic to show Image OR Initials */}
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={displayName} 
                      className="object-cover w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-12 h-12 font-bold text-white rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
                      {displayName?.[0]?.toUpperCase()}
                    </div>
                  )}

                  {friend && onlineUsers.has(friend.id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {chat.last_message?.content || 'No messages yet'}
                  </p>
                  {chat.last_message_time && (
                    <p className="text-xs text-gray-500">
                      {new Date(chat.last_message_time).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(chat.id);
                }}
                className="p-1 text-gray-400 transition rounded opacity-0 hover:text-red-500 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteConfirm === chat.id && (
              <div className="p-2 mb-2 border border-red-200 rounded-lg bg-red-50">
                <p className="mb-2 text-sm text-gray-700">Delete this chat?</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteChat(chat.id)} className="flex-1 px-2 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600">Delete</button>
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-2 py-1 text-sm text-gray-700 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;