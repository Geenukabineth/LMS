import React, { useState, useEffect, useRef, useCallback } from "react";

import notificationConfig from "@/config/notification.config";
import { userService } from "@/config/user.config";

// Components
import SidebarHeader from "@/components/chat/SidebarHeader";
import ChatList from "@/components/chat/ChatList";
import FriendsList from "@/components/chat/FriendsList";
import FriendRequests from "@/components/chat/FriendRequests";
import GroupsList from "@/components/chat/GroupsList";
import GroupRequests from "@/components/chat/GroupRequests";
import ActionButtons from "@/components/chat/ActionButtons";
import AddFriendModal from "@/components/chat/AddFriendModal";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import ChatHeader from "@/components/chat/ChatHeader";
import MessagesArea from "@/components/chat/MessagesArea";
import MessageInput from "@/components/chat/MessageInput";

import EmptyState from "@/components/chat/EmptyState";

const ChatApplicationRefactored = () => {
  // State Management
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
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
  const [messageInput, setMessageInput] = useState("");
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
   * Add notification
   */
  const addNotification = useCallback((notif) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { ...notif, id }]);
  }, []);

  /**
   * Handle WebSocket messages (backend sends { type, payload })
   */
  const handleWebSocketMessage = useCallback(
    (data) => {
      const eventType = data?.type;
      const payload = data?.payload ?? data;

      switch (eventType) {
        case "direct_message": {
          // payload.chat_id should exist
          if (selectedChat && selectedChat.id === payload.chat_id) {
            setMessages((prev) => [...prev, payload]);
          }
          break;
        }

        case "group_message": {
          // payload.group_id should exist
          if (selectedChat && selectedChat.id === payload.group_id) {
            setMessages((prev) => [...prev, payload]);
          }
          break;
        }

        case "friend_request":
          setFriendRequests((prev) => [payload, ...prev]);
          addNotification({
            type: "friend_request",
            message: "You received a friend request",
          });
          break;

        case "friend_request_accepted":
          if (payload?.user) setFriends((prev) => [...prev, payload.user]);
          addNotification({
            type: "success",
            message: "Friend request accepted",
          });
          break;

        case "group_invite":
          setGroupRequests((prev) => [payload, ...prev]);
          addNotification({
            type: "group_request",
            message: "You were invited to join a group",
          });
          break;

        case "user_online":
          if (payload?.user_id) {
            setOnlineUsers((prev) => new Set(prev).add(payload.user_id));
          }
          break;

        case "user_offline":
          if (payload?.user_id) {
            setOnlineUsers((prev) => {
              const updated = new Set(prev);
              updated.delete(payload.user_id);
              return updated;
            });
          }
          break;

        default:
          break;
      }
    },
    [addNotification, selectedChat]
  );

  /**
   * Initialize WebSocket connection
   */
  const initializeWebSocket = useCallback(() => {
    const token = localStorage.getItem("authToken");

    if (!token) return;

    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

    try {
      const wsUrlFinal = `ws://localhost:8000/ws/chatroom/?token=${token}`;

      wsRef.current = new WebSocket(wsUrlFinal);

      wsRef.current.onopen = () => {
        setWsConnected(true);
        // addNotification({ type: "success", message: "Connected to chat server" });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error("Invalid WS message JSON:", e);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current.onclose = () => {
        setWsConnected(false);
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            wsRef.current = null;
            initializeWebSocket();
          }
        }, 3000);
      };
    } catch (error) {
      console.error("Error initializing WebSocket:", error);
    }
  }, [addNotification, handleWebSocketMessage]);

  /**
   * Fetch all initial data (Extracted to be reusable)
   */
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const storedUserId =
        localStorage.getItem("userId") || localStorage.getItem("user_id");

      if (storedUserId) setCurrentUserId(parseInt(storedUserId, 10));

      // Optional: refresh user id from API
      try {
        const me = await userService.getUserProfile();
        if (me?.id) {
          setCurrentUserId(me.id);
          localStorage.setItem("userId", String(me.id));
        }
      } catch {
        // ignore
      }

      const [chatsRes, friendsRes, groupsRes, requestsRes] = await Promise.all([
        notificationConfig.CHATS({ page_size: 100 }),
        notificationConfig.FRIENDS_LIST(),
        notificationConfig.GROUPS({ page_size: 100 }),
        notificationConfig.GET_FRIEND_REQUESTS({ page_size: 100 }),
      ]);

      setChats(chatsRes?.results || chatsRes || []);
      setFriends(friendsRes?.results || friendsRes || []);
      setGroups(groupsRes?.results || groupsRes || []);
      setFriendRequests(requestsRes?.results || requestsRes || []);

      // unread count
      const unread = await notificationConfig.NOTIFICATION_UNREAD_COUNT();
      setUnreadCount(unread?.unread_count || 0);

      // online friends
      const onlineRes = await notificationConfig.ONLINE_FRIENDS();
      setOnlineUsers(new Set((onlineRes || []).map((u) => u.id)));
    } catch (error) {
      console.error("Error fetching initial data:", error);
      addNotification({ type: "error", message: "Failed to load chat data" });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Main Initialization Effect
   */
  useEffect(() => {
    // 1. Load Data
    fetchAllData();
    
    // 2. Connect WS
    initializeWebSocket();

    // 3. ✅ LISTENER: Handle "Friend Accepted" from NotificationBell
    const handleFriendAcceptUI = () => {
        console.log("🔔 Notification Bell says: Friend Accepted. Refreshing list...");
        // Re-fetch only the friends list to update UI
        notificationConfig.FRIENDS_LIST().then(res => {
            setFriends(res?.results || res || []);
        }).catch(err => console.error("Failed to refresh friends", err));
    };

    window.addEventListener('friend-request-accepted-ui', handleFriendAcceptUI);

    return () => {
      window.removeEventListener('friend-request-accepted-ui', handleFriendAcceptUI);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [fetchAllData, initializeWebSocket]);

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
        let response;

        if (isGroup) {
          response = await notificationConfig.GROUP_MESSAGES({
            group_id: selectedChat.id,
            page_size: 50,
          });
        } else {
          response = await notificationConfig.DIRECT_MESSAGES({
            chat_id: selectedChat.id,
            page_size: 50,
          });
        }

        const msgs = response?.results || response || [];
        setMessages(
          msgs.map((msg) => ({
            ...msg,
            is_sender: msg?.sender?.id === currentUserId,
          }))
        );
      } catch (error) {
        console.error("Error loading messages:", error);
        addNotification({ type: "error", message: "Failed to load messages" });
      }
    };

    loadMessages();
  }, [selectedChat, currentUserId, addNotification]);

  /**
   * Handle send message (UI append; MessageInput sends via WS/REST)
   */
  const handleSendMessage = (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
  };

  /**
   * Handle select chat
   */
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMessageInput("");
  };

  /**
   * Handle friend request sent
   */
  const handleFriendRequestSent = () => {
    addNotification({ type: "success", message: "Friend request sent!" });
  };

  /**
   * Accept/reject friend request (local UI updates for Tab: Friends > Requests)
   */
  const handleAcceptFriendRequest = (requestId) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    // Refresh friends list to show the new friend
    notificationConfig.FRIENDS_LIST().then(res => {
        setFriends(res?.results || res || []);
    });
    addNotification({ type: "success", message: "Friend request accepted!" });
  };

  const handleRejectFriendRequest = (requestId) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  /**
   * Create group (local UI update)
   */
  const handleCreateGroup = (newGroup) => {
    setGroups((prev) => [...prev, newGroup]);
    addNotification({
      type: "success",
      message: `Group "${newGroup.name}" created successfully!`,
    });
  };

  /**
   * Remove friend (local UI update)
   */
  const handleRemoveFriend = (friendId) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  /**
   * Delete chat (local UI update)
   */
  const handleDeleteChat = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (selectedChat?.id === chatId) setSelectedChat(null);
  };

  /**
   * Filter data based on search query
   */
  const filteredChats = chats.filter((chat) =>
    (chat.user?.full_name || chat.user?.username || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter((friend) =>
    (friend.full_name || friend.username || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    (group.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case "chats":
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

      case "friends":
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

      case "groups":
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
            window.location.href = "/login";
          }}
          unreadCount={unreadCount}
        />

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
                <p className="text-gray-500">Loading...</p>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>

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
              onMarkAsRead={() => setUnreadCount((c) => Math.max(0, c - 1))}
            />
            <MessageInput
              messageInput={messageInput}
              onInputChange={setMessageInput}
              onSendMessage={handleSendMessage}
              selectedChat={selectedChat}
              isGroup={!!selectedChat.name}
              onNotification={addNotification}
              ws={wsRef.current}
              wsConnected={wsConnected}
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
    </div>
  );
};

export default ChatApplicationRefactored;