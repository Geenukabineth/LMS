import React, { useState, useEffect } from "react";
import { X, Plus, UserPlus } from "lucide-react"; // Added UserPlus icon for better UI
import notificationConfig from "@/config/notification.config";

const AddFriendModal = ({ isOpen, onClose, onSendRequest, onNotification }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]); // Store all users here
  const [filteredUsers, setFilteredUsers] = useState([]); // Store filtered list
  const [loading, setLoading] = useState(false);

  // 1. Fetch ALL users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchAllUsers = async () => {
      setLoading(true);
      try {
        // ✅ Call the USERS endpoint from your notification config
        // This hits http://localhost:8000/users/
        const data = await notificationConfig.USERS();
        
        // Handle pagination results vs flat array
        const users = Array.isArray(data) ? data : data?.results || [];
        
        setAllUsers(users);
        setFilteredUsers(users); // Initially show everyone
      } catch (error) {
        console.error("Error fetching users:", error);
        onNotification?.({
          type: "error",
          message: "Failed to load users",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, [isOpen, onNotification]); // Run when modal opens

  // 2. Filter users locally when search changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(allUsers);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = allUsers.filter(user => {
      const name = (user.full_name || user.username || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      // Filter by name or email
      return name.includes(lowerQuery) || email.includes(lowerQuery);
    });

    setFilteredUsers(filtered);
  }, [searchQuery, allUsers]);

  const handleSendRequest = async (userId) => {
    try {
      await notificationConfig.SEND_FRIEND_REQUEST({ to_user_id: userId });

      onNotification?.({
        type: "success",
        message: "Friend request sent!",
      });

      onSendRequest?.(userId);
      // Optional: Remove user from list after sending request
      // setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error sending friend request:", error);
      
      // Handle "Already sent" or "Already friends" errors nicely
      const errorMsg = error.response?.data?.error || "Failed to send request";
      onNotification?.({
        type: "error",
        message: errorMsg,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Friend</h2>
            <p className="text-sm text-gray-500">Find people to chat with</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow"
            autoFocus
          />
        </div>

        {/* Users List */}
        <div className="flex-1 p-2 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="w-8 h-8 mb-3 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-sm font-medium">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <UserPlus className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => {
                // Determine the image URL safely
                const imageUrl = user.display_image || user.profile?.image || user.image;
                const fullImageUrl = imageUrl?.startsWith('http') 
                  ? imageUrl 
                  : imageUrl ? `http://localhost:8000${imageUrl}` : null;
                
                // Get the correct name (matches your Serializer logic)
                const displayName = user.full_name || user.username || "Unknown User";

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 transition-colors rounded-lg hover:bg-gray-50 group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-200 rounded-full">
                        {fullImageUrl ? (
                          <img 
                            src={fullImageUrl} 
                            alt={displayName} 
                            className="object-cover w-full h-full"
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div 
                           className="flex items-center justify-center w-full h-full text-sm font-bold text-white bg-gradient-to-br from-purple-500 to-indigo-600"
                           style={{ display: fullImageUrl ? 'none' : 'flex' }}
                        >
                          {displayName[0]?.toUpperCase()}
                        </div>
                      </div>

                      {/* Name & Info */}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.user_type || user.email || `@${user.username}`}
                        </p>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="p-2 text-purple-600 transition-all rounded-full opacity-0 bg-purple-50 hover:bg-purple-600 hover:text-white group-hover:opacity-100 focus:opacity-100"
                      title="Send Friend Request"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-3 text-xs text-center text-gray-400 border-t bg-gray-50 rounded-b-xl">
           Showing {filteredUsers.length} users
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;