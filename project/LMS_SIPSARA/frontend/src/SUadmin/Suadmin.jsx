import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Users, Book, BookOpen, CheckSquare, FileText, Home, User, LogOut, Settings, CreditCard, AlertCircle, CheckCircle, MessagesSquare } from 'lucide-react';
import AnnouncementPanel from '@/components/announcement';
import PaymentData from '@/components/data/paymentdata';
import CourseCreator from '@/components/courseData/course';
import TeamsLMSChat from '@/components/chat';
import UserDataPanel from '@/components/data/userdata';
import CourseList from '@/components/courseData/viewmodules';
import Topbar from '@/components/topbar'

const WelcomeCard = () => (
  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
    <h2 className="text-2xl font-bold mb-2">Welcome back, Admin!</h2>
    <p className="text-blue-100">Here's what's happening with your institution today.</p>
  </div>
);


const websiteTrafficData = [
  { name: 'Jan', Students: 30, Teachers: 20, Admins: 45, Staffs: 40 },
  { name: 'Feb', Students: 25, Teachers: 18, Admins: 30, Staffs: 65 },
  { name: 'Mar', Students: 28, Teachers: 20, Admins: 25, Staffs: 70 },
  { name: 'Apr', Students: 30, Teachers: 17, Admins: 48, Staffs: 40 },
  { name: 'May', Students: 25, Teachers: 20, Admins: 20, Staffs: 30 },
  { name: 'Jun', Students: 30, Teachers: 22, Admins: 50, Staffs: 25 },
];

const enrollmentData = [
  { name: 'Course A', CompS: 85, Architecture: 35, CivilEng: 45, Accounting: 75, BusinessMan: 60 },
  { name: 'Course B', CompS: 30, Architecture: 70, CivilEng: 30, Accounting: 80, BusinessMan: 75 },
  { name: 'Course C', CompS: 45, Architecture: 20, CivilEng: 65, Accounting: 35, BusinessMan: 55 },
  { name: 'Course D', CompS: 20, Architecture: 70, CivilEng: 35, Accounting: 25, BusinessMan: 90 },
  { name: 'Course E', CompS: 40, Architecture: 25, CivilEng: 60, Accounting: 45, BusinessMan: 30 },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'lecturers', label: 'Lecturers', icon: Users },
    { id: 'programs', label: 'Programs & Courses', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'announcements', label: 'Announcements', icon: AlertCircle },
    { id: 'chat', label: 'Chat', icon: MessagesSquare },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold mb-2">EduTeach</h1>
          <p className="text-sm text-gray-600 mt-1">Admin Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm">
          <Topbar />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <WelcomeCard />

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Students</p>
                      <h3 className="text-2xl font-bold text-gray-900">1,234</h3>
                    </div>
                    <div className="p-3 bg-teal-100 rounded-full">
                      <Users size={24} className="text-teal-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Lecturers</p>
                      <h3 className="text-2xl font-bold text-gray-900">87</h3>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-full">
                      <Users size={24} className="text-amber-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Staff</p>
                      <h3 className="text-2xl font-bold text-gray-900">45</h3>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Users size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Courses</p>
                      <h3 className="text-2xl font-bold text-gray-900">23</h3>
                    </div>
                    <div className="p-3 bg-pink-100 rounded-full">
                      <Book size={24} className="text-pink-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Course List Section */}
              <CourseList />

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Website Traffic</h3>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 8V6a3 3 0 013-3h10a1 1 0 011 1v10a1 1 0 01-1 1H6a1 1 0 01-1-1V8H3zm2-2v10h10V4H5zm5 4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={websiteTrafficData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Students" stroke="#2DD4BF" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="Teachers" stroke="#F59E0B" />
                      <Line type="monotone" dataKey="Admins" stroke="#A855F7" />
                      <Line type="monotone" dataKey="Staffs" stroke="#EC4899" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Enrollment per Course</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={enrollmentData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="CompS" fill="#2DD4BF" />
                      <Bar dataKey="Architecture" fill="#F59E0B" />
                      <Bar dataKey="CivilEng" fill="#A855F7" />
                      <Bar dataKey="Accounting" fill="#EC4899" />
                      <Bar dataKey="BusinessMan" fill="#6B7280" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && <PaymentData />}
          {activeTab === 'programs' && <CourseCreator />}
          {activeTab === 'announcements' && <AnnouncementPanel />}
          {activeTab === 'lecturers' && <UserDataPanel />}
          {activeTab === 'chat' && <TeamsLMSChat />}
          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}