import React, { useState } from 'react';
import { X } from 'lucide-react';
import notificationConfig from "@/config/notification.config";

const CreateGroupModal = ({ isOpen, friends, onClose, onCreate, onNotification }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const handleMemberToggle = (friendId) => {
    const updated = new Set(selectedMembers);
    if (updated.has(friendId)) {
      updated.delete(friendId);
    } else {
      updated.add(friendId);
    }
    setSelectedMembers(updated);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) {
      onNotification?.({
        type: 'error',
        message: 'Please enter a group name and select at least one member',
      });
      return;
    }

    setLoading(true);
    try {
      // ✅ FIX: Prepare the payload for the backend
      const payload = {
          name: groupName,
          description: groupDescription,
          member_ids: Array.from(selectedMembers) // Convert Set to Array
      };

      // ✅ FIX: Call the correct API function
      const response = await notificationConfig.CREATE_GROUP(payload);
      
      if (response) {
        onNotification?.({
          type: 'success',
          message: 'Group created successfully!',
        });

        onCreate?.(response);

        // Reset form
        setGroupName('');
        setGroupDescription('');
        setSelectedMembers(new Set());
        onClose?.();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to create group',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-6 overflow-y-auto bg-white rounded-lg shadow-xl w-96 max-h-96">
        <div className="sticky top-0 flex items-center justify-between mb-4 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Create Group</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Group name..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
        />

        <textarea
          placeholder="Group description (optional)..."
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          rows="2"
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select Members ({selectedMembers.size})
        </label>

        <div className="mb-4 space-y-2 overflow-y-auto max-h-40">
          {friends.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No friends to add</p>
          ) : (
            friends.map((friend) => (
              <label
                key={friend.id}
                className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.has(friend.id)}
                  onChange={() => handleMemberToggle(friend.id)}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <div className="flex items-center flex-1 ml-3 space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
                    {(friend.full_name  || friend.username || 'U')?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {friend.full_name  || friend.username}
                    </p>
                    {friend.email && (
                      <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                    )}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={!groupName.trim() || selectedMembers.size === 0 || loading}
          className="flex items-center justify-center w-full gap-2 py-2 font-medium text-white transition bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
          )}
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </div>
  );
};

export default CreateGroupModal;