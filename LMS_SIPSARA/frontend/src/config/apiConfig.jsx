// ✅ FIXED: Changed from 'http://localhost:8000/chat' to 'http://localhost:8000/api'
export const API_BASE_URL = 'http://localhost:8000';
export const WS_BASE_URL = 'ws://localhost:8000/ws/chat';
export const API_BASE_COURSE_URL = 'http://localhost:8000/Course';

/**
 * API Call Helper Function
 * ✅ Centralized function for making authenticated API calls
 */
export const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      console.warn('Token expired, redirecting to login...');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      return null;
    }

    return response;
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Friend Management
  FRIEND_REQUESTS: `${API_BASE_URL}friend-requests/`,
  FRIEND_REQUEST_ACCEPT: (id) => `${API_BASE_URL}friend-requests/${id}/accept/`,
  FRIEND_REQUEST_REJECT: (id) => `${API_BASE_URL}friend-requests/${id}/reject/`,
  FRIENDSHIPS: `${API_BASE_URL}friendships/`,
  FRIENDS_LIST: `${API_BASE_URL}friendships/`,  // ✅ FIXED: Removed /friends_list/ (doesn't exist)
  REMOVE_FRIEND: `${API_BASE_URL}friendships/`,

  // Direct Messaging
  CHATS: `${API_BASE_URL}chats/`,
  CHAT_DETAIL: (id) => `${API_BASE_URL}chats/${id}/`,
  START_CHAT: `${API_BASE_URL}chats/`,  // ✅ FIXED: Use /chats/ not /start_chat/
  DIRECT_MESSAGES: `${API_BASE_URL}direct-messages/`,
  MARK_MESSAGE_READ: (id) => `${API_BASE_URL}direct-messages/${id}/mark_as_read/`,

  // Groups
  GROUPS: `${API_BASE_URL}groups/`,
  GROUP_DETAIL: (id) => `${API_BASE_URL}groups/${id}/`,
  GROUP_ADD_MEMBER: (id) => `${API_BASE_URL}groups/${id}/add_member/`,
  GROUP_REMOVE_MEMBER: (id) => `${API_BASE_URL}groups/${id}/remove_member/`,
  GROUP_LEAVE: (id) => `${API_BASE_URL}groups/${id}/leave/`,

  // Group Messages
  GROUP_MESSAGES: `${API_BASE_URL}group-messages/`,

  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}notifications/`,
  NOTIFICATION_READ: (id) => `${API_BASE_URL}notifications/${id}/mark_as_read/`,
  NOTIFICATION_READ_ALL: `${API_BASE_URL}notifications/mark_all_as_read/`,
  NOTIFICATION_UNREAD_COUNT: `${API_BASE_URL}notifications/unread_count/`,

  // Blocked Users
  BLOCKED_USERS: `${API_BASE_URL}blocked-users/`,
  UNBLOCK_USER: (id) => `${API_BASE_URL}blocked-users/${id}/unblock/`,

  // Online Status
  ONLINE_STATUS: `${API_BASE_URL}online-status/`,
  ONLINE_FRIENDS: `${API_BASE_URL}online-status/online_friends/`,

  // Users (NEW ENDPOINTS)
  USERS: `${API_BASE_URL}users/`,
  USER_DETAIL: (id) => `${API_BASE_URL}users/${id}/`,
  USER_SEARCH: `${API_BASE_URL}users/search/`,
  USER_BY_TYPE: `${API_BASE_URL}users/by_type/`,
  USER_ONLINE: `${API_BASE_URL}users/online_users/`,
  USER_FRIENDS: (id) => `${API_BASE_URL}users/${id}/friends/`,

  // LMS Endpoints
  
};





export const WEBSOCKET_ENDPOINTS = {
  CHAT_WS: (chatId) => `${WS_BASE_URL}/${chatId}/`,
  GROUP_WS: (groupId) => `ws://localhost:8000/ws/group/${groupId}/`,
};

// 👇 ADDED ALIAS: To resolve the 'WS_ENDPOINTS' missing export error in chat.jsx
export const WS_ENDPOINTS = WEBSOCKET_ENDPOINTS;