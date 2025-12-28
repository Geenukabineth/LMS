import api from "@/services/api";
const WS_BASE_URL = import.meta.env.WS_BASE_URL;

const notificationConfig = {    
    getnotification : async (params = {}) => {
        const response = await api.get('notification/announcements/', { params });
        return response.data;
    },
    


    // Create a new announcement
    createAnnouncement: async (data) => {
        const response = await api.post('notification/announcements/', data);
        return response.data;
    },

    // Update an existing announcement
    updateAnnouncement: async (id, data) => {
        const response = await api.patch(`notification/announcements/${id}/`, data);
        return response.data;
    },

    // Delete an announcement
    deleteAnnouncement: async (id) => {
        const response = await api.delete(`notification/announcements/${id}/`);
        return response.data;
    },

    


   SEND_FRIEND_REQUEST: async (data) => {
        const response = await api.post('chat/friend-requests/', data);
        return response.data;
    },

    // 2. Function to GET the list of requests (GET)
    GET_FRIEND_REQUESTS: async (params = {}) => {
        const response = await api.get('chat/friend-requests/', { params });
        return response.data;
    },
    FRIEND_REQUEST_ACCEPT: async (id) => {
        const response = await api.post(`chat/friend-requests/${id}/accept/`);
        return response.data;
    },
    FRIEND_REQUEST_REJECT: async (id) => {
        const response = await api.post(`chat/friend-requests/${id}/reject/`);
        return response.data;
    },
    FRIENDS_LIST: async (params = {}) => {
        const response = await api.get('chat/friendships/my_friends/', { params });
        return response.data;
    },
    REMOVE_FRIEND: async (id) => {
        const response = await api.delete(`chat/friendships/${id}/`);
        return response.data;
    },
    FRIENDSHIPS: async (data) => {
        const response = await api.get('chat/friendships/', data);
        return response.data;
    },

    CHATS: async (params = {}) => {
        const response = await api.get('chat/chats/', { params });
        return response.data;
    },
    CHAT_DETAIL: async (id) => {
        const response = await api.delete(`chat/chats/${id}/`);
        return response.data;
    },
    START_CHAT: async (data) => {
        const response = await api.post('chat/chats/', data);
        return response.data;
    },
    DIRECT_MESSAGES: async (params = {}) => {
        const response = await api.get('chat/direct-messages/', { params });
        return response.data;
    },
    SEND_DIRECT_MESSAGE: async (data) => {
        const response = await api.post('chat/direct-messages/', data);
        return response.data;
    },
    SEND_GROUP_MESSAGE: async (data) => {
        const response = await api.post('chat/group-messages/', data);
        return response.data;
    },
    MARK_MESSAGE_READ: async (id) => {
        const response = await api.post(`chat/direct-messages/${id}/mark_as_read/`);
        return response.data;
    },
    GROUPS : async (params = {}) => {
        const response = await api.get('chat/groups/', { params });
        return response.data;
      },
      CREATE_GROUP: async (data) => {
        const response = await api.post('chat/groups/', data);
        return response.data;
    },
      GROUP_DETAIL : async (id) => {
        const response = await api.get(`chat/groups/${id}/`);    
        return response.data;
      },
        GROUP_ADD_MEMBER : async (id, data) => {    
        const response = await api.post(`chat/groups/${id}/add_member/`, data);
        return response.data;
      },
        GROUP_REMOVE_MEMBER : async (id, data) => {
        const response = await api.post(`chat/groups/${id}/remove_member/`, data);
        return response.data;
      },
      GROUP_LEAVE : async (id) => {
        const response = await api.post(`chat/groups/${id}/leave/`);
        return response.data;
      },    
      GROUP_MESSAGES : async (params = {}) => {
        const response = await api.get('chat/group-messages/', { params });
        return response.data;
      },
      NOTIFICATIONS : async (params = {}) => {
        const response = await api.get('chat/notifications/', { params });
        return response.data;
      },
        NOTIFICATION_READ : async (id) => {
        const response = await api.post(`chat/notifications/${id}/mark_as_read/`);
        return response.data;
      },
        NOTIFICATION_READ_ALL : async () => {
            const response = await api.post('chat/notifications/mark_all_as_read/');
            return response.data;
      },
      NOTIFICATION_UNREAD_COUNT: async () => {
        const response = await api.get('chat/notifications/unread_count/');
        return response.data;
      },
      BLOCKED_USERS: async (params = {}) => {
        const response = await api.get('chat/blocked-users/', { params });
        return response.data;
      },
        UNBLOCK_USER: async (id) => {
            const response = await api.post(`chat/blocked-users/${id}/unblock/`);
            return response.data;
    },
    ONLINE_STATUS : async () => {
        const response = await api.get('chat/online-status/');
        return response.data;
    },
    ONLINE_FRIENDS : async () => {
            const response = await api.get('chat/online-status/online_friends/');
            return response.data;
    },

    USERS: async (params = {}) => {
        const response = await api.get('chat/users/', { params });
        return response.data;
    },
    USER_DETAIL : async (id) => {
        const response = await api.get(`users/${id}/`);
        return response.data;
    },
    
    USER_BY_TYPE : async (params = {}) => {
        const response = await api.get('users/by_type/', { params });
        return response.data;
    },
    USER_ONLINE : async () => {
        const response = await api.get('users/online_users/');
        return response.data;
    },
    USER_FRIENDS : async (id) => {
        const response = await api.get(`users/${id}/friends/`);
        return response.data;
    },   

    CHAT_WS: (chatId) => `${WS_BASE_URL}/chatroom/${chatId}/`,
    GROUP_WS: (groupId) => `${WS_BASE_URL}/chatroom/group/${groupId}/`,


};


export default notificationConfig;