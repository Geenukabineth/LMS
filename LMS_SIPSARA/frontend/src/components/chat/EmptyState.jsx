import React from 'react';
import { MessageCircle } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-500">Start Chatting!</p>
        <p className="mt-2 text-sm text-gray-400">
          Select a chat from the list or create a new conversation
        </p>
      </div>
    </div>
  );
};

export default EmptyState;