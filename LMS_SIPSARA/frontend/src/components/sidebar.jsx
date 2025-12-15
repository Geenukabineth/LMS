import React from 'react';
import { Users, Book, BookOpen, DollarSign, LogOut, Settings, MessagesSquare, Home } from 'lucide-react';
import authService from '@/services/authService';
import logo from '@/assets/master_logo.png';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'lecturers', label: 'Lecturers', icon: Users },
    { id: 'programs', label: 'Programs & Courses', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'announcements', label: 'Announcements', icon: Book },
    { id: 'chat', label: 'Chat', icon: MessagesSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="flex flex-col w-64 h-screen bg-white border-r border-gray-200">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <img src={logo} alt="Logo" className="h-12" />
        </div>
        <h2 className="font-semibold text-center text-gray-700">Admin Portal</h2>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 space-x-3 text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;