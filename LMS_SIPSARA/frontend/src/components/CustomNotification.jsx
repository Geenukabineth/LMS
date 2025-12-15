import React from 'react';
import { Check, X } from 'lucide-react';

function CustomNotification({ message, type, onClose }) {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? <Check className="w-5 h-5 text-white" /> : <X className="w-5 h-5 text-white" />;

    return (
        <div className={`fixed top-8 right-8 p-4 rounded-xl shadow-lg text-white ${bgColor} flex items-center space-x-2 z-50`}>
            {icon}
            <span>{message}</span>
            
        </div>
    );
}

export default CustomNotification;