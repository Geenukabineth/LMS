import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import notificationConfig from "@/config/notification.config";

const MessageInput = ({
  messageInput,
  onInputChange,
  onSendMessage,
  selectedChat,
  isGroup = false,
  onNotification,
}) => {
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) {
      onNotification?.({
        type: 'error',
        message: 'Cannot send empty message',
      });
      return;
    }

    if (!selectedChat) {
      onNotification?.({
        type: 'error',
        message: 'Please select a chat first',
      });
      return;
    }

    setSending(true);

    try {
      let response;
      
      if (isGroup) {
        // ✅ FIX: Use the new SEND function and pass the DATA object
        response = await notificationConfig.SEND_GROUP_MESSAGE({
            group: selectedChat.id, // Backend expects 'group' ID
            content: messageInput
        });
      } else {
        // ✅ FIX: Use the new SEND function and pass the DATA object
        response = await notificationConfig.SEND_DIRECT_MESSAGE({
            chat: selectedChat.id, // Backend expects 'chat' ID
            content: messageInput
        });
      }

      if (response) {
        // Add flag to show it's from current user immediately
        const msgWithSender = { ...response, is_sender: true };
        onSendMessage?.(msgWithSender);
        onInputChange('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to send message',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ... (Return JSX remains the same) ...
  return (
    <div className="flex items-center p-4 space-x-3 bg-white border-t border-gray-200">
      <button
        title="Attach file (coming soon)"
        className="p-2 text-gray-500 transition rounded-full hover:bg-gray-100 hover:text-gray-700"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      <input
        type="text"
        placeholder="Type a message..."
        value={messageInput}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={sending}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      <button
        onClick={handleSendMessage}
        disabled={sending || !messageInput.trim()}
        className="flex items-center justify-center p-2 text-white transition bg-purple-600 rounded-full hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        title="Send message"
      >
        {sending ? (
          <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default MessageInput;