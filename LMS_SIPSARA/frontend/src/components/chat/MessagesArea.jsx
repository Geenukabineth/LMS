import React, { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import notificationConfig from "@/config/notification.config";


const MessagesArea = ({ messages = [], selectedChat, currentUserId, onMarkAsRead }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    const markUnreadMessagesAsRead = async () => {
      if (!selectedChat || !messages) return;

      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.sender?.id !== currentUserId
      );

      if (unreadMessages.length > 0) {
        try {
          for (const msg of unreadMessages) {
            await notificationConfig.MARK_MESSAGE_READ(msg.id);
          }
          onMarkAsRead?.();
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    };

    const readTimer = setTimeout(markUnreadMessagesAsRead, 500);
    return () => clearTimeout(readTimer);
  }, [messages, selectedChat, currentUserId, onMarkAsRead]);

  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center flex-1 bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-500">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center flex-1 bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-500">No messages yet</p>
          <p className="mt-2 text-sm text-gray-400">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50"
    >
      {messages.map((message, index) => {
        const isSent = message.is_sender || message.sender?.id === currentUserId;
        const showAvatar = index === 0 || messages[index - 1]?.sender?.id !== message.sender?.id;

        return (
          <div
            key={message.id || index}
            className={`flex gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}
          >
            {/* Avatar for received messages */}
            {!isSent && showAvatar && (
              <div className="flex items-end">
                <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xs font-bold text-white rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                  {(message.sender?.full_name  || message.sender?.username || 'U')?.[0]?.toUpperCase()}
                </div>
              </div>
            )}

            {/* Spacer for avatar alignment */}
            {!isSent && !showAvatar && <div className="flex-shrink-0 w-8" />}

            {/* Message bubble */}
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                isSent
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-gray-300 text-gray-900 rounded-bl-none'
              }`}
            >
              {/* Sender name for group messages (if not sent by current user) */}
              {!isSent && message.sender && (
                <p className="mb-1 text-xs font-semibold opacity-75">
                  {message.sender.full_name  || message.sender.username}
                </p>
              )}

              {/* Message content */}
              <p className="break-words">{message.content}</p>

              {/* Timestamp and read status */}
              <div
                className={`text-xs mt-1 flex items-center gap-1 ${
                  isSent ? 'text-purple-200' : 'text-gray-600'
                }`}
              >
                {message.timestamp && (
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
                {isSent && message.is_read && (
                  <span title="Read">✓✓</span>
                )}
                {isSent && !message.is_read && (
                  <span title="Delivered">✓</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesArea;