import React, { useState, useEffect, useRef, useCallback } from 'react';
// 🛠️ FIX 1: Corrected WS_ENDPOINTS to WEBSOCKET_ENDPOINTS. Added WS_BASE_URL.
import { API_ENDPOINTS, apiCall, WS_BASE_URL } from '@/config/apiConfig';

// Import all components
import SidebarHeader from '@/components/chat/SidebarHeader';
import ChatList from '@/components/chat/ChatList';
import FriendsList from '@/components/chat/FriendsList';
import FriendRequests from '@/components/chat/FriendRequests';
import GroupsList from '@/components/chat/GroupsList';
import GroupRequests from '@/components/chat/GroupRequests';
import ActionButtons from '@/components/chat/ActionButtons';
import AddFriendModal from '@/components/chat/AddFriendModal';
import CreateGroupModal from '@/components/chat/CreateGroupModal';
import ChatHeader from '@/components/chat/ChatHeader';
import MessagesArea from '@/components/chat/MessagesArea';
import MessageInput from '@/components/chat/MessageInput';
import NotificationToast from '@/components/chat/NotificationToast';
import EmptyState from '@/components/chat/EmptyState';

const ChatApplicationRefactored = () => {
  // State Management
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);

  // Chat data
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);

  // Request data
  const [friendRequests, setFriendRequests] = useState([]);
  const [groupRequests, setGroupRequests] = useState([]);

  // UI state
  const [messageInput, setMessageInput] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // WebSocket
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Current user
  const [currentUserId, setCurrentUserId] = useState(null);

  /**
   * Initialize WebSocket connection
   */
  const initializeWebSocket = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token || wsRef.current) return;

    try {
      // 🛠️ FIX 2: Cleaned up the multiple wsUrl declarations. 
      // Using WS_BASE_URL and appending the token for initial connection.
      const wsUrlFinal = `${WS_BASE_URL}?token=${token}`; 

      wsRef.current = new WebSocket(wsUrlFinal);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        addNotification({
          type: 'success',
          message: 'Connected to chat server',
        });
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        addNotification({
          type: 'error',
          message: 'Connection error. Retrying...',
        });
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            initializeWebSocket();
          }
        }, 3000);
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }, []);

  /**
   * Handle WebSocket messages
   */
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'direct_message':
      case 'group_message':
        // Add message to chat
        if (selectedChat && selectedChat.id === data.chat_id) {
          setMessages((prev) => [...prev, data]);
        }
        break;

      case 'friend_request':
        // New friend request received
        setFriendRequests((prev) => [data, ...prev]);
        addNotification({
          type: 'friend_request',
          message: `${data.from_user} sent you a friend request`,
        });
        break;

      case 'friend_request_accepted':
        // Friend request accepted
        setFriends((prev) => [...prev, data.user]);
        addNotification({
          type: 'success',
          message: `${data.user_name} accepted your friend request`,
        });
        break;

      case 'group_invite':
        // Group invitation received
        setGroupRequests((prev) => [data, ...prev]);
        addNotification({
          type: 'group_request',
          message: `You were invited to join ${data.group_name}`,
        });
        break;

      case 'user_online':
        setOnlineUsers((prev) => new Set(prev).add(data.user_id));
        break;

      case 'user_offline':
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(data.user_id);
          return updated;
        });
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  /**
   * Fetch all initial data
   */
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Get current user ID from token or store
        const userId = localStorage.getItem('user_id');
        if (userId) setCurrentUserId(parseInt(userId));

        // Fetch all data in parallel
        const [chatsRes, friendsRes, groupsRes, requestsRes] = await Promise.all([
          apiCall(`${API_ENDPOINTS.CHATS}?page_size=100`),
          apiCall(`${API_ENDPOINTS.FRIENDS_LIST}`),
          apiCall(`${API_ENDPOINTS.GROUPS}?page_size=100`),
          apiCall(`${API_ENDPOINTS.FRIEND_REQUESTS}?page_size=100`),
        ]);

        setChats(chatsRes.results || chatsRes || []);
        setFriends(friendsRes.results || friendsRes || []);
        setGroups(groupsRes.results || groupsRes || []);
        setFriendRequests(requestsRes.results || requestsRes || []);

        // Get unread count
        const notifRes = await apiCall(API_ENDPOINTS.NOTIFICATION_UNREAD_COUNT);
        setUnreadCount(notifRes.unread_count || 0);

        // Get online friends
        const onlineRes = await apiCall(API_ENDPOINTS.ONLINE_FRIENDS);
        const onlineIds = onlineRes.map((user) => user.id);
        setOnlineUsers(new Set(onlineIds));
      } catch (error) {
        console.error('Error fetching initial data:', error);
        addNotification({
          type: 'error',
          message: 'Failed to load chat data',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
    initializeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [initializeWebSocket]);

  /**
   * Load messages for selected chat
   */
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat) {
        setMessages([]);
        return;
      }

      try {
        const isGroup = !!selectedChat.name;
        let endpoint;

        if (isGroup) {
          endpoint = `${API_ENDPOINTS.GROUP_MESSAGES}?group_id=${selectedChat.id}`;
        } else {
          endpoint = `${API_ENDPOINTS.DIRECT_MESSAGES}?chat_id=${selectedChat.id}`;
        }

        const response = await apiCall(`${endpoint}&page_size=50`);
        const msgs = response.results || response || [];
        
        // Mark messages as read
        setMessages(msgs.map(msg => ({
          ...msg,
          is_sender: msg.sender?.id === currentUserId,
        })));
      } catch (error) {
        console.error('Error loading messages:', error);
        addNotification({
          type: 'error',
          message: 'Failed to load messages',
        });
      }
    };

    loadMessages();
  }, [selectedChat, currentUserId]);

  /**
   * Add notification
   */
  const addNotification = (notif) => {
    const id = Date.now();
    const notification = { ...notif, id };
    setNotifications((prev) => [...prev, notification]);
  };

  /**
   * Remove notification
   */
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  /**
   * Handle send message
   */
  const handleSendMessage = (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput('');
  };

  /**
   * Handle select chat
   */
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMessageInput('');
  };

  /**
   * Handle friend request sent
   */
  const handleFriendRequestSent = (userId) => {
    addNotification({
      type: 'success',
      message: 'Friend request sent!',
    });
  };

  /**
   * Handle friend request accepted
   */
  const handleAcceptFriendRequest = (requestId) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    addNotification({
      type: 'success',
      message: 'Friend request accepted!',
    });
  };

  /**
   * Handle friend request rejected
   */
  const handleRejectFriendRequest = (requestId) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  /**
   * Handle create group
   */
  const handleCreateGroup = (newGroup) => {
    setGroups((prev) => [...prev, newGroup]);
    addNotification({
      type: 'success',
      message: `Group "${newGroup.name}" created successfully!`,
    });
  };

  /**
   * Handle remove friend
   */
  const handleRemoveFriend = (friendId) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  /**
   * Handle delete chat
   */
  const handleDeleteChat = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
    }
  };

  /**
   * Filter data based on search query
   */
  const filteredChats = chats.filter((chat) =>
    (chat.user?.first_name || chat.user?.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter((friend) =>
    (friend.first_name || friend.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    (group.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <ChatList
            chats={filteredChats}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            onlineUsers={onlineUsers}
            onChatDeleted={handleDeleteChat}
            onNotification={addNotification}
          />
        );
      case 'friends':
        return (
          <div>
            <FriendRequests
              requests={friendRequests}
              onAccept={handleAcceptFriendRequest}
              onReject={handleRejectFriendRequest}
              onNotification={addNotification}
            />
            <FriendsList
              friends={filteredFriends}
              chats={chats}
              onSelectChat={handleSelectChat}
              onRemoveFriend={handleRemoveFriend}
              onlineUsers={onlineUsers}
              onNotification={addNotification}
            />
          </div>
        );
      case 'groups':
        return (
          <div>
            <GroupRequests
              requests={groupRequests}
              onAccept={handleAcceptFriendRequest}
              onReject={handleRejectFriendRequest}
              onNotification={addNotification}
            />
            <GroupsList
              groups={filteredGroups}
              selectedChat={selectedChat}
              onSelectChat={handleSelectChat}
              onNotification={addNotification}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col bg-white border-r border-gray-200 w-80">
        <SidebarHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={() => {
            window.location.href = '/login';
          }}
          unreadCount={unreadCount}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                <p className="text-gray-500">Loading...</p>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Action Buttons */}
        <ActionButtons
          onAddFriend={() => setShowAddFriendModal(true)}
          onCreateGroup={() => setShowCreateGroupModal(true)}
        />
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 bg-white">
        {selectedChat ? (
          <>
            <ChatHeader
              selectedChat={selectedChat}
              onlineUsers={onlineUsers}
              onDeleteChat={handleDeleteChat}
              onNotification={addNotification}
            />
            <MessagesArea
              messages={messages}
              selectedChat={selectedChat}
              currentUserId={currentUserId}
              onMarkAsRead={() => {
                setUnreadCount(Math.max(0, unreadCount - 1));
              }}
            />
            <MessageInput
              messageInput={messageInput}
              onInputChange={setMessageInput}
              onSendMessage={handleSendMessage}
              selectedChat={selectedChat}
              isGroup={!!selectedChat.name}
              onNotification={addNotification}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Modals */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onSendRequest={handleFriendRequestSent}
        onNotification={addNotification}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        friends={friends}
        onClose={() => setShowCreateGroupModal(false)}
        onCreate={handleCreateGroup}
        onNotification={addNotification}
      />

      {/* Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={removeNotification}
      />

      {/* Connection status indicator */}
      <div className="fixed z-40 bottom-4 left-4">
        <div
          className={`px-3 py-2 rounded-full text-white text-xs font-medium flex items-center gap-2 ${
            wsConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-white' : 'bg-red-200'} animate-pulse`}
          ></div>
          {wsConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
    </div>
  );
};

export default ChatApplicationRefactored;