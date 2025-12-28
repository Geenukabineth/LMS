import React, { useState } from 'react';
import notificationConfig from "@/config/notification.config";


const GroupRequests = ({
  requests,
  onAccept,
  onReject,
  onNotification,
}) => {
  const [loadingId, setLoadingId] = useState(null);

  const handleAccept = async (requestId) => {
    setLoadingId(requestId);
    try {
      const response = await notificationConfig.MARK_AS_READ(requestId);

        

      onNotification?.({
        type: 'success',
        message: 'Joined the group!',
      });

      onAccept?.(requestId);
    } catch (error) {
      console.error('Error accepting group invite:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to join group',
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setLoadingId(requestId);
    try {
      await notificationConfig.NOTIFICATIONS(requestId);       

      onNotification?.({
        type: 'success',
        message: 'Group invite declined',
      });

      onReject?.(requestId);
    } catch (error) {
      console.error('Error rejecting group invite:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to decline group invite',
      });
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="px-2 mb-2 font-semibold text-gray-700">
        Group Invites ({requests.length})
      </h3>
      {requests.map((request) => (
        <div
          key={request.id}
          className="p-3 mb-2 border border-green-200 rounded-lg bg-green-50"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center flex-1 min-w-0 space-x-2">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-sm font-bold text-white rounded-full bg-gradient-to-br from-green-400 to-green-600">
                {(request.group?.name || request.group_name || 'G')?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {request.group?.name || request.group_name}
                </p>
                <p className="text-xs text-gray-600">
                  invited you to join
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleAccept(request.id)}
              disabled={loadingId === request.id}
              className="flex-1 py-1 text-sm font-medium text-white transition bg-green-500 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingId === request.id ? 'Processing...' : 'Join'}
            </button>
            <button
              onClick={() => handleReject(request.id)}
              disabled={loadingId === request.id}
              className="flex-1 py-1 text-sm font-medium text-gray-800 transition bg-gray-300 rounded hover:bg-gray-400 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingId === request.id ? 'Processing...' : 'Decline'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupRequests;