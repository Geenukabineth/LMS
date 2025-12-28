import React, { useState } from 'react';
import notificationConfig from "@/config/notification.config";


const FriendRequests = ({
  requests,
  onAccept,
  onReject,
  onNotification,
}) => {
  const [loadingId, setLoadingId] = useState(null);

  const handleAccept = async (requestId) => {
    setLoadingId(requestId);
    try {
      const data = await notificationConfig.FRIEND_REQUEST_ACCEPT(requestId);
      onAccept?.(data);
      

      onNotification?.({
        type: 'success',
        message: 'Friend request accepted!',
      });

      onAccept?.(requestId);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to accept friend request',
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setLoadingId(requestId);
    try {
      const data = await notificationConfig.FRIEND_REQUEST_REJECT(requestId);
      onReject?.(data);

      onNotification?.({
        type: 'success',
        message: 'Friend request declined',
      });

      onReject?.(requestId);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to decline friend request',
      });
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="px-2 mb-2 font-semibold text-gray-700">
        Friend Requests ({requests.length})
      </h3>
      {requests.map((request) => (
        <div
          key={request.id}
          className="p-3 mb-2 border border-blue-200 rounded-lg bg-blue-50"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center flex-1 min-w-0 space-x-2">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-sm font-bold text-white rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                {(request.from_user?.full_name  || request.from_user?.username || 'U')?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {request.from_user?.full_name  || request.from_user?.username}
                </p>
                <p className="text-xs text-gray-600">
                  sent a friend request
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
              {loadingId === request.id ? 'Processing...' : 'Accept'}
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

export default FriendRequests;