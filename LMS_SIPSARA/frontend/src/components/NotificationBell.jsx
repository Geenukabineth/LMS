// components/NotificationBell.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Bell, X } from 'lucide-react';

// Helper function to format ISO date strings
const formatTime = (isoString) => {
  if (!isoString) return 'Unknown time';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  } catch (e) {
    console.error("Error formatting date:", e);
    return isoString;
  }
};

const NotificationBell = forwardRef(({ userId }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [socketRef, setSocketRef] = useState(null); // Store socket reference

  // 1. READ TOKEN HERE so it acts as a dependency
  // This ensures if the user logs in/out, the socket reconnects with the new token.
  const token = localStorage.getItem('authToken');

  // 2. WebSocket Connection Logic
  useEffect(() => {
    if (!token) {
      console.warn("⚠️ No auth token found. Notification WebSocket will not connect.");
      return;
    }

    // Connect with the token in the Query String
    const wsUrl = `ws://127.0.0.1:8000/ws/notifications/?token=${token}`;
    
    console.log('🔌 Connecting to WS:', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('🟢 Connected to Notification WebSocket');
      setSocketRef(socket); // Store reference for later use
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Notification Received:', data);

        let newNotification = null;

        // --- HANDLER: Announcement Signals (from signals.py) ---
        if (data.type === 'announcement_push' && data.data) {
          const announcementData = data.data; 
          newNotification = {
            id: announcementData.id,
            message: announcementData.title,
            type: announcementData.type || 'general',
            time: announcementData.created_at,
            author: announcementData.author ? announcementData.author.username : 'System',
            read: false,
          };
          console.log('✅ Announcement notification created:', newNotification);
        } 
        // --- HANDLER: Custom Celery Events (from tasks.py) ---
        else if (data.type === 'event_push') {
          newNotification = {
            id: data.event_id || Date.now(), 
            message: data.title, 
            type: data.event_type || 'general', 
            time: data.created_at, 
            author: 'System Alert',
            read: false,
          };
          console.log('✅ Event notification created:', newNotification);
        }

        if (newNotification) {
          setNotifications((prev) => {
            const updated = [newNotification, ...prev];
            console.log(`📦 Notifications count: ${updated.length}`);
            return updated;
          });
        }
      } catch (err) {
        console.error('❌ Error parsing WS message:', err);
      }
    };

    socket.onerror = (error) => {
      // NOTE: WebSocket standard doesn't give details in the 'error' object for security reasons.
      // You must look at the 'onclose' code to know why it failed.
      console.error('🔴 WebSocket Error Event:', error);
    };

    socket.onclose = (e) => {
      // DEBUGGING: Log the specific close code to know WHY it disconnected
      console.log(`🔓 WebSocket Closed. Code: ${e.code}, Reason: ${e.reason}, Clean: ${e.wasClean}`);

      if (e.code === 4000) {
        console.error("⚠️ Connection Rejected: Authentication Failed (Invalid Token)");
      } else if (e.code === 1011) {
        console.error("⚠️ Connection Closed: Internal Server Error (Check Django Terminal)");
      } else if (!e.wasClean) {
        console.log('🔴 Disconnected Unexpectedly (Network issue or Server Crash)');
      } else {
        console.log('🔓 Disconnected cleanly');
      }
    };

    // Cleanup: Close connection when component unmounts or TOKEN changes
    return () => {
      console.log("🧹 Cleaning up WebSocket connection...");
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      setSocketRef(null);
    };
  }, [token]); // <--- dependency array includes token

  // 3. Expose addNotification via ref for manual updates (from AnnouncementPanel)
  useImperativeHandle(ref, () => ({
    addNotification: (announcement) => {
      if (!announcement) return;
      const newNotification = {
        id: announcement.id || Date.now(),
        message: announcement.message || 'New notification',
        type: announcement.type || 'general',
        time: announcement.time || 'Just now', 
        author: announcement.author || 'System',
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      console.log('✅ Manual notification added via ref:', newNotification);
    },
  }));

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    
    // Send mark_read event to server (optional - implement if needed)
    if (socketRef && socketRef.readyState === WebSocket.OPEN) {
      try {
        socketRef.send(JSON.stringify({
          type: 'mark_read',
          notification_id: id
        }));
      } catch (err) {
        console.error('Error sending mark_read:', err);
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      setNotifications([]);
    }
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      course: 'bg-green-100 text-green-800',
      assignment: 'bg-yellow-100 text-yellow-800',
      urgent: 'bg-red-100 text-red-800',
      payment_due: 'bg-pink-100 text-pink-800', 
      assignment_due: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || colors.general; 
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 transition rounded-lg hover:text-gray-900 hover:bg-gray-100"
        title="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 flex flex-col mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96">
          {/* Header */}
          <div className="flex items-center justify-between flex-shrink-0 p-4 border-b">
            <h3 className="font-semibold text-gray-900">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start justify-between p-4 transition border-b cursor-pointer ${
                    notification.read
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${getTypeBadgeColor(
                          notification.type
                        )}`}
                      >
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    <p className={`text-sm ${notification.read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                      {notification.message}
                    </p>
                    <span className="block mt-1 text-xs text-gray-500">
                      {notification.author && `From: ${notification.author}`}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {formatTime(notification.time)} 
                    </span>
                  </div>

                  <div className="flex flex-shrink-0 gap-1">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="w-2 h-2 bg-blue-600 rounded-full hover:bg-blue-700"
                        title="Mark as read"
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="text-gray-400 transition hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex-shrink-0 p-3 space-y-2 text-center border-t">
              <button
                onClick={handleClearAll}
                className="block w-full text-sm text-gray-600 transition hover:text-gray-900"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;