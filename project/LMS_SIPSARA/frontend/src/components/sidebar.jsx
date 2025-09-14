import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Trash2 } from "lucide-react";

function NotificationBell() {
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Welcome to the notification system!", timestamp: new Date().toISOString(), read: false },
    { id: 2, message: "Your profile has been updated", timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
    { id: 3, message: "New message from John Doe", timestamp: new Date(Date.now() - 7200000).toISOString(), read: true }
  ]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ws = useRef(null);
  const dropdownRef = useRef(null);

  // Simulate WebSocket connection for demo
  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        "New order received",
        "System maintenance scheduled",
        "Password will expire soon",
        "New comment on your post",
        "File upload completed",
        "Meeting reminder: 2PM today"
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const newNotification = {
        id: Date.now(),
        message: randomMessage,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    }, 10000); // New notification every 10 seconds

    return () => clearInterval(interval);
    
    // Original WebSocket code (commented out for demo):
    // ws.current = new WebSocket("ws://localhost:8000/ws/notifications/");
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newNotification = {
        id: Date.now(),
        message: data.message,
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications((prev) => [newNotification, ...prev]);
    };
    return () => ws.current.close();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-3 rounded-full hover:bg-gray-100 transition-colors duration-200"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl border border-gray-200 rounded-lg z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
            <span className="font-semibold text-gray-800">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </span>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              <X 
                className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-700" 
                onClick={() => setDropdownOpen(false)} 
              />
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
                      !notif.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(notif.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors duration-150"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1 rounded hover:bg-gray-200 transition-colors duration-150"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={clearAll}
                className="w-full text-sm text-red-600 hover:text-red-800 font-medium py-1"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;