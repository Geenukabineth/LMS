import React from 'react';
import { Users } from 'lucide-react';
import notificationConfig from "@/config/notification.config";


const GroupsList = ({ groups, selectedChat, onSelectChat, onNotification }) => {
  const handleSelectGroup = async (group) => {
    try {
      // Fetch group details
      const groupDetail = await notificationConfig.GROUP_DETAIL(group.id);
      onSelectChat?.(groupDetail || group);
    } catch (error) {
      console.error('Error loading group:', error);
      // Fall back to the group object we have
      onSelectChat?.(group);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No groups yet.</p>
        <p className="mt-1 text-xs">Create or join a group to get started</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="px-2 mb-2 font-semibold text-gray-700">
        Groups ({groups.length})
      </h3>
      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.id}
            onClick={() => handleSelectGroup(group)}
            className={`p-3 rounded-lg cursor-pointer transition mb-2 ${
              selectedChat?.id === group.id
                ? 'bg-purple-100 border-2 border-purple-600'
                : 'hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0 space-x-3">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-sm font-bold text-white rounded-full bg-gradient-to-br from-green-400 to-green-600">
                  {(group.name || 'G')?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {group.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {group.members?.length || 0} members
                  </p>
                  {group.description && (
                    <p className="text-xs text-gray-500 truncate">
                      {group.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupsList;