import React from 'react';
import { Plus } from 'lucide-react';


const ActionButtons = ({ onAddFriend, onCreateGroup }) => {
  return (
    <div className="flex p-4 space-x-2 border-t border-gray-200">
      <button
        onClick={onAddFriend}
        className="flex items-center justify-center flex-1 py-2 space-x-2 font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
      >
        <Plus className="w-5 h-5" />
        <span>Friend</span>
      </button>
      <button
        onClick={onCreateGroup}
        className="flex items-center justify-center flex-1 py-2 space-x-2 font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
      >
        <Plus className="w-5 h-5" />
        <span>Group</span>
      </button>
    </div>
  );
};

export default ActionButtons;