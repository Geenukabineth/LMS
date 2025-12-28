import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Bell, X, UserPlus, Check } from "lucide-react"; // Added UserPlus and Check icons
import notificationConfig from "@/config/notification.config";

// Helper to format timestamps nicely
const formatTime = (isoString) => {
  if (!isoString) return "Just now";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return isoString;
  }
};

const NotificationBell = forwardRef(({ userId }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null); // Track action loading state

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const token = localStorage.getItem("authToken");

  // ✅ Load old announcements AND User Notifications (Friend Requests)
  useEffect(() => {
    if (!token) return;

    const fetchAllNotifications = async () => {
      try {
        // Fetch Announcements and Personal Notifications (Friend Requests, etc.) in parallel
        const [announcementsData, userNotificationsData] = await Promise.all([
          notificationConfig.getnotification(),
          notificationConfig.NOTIFICATIONS(), // Calls chat/notifications/
        ]);

        // 1. Process Announcements
        const announcementRows = Array.isArray(announcementsData)
          ? announcementsData
          : announcementsData?.results || [];

        const mappedAnnouncements = announcementRows.map((ann) => ({
          id: `ann_${ann.id}`, // Prefix ID to avoid collision
          originalId: ann.id,
          message: ann.title,
          type: ann.type || "general",
          time: ann.created_at,
          author: ann.author?.username || "System",
          read: false,
          isActionable: false, // Announcements usually don't have buttons
        }));

        // 2. Process Personal Notifications (Friend Requests)
        const notificationRows = Array.isArray(userNotificationsData)
          ? userNotificationsData
          : userNotificationsData?.results || [];

        const mappedPersonal = notificationRows.map((notif) => ({
          id: `notif_${notif.id}`,
          originalId: notif.id,
          message: notif.title || notif.message,
          type: notif.notification_type, // 'friend_request', 'group_invite', etc.
          time: notif.created_at,
          author: notif.actor?.username || "System",
          read: notif.is_read,
          // Store extra data needed for actions
          friendRequestId: notif.friend_request, // ID from serializer
          isActionable: notif.notification_type === "friend_request",
        }));

        setNotifications((prev) => {
          const seen = new Set(prev.map((n) => n.id));
          // Merge new data with existing state
          const merged = [
            ...mappedAnnouncements.filter((n) => !seen.has(n.id)),
            ...mappedPersonal.filter((n) => !seen.has(n.id)),
            ...prev,
          ];
          // Sort by newest first
          merged.sort((a, b) => new Date(b.time) - new Date(a.time));
          return merged;
        });
      } catch (error) {
        console.error("❌ Error fetching notifications:", error);
      }
    };

    fetchAllNotifications();
  }, [token]);

  // ✅ WebSocket connection
  useEffect(() => {
    if (!token) {
      console.warn(
        "⚠️ No auth token found. Notification WebSocket will not connect."
      );
      return;
    }

    let isActive = true;

    const connect = () => {
      if (socketRef.current && socketRef.current.readyState <= 1) return;

      // Note: Ensure your routing.py directs this URL to a consumer that handles notifications
      const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
     

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

     
      ws.onmessage = (event) => {
        if (!isActive) return;

        try {
          const data = JSON.parse(event.data);
          console.log("📨 Notification Received:", data);

          let newNotification = null;

          // Handle Announcement Push
          if (data.type === "announcement_push" && data.data) {
            const ann = data.data;
            newNotification = {
              id: `ann_${ann.id}`,
              originalId: ann.id,
              message: ann.title,
              type: ann.type || "general",
              time: ann.created_at,
              author: ann.author ? ann.author.username : "System",
              read: false,
              isActionable: false,
            };
          }
          // Handle Friend Request Push (from ChatConsumer)
          else if (data.type === "friend_request" && data.payload) {
             const req = data.payload;
             newNotification = {
                id: `ws_fr_${req.id}`,
                originalId: req.id,
                message: `${req.sender?.username || 'Someone'} sent you a friend request`,
                type: 'friend_request',
                time: new Date().toISOString(),
                author: req.sender?.username || 'User',
                read: false,
                friendRequestId: req.id,
                isActionable: true
             }
          }
          // Handle Generic/Event Push
          else if (data.type === "event_push") {
            newNotification = {
              id: data.event_id || `evt_${Date.now()}`,
              message: data.title,
              type: data.event_type || "general",
              time: data.created_at,
              author: "System Alert",
              read: false,
              isActionable: false,
            };
          }

          if (newNotification) {
            setNotifications((prev) => {
              // Avoid duplicates
              if (prev.some((n) => n.id === newNotification.id)) return prev;
              return [newNotification, ...prev];
            });
          }
        } catch (err) {
          console.error("❌ Error parsing WS message:", err);
        }
      };

      ws.onclose = (e) => {
        if (!isActive) return;
        console.log(`🔓 WS Closed. Code: ${e.code}`);

        reconnectTimerRef.current = setTimeout(() => {
          if (isActive) connect();
        }, 3000); // Increased reconnect time slightly
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    };

    connect();

    return () => {
      isActive = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const ws = socketRef.current;
      socketRef.current = null;
      if (
        ws &&
        (ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING)
      ) {
        ws.close();
      }
    };
  }, [token]);

  useImperativeHandle(ref, () => ({
    addNotification: (announcement) => {
      if (!announcement) return;

      const newNotification = {
        id: announcement.id || `manual_${Date.now()}`,
        message: announcement.message || "New notification",
        type: announcement.type || "general",
        time: announcement.time || new Date().toISOString(),
        author: announcement.author || "System",
        read: false,
        isActionable: false,
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotification.id)) return prev;
        return [newNotification, ...prev];
      });
    },
  }));

  // Handle Mark as Read
  const handleMarkAsRead = async (notification) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );

    // Call API if it's a real backend notification (not a manual one)
    if (notification.id.startsWith("notif_")) {
        try {
            await notificationConfig.NOTIFICATION_READ(notification.originalId);
        } catch (error) {
            console.error("Failed to mark read on server", error);
        }
    }
  };

  // Handle Friend Request Accept
  const handleAcceptFriend = async (e, notification) => {
    e.stopPropagation();
    if (!notification.friendRequestId) return;
    setLoadingAction(notification.id);

    try {
      await notificationConfig.FRIEND_REQUEST_ACCEPT(notification.friendRequestId);
      // Remove the notification or change text to "Accepted"
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      alert(`You are now friends with ${notification.author}`);
    } catch (error) {
      console.error("Failed to accept request", error);
      alert("Error accepting friend request");
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Friend Request Reject
  const handleRejectFriend = async (e, notification) => {
    e.stopPropagation();
    if (!notification.friendRequestId) return;
    setLoadingAction(notification.id);

    try {
      await notificationConfig.FRIEND_REQUEST_REJECT(notification.friendRequestId);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error("Failed to reject request", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all notifications?")) {
      setNotifications([]);
      // Optional: Call mark_all_as_read API
      notificationConfig.NOTIFICATION_READ_ALL().catch(console.error);
    }
  };

  const getTypeStyle = (type) => {
    const styles = {
      general: "bg-blue-100 text-blue-700",
      friend_request: "bg-purple-100 text-purple-700",
      course: "bg-green-100 text-green-700",
      assignment: "bg-yellow-100 text-yellow-800",
      urgent: "bg-red-100 text-red-700",
      payment_due: "bg-pink-100 text-pink-700",
      assignment_due: "bg-orange-100 text-orange-800",
    };
    return styles[type] || styles.general;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 transition-colors rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white transform bg-red-600 border-2 border-white rounded-full translate-x-1/4 -translate-y-1/4">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-2 overflow-hidden duration-200 bg-white border border-gray-200 rounded-lg shadow-xl w-80 sm:w-96 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-500 transition-colors hover:text-red-600"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Bell className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleMarkAsRead(notification)}
                      className={`group relative p-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                        !notification.read ? "bg-blue-50/60" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon based on type */}
                        <div className="mt-1">
                            {notification.type === 'friend_request' ? (
                                <div className="p-1.5 bg-purple-100 rounded-full">
                                    <UserPlus className="w-4 h-4 text-purple-600" />
                                </div>
                            ) : (
                                <div className={`w-2 h-2 mt-1.5 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded-full ${getTypeStyle(
                                notification.type
                              )}`}
                            >
                              {String(notification.type).replace("_", " ")}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.time)}
                            </span>
                          </div>

                          <p
                            className={`text-sm leading-snug ${
                              !notification.read
                                ? "font-semibold text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {notification.message}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            From:{" "}
                            <span className="font-medium text-gray-600">
                              {notification.author}
                            </span>
                          </p>

                          {/* ✅ ACTION BUTTONS FOR FRIEND REQUESTS */}
                          {notification.isActionable && notification.type === 'friend_request' && (
                            <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={(e) => handleAcceptFriend(e, notification)}
                                    disabled={loadingAction === notification.id}
                                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loadingAction === notification.id ? '...' : <><Check className="w-3 h-3" /> Accept</>}
                                </button>
                                <button 
                                    onClick={(e) => handleRejectFriend(e, notification)}
                                    disabled={loadingAction === notification.id}
                                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-colors bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                                >
                                    <X className="w-3 h-3" /> Decline
                                </button>
                            </div>
                          )}
                        </div>

                        {/* REMOVE BUTTON (X) - Only for non-actionable or read items */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="p-1 text-gray-400 transition-opacity rounded-full opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2 text-center border-t bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

NotificationBell.displayName = "NotificationBell";
export default NotificationBell;