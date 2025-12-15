import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS, apiCall } from '@/config/apiConfig';

const NotificationToast = ({ notifications = [], onDismiss, loadUnreadCount }) => {
  const [displayNotifs, setDisplayNotifs] = useState([]);

  useEffect(() => {
    setDisplayNotifs(notifications);

    // Auto-remove notifications after 5 seconds
    const timers = notifications.map((notif) => {
      return setTimeout(() => {
        setDisplayNotifs((prev) => prev.filter((n) => n.id !== notif.id));
        onDismiss?.(notif.id);
      }, 5000);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [notifications, onDismiss]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'friend_request':
        return 'bg-blue-500';
      case 'group_request':
        return 'bg-orange-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed z-50 space-y-2 pointer-events-none top-4 right-4">
      {displayNotifs.map((notif) => (
        <div
          key={notif.id}
          className={`p-4 rounded-lg text-white shadow-lg animate-slide-in flex items-center gap-3 pointer-events-auto ${getStyles(
            notif.type
          )}`}
        >
          {getIcon(notif.type)}
          <span className="flex-1">{notif.message}</span>
          <button
            onClick={() => {
              setDisplayNotifs((prev) => prev.filter((n) => n.id !== notif.id));
              onDismiss?.(notif.id);
            }}
            className="flex-shrink-0 text-white transition hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;