import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Smile, Paperclip, Users, Settings, X } from 'lucide-react';

// Mock data
const initialMessages = [
  {
    id: 1,
    sender: 'Prof. Johnson',
    message: 'Welcome everyone! Today we will be discussing advanced calculus concepts. Please feel free to ask questions during the lecture.',
    timestamp: new Date(Date.now() - 3600000),
    isInstructor: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    reactions: [
      { emoji: '👍', count: 5, users: ['Alice', 'Bob', 'Charlie', 'David', 'Eve'] },
      { emoji: '📚', count: 2, users: ['Frank', 'Grace'] }
    ]
  },
  {
    id: 2,
    sender: 'Alice Chen',
    message: 'Thank you professor! I have a question about the integration by parts method we covered last week.',
    timestamp: new Date(Date.now() - 3400000),
    isInstructor: false,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b047?w=150',
    reactions: []
  },
  {
    id: 3,
    sender: 'Prof. Johnson',
    message: 'Great question Alice! Integration by parts is based on the product rule for differentiation. Let me explain it step by step...',
    timestamp: new Date(Date.now() - 3200000),
    isInstructor: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    reactions: [
      { emoji: '💡', count: 3, users: ['Alice', 'Bob', 'Charlie'] }
    ]
  }
];

const participants = [
  { id: 1, name: 'Prof. Johnson', role: 'Instructor', status: 'online', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { id: 2, name: 'Alice Chen', role: 'Student', status: 'online', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b047?w=150' },
  { id: 3, name: 'Bob Smith', role: 'Student', status: 'online', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
  { id: 4, name: 'Charlie Brown', role: 'Student', status: 'away', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { id: 5, name: 'Diana Prince', role: 'TA', status: 'online', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }
];

// Main Chat Component
const TeamsChat = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        sender: 'You',
        message: newMessage,
        timestamp: new Date(),
        isInstructor: false,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        reactions: []
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addReaction = (messageId, emoji) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...msg,
            reactions: msg.reactions.map(r =>
              r.emoji === emoji 
                ? { ...r, count: r.count + 1, users: [...r.users, 'You'] }
                : r
            )
          };
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, count: 1, users: ['You'] }]
          };
        }
      }
      return msg;
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ChatHeader 
        showParticipants={showParticipants}
        setShowParticipants={setShowParticipants}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <MessagesList 
            messages={messages} 
            onAddReaction={addReaction}
          />
          <div ref={messagesEndRef} />
        </div>
        
        {showParticipants && (
          <ParticipantsSidebar 
            participants={participants}
            onClose={() => setShowParticipants(false)}
          />
        )}
      </div>
      
      <MessageComposer 
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
};

// Chat Header Component
const ChatHeader = ({ showParticipants, setShowParticipants, searchQuery, setSearchQuery }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Calculus II - Advanced Topics</h1>
          <p className="text-sm text-gray-500">Math 202 • Spring 2025</p>
        </div>
      </div>
      
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search in chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          className={`p-2 rounded-lg transition-colors ${
            showParticipants 
              ? 'bg-blue-100 text-blue-600' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Show participants"
          onClick={() => setShowParticipants(!showParticipants)}
        >
          <Users size={19} />
        </button>
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings size={19} />
        </button>
      </div>
    </div>
  );
};

const MessagesList = ({ messages, onAddReaction }) => {
  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return timestamp.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
    } else {
      return timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const shouldShowAvatar = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    return prevMsg.sender !== currentMsg.sender || 
           (currentMsg.timestamp - prevMsg.timestamp) > 300000; // 5 minutes
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showAvatar = shouldShowAvatar(message, prevMessage);
        
        return (
          <MessageItem 
            key={message.id}
            message={message}
            showAvatar={showAvatar}
            formatTime={formatTime}
            onAddReaction={onAddReaction}
          />
        );
      })}
    </div>
  );
};

// Individual Message Component
const MessageItem = ({ message, showAvatar, formatTime, onAddReaction }) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '👏', '💡', '🎉'];

  return (
    <div className={`flex ${showAvatar ? 'mt-4' : 'mt-1'} group`}>
      <div className="flex-shrink-0 mr-3">
        {showAvatar ? (
          <div className="relative">
            <img 
              src={message.avatar} 
              alt={message.sender} 
              className="w-10 h-10 rounded-full object-cover"
            />
            {message.isInstructor && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-xs">📚</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center">
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900">{message.sender}</span>
            {message.isInstructor && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Instructor
              </span>
            )}
            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
          </div>
        )}
        
        <div className="relative group">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-gray-800 leading-relaxed">{message.message}</p>
            
            {message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {message.reactions.map((reaction, idx) => (
                  <button
                    key={idx}
                    className="inline-flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 text-sm transition-colors"
                    onClick={() => onAddReaction(message.id, reaction.emoji)}
                    title={`${reaction.users.join(', ')} reacted with ${reaction.emoji}`}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-gray-600">{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="absolute top-2 -right-12 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button 
                className="p-1 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                title="Add reaction"
              >
                <Smile size={14} className="text-gray-600" />
              </button>
              
              {showReactionPicker && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1 z-10">
                  {commonEmojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      className="p-1 hover:bg-gray-100 rounded text-lg transition-colors"
                      onClick={() => {
                        onAddReaction(message.id, emoji);
                        setShowReactionPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Composer Component
const MessageComposer = ({ newMessage, setNewMessage, onSendMessage, onKeyPress }) => {
  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center space-x-2 mb-3">
        <button className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Bold">
          <strong className="text-sm">B</strong>
        </button>
        <button className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Attach file">
          <Paperclip size={16} />
        </button>
        <button className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Insert emoji">
          <Smile size={16} />
        </button>
      </div>
      
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={onKeyPress}
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>
        
        <button 
          className={`p-3 rounded-lg transition-colors ${
            newMessage.trim()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={onSendMessage}
          disabled={!newMessage.trim()}
          title="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

// Participants Sidebar Component
const ParticipantsSidebar = ({ participants, onClose }) => {
  const onlineCount = participants.filter(p => p.status === 'online').length;
  
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Participants ({participants.length})</h3>
        <button 
          className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Online ({onlineCount})</h4>
          <div className="space-y-2">
            {participants
              .filter(p => p.status === 'online')
              .map(participant => (
                <ParticipantItem key={participant.id} participant={participant} />
              ))}
          </div>
        </div>
        
        {participants.length > onlineCount && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Away ({participants.length - onlineCount})</h4>
            <div className="space-y-2">
              {participants
                .filter(p => p.status !== 'online')
                .map(participant => (
                  <ParticipantItem key={participant.id} participant={participant} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Participant Item Component
const ParticipantItem = ({ participant }) => {
  return (
    <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
      <div className="relative flex-shrink-0">
        <img 
          src={participant.avatar} 
          alt={participant.name} 
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
          participant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
        }`}></div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{participant.name}</p>
        <p className="text-xs text-gray-500 truncate">{participant.role}</p>
      </div>
      
      <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:bg-gray-200 rounded transition-all text-sm">
        💬
      </button>
    </div>
  );
};

export default TeamsChat;