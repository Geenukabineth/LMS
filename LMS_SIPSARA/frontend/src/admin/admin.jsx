import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  FileText,
  Award,
  Home,
  BarChart2,
  TvMinimalPlay,
  Settings,
  MessageSquare,
  CreditCard,
} from 'lucide-react';

import Chatbot from '@/components/aibot';
import Topbar from '@/components/topbar';
import StudentData from '@/components/data/studenData';
import ModuleCreator from '../components/courseData/module';
import AssignmentQuizPanel from '../components/courseData/quiz';
import TeacherFeedbackPanel from '../components/courseData/feedback';
import SettingsPanel from '@/components/setting';
import TeamsLMSChat from '@/components/chat';
import authService from '@/services/authService';
import TeacherPaymentPage from '@/components/data/Teacherpaymentpage ';

const WelcomeCard = ({ teacherName }) => (
  <div className="p-6 text-white rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-purple-600">
    <h2 className="mb-2 text-2xl font-bold">
      Welcome back, {teacherName || 'Teacher'}!
    </h2>
    <p className="text-blue-100">
      Here's an overview of your classes and student activities.
    </p>
  </div>
);

export default function TeachersDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [coursesCount, setCoursesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'assigment', label: 'Assignment', icon: FileText },
    { id: 'live classroom', label: 'Live Classroom', icon: TvMinimalPlay },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'feedback', label: 'Feedback', icon: BarChart2 },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ✅ Fetch teacher data and ID first
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const token = authService.getAuthToken();

        if (!token) {
          throw new Error('No authentication token found. Please login.');
        }

        // Fetch user data to get teacher information
        const response = await fetch('http://localhost:8000/lms/user/me/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Authentication failed - token may be expired');
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            window.location.href = '/login';
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTeacherData(data);
        
        // Get teacher ID from the response
        // Adjust this based on your API response structure
        const teacherIdFromResponse = data.teacher_id || data.profile?.teacher_id || data.id;
        setTeacherId(teacherIdFromResponse);
        
        // Store teacher ID in localStorage for future use
        localStorage.setItem('teacher_id', teacherIdFromResponse);
        
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        setError(error.message);
      }
    };

    fetchTeacherData();
  }, []);

  // ✅ FIXED: Fetch teacher's course count using the correct endpoint
  useEffect(() => {
    const fetchCourseCount = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('authToken');

        if (!token) {
          throw new Error('No authentication token found. Please login.');
        }

        // ✅ FIXED: Use /courses/teacher/count/ endpoint instead of /courses/count/?teacher_id=...
        // This endpoint automatically filters by the authenticated teacher
        const response = await fetch(
          `http://localhost:8000/Course/courses/teacher/count/`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Authentication failed - token may be expired');
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('teacher_id');
            window.location.href = '/login';
            return;
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch course count');
        }

        const data = await response.json();
        console.log('✅ Course count fetched:', data);
        setCoursesCount(data.course_count || 0);
      } catch (error) {
        console.error('Error fetching course count:', error);
        setError(error.message);
        setCoursesCount(0);
      } finally {
        setLoading(false);
      }
    };

    // Call this immediately when component mounts
    fetchCourseCount();
  }, []); // Empty dependency - fetch once on mount

  const statsData = [
    {
      title: 'Total Classes',
      value: loading ? '...' : coursesCount,
      trend: '↑ 12% from last month',
      icon: BookOpen,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Students',
      value: 245,
      trend: '↑ 8% from last month',
      icon: Users,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Lessons Created',
      value: 42,
      trend: '↑ 24% from last month',
      icon: FileText,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Questions',
      value: 186,
      trend: '↑ 16% from last month',
      icon: Award,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  ];

  const recentActivities = [
    {
      text: 'Emily Johnson submitted her assignment in Physics 101',
      time: '2 hours ago',
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      text: 'You created a new lesson "Chemical Equations" in Chemistry',
      time: '5 hours ago',
      icon: FileText,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      text: 'Added 5 new students to Advanced Mathematics',
      time: 'Yesterday',
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      text: 'Monthly reports are ready to review',
      time: '2 days ago',
      icon: BarChart2,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  ];

  const upcomingClasses = [
    {
      name: 'Physics 101',
      time: 'Today, 10:00 - 11:30 AM',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Chemistry Fundamentals',
      time: 'Today, 1:00 - 2:30 PM',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      name: 'Advanced Mathematics',
      time: 'Tomorrow, 9:00 - 10:30 AM',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
              <img
                src="/logos/master_logo.png"        // 👈 path to your logo file
                alt="Sipsara Logo"
                  // adjust size/style
              />
              
            </div>
          <p className="mt-1 text-sm text-gray-600">Teacher Portal</p>
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
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm">
          <Topbar />
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <WelcomeCard 
                teacherName={teacherData?.profile?.full_name || teacherData?.username} 
              />

              {/* Show error message if any */}
              {error && (
                <div className="relative px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statsData.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="p-6 bg-white rounded-lg shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {stat.title}
                          </p>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {stat.value}
                          </h3>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                          <Icon size={24} className={stat.iconColor} />
                        </div>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {stat.trend}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Recent Activity
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <div
                            className={`p-2 rounded-full ${activity.bgColor} flex-shrink-0`}
                          >
                            <Icon size={20} className={activity.iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {activity.text}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Upcoming Classes */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Upcoming Classes
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {upcomingClasses.map((classItem, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`p-3 rounded-full ${classItem.bgColor}`}
                          >
                            <BookOpen size={24} className={classItem.iconColor} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800">
                              {classItem.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {classItem.time}
                            </p>
                          </div>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
                          View Class
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && <StudentData />}
          {activeTab === 'classes' && <ModuleCreator />}
          {activeTab === 'assigment' && <AssignmentQuizPanel />}
          {activeTab === 'feedback' && <TeacherFeedbackPanel />}
          {activeTab === 'payment' && <TeacherPaymentPage />}
          {activeTab === 'chat' && <TeamsLMSChat />}
          {activeTab === 'settings' && <SettingsPanel />}
        </main>

        <Chatbot />
      </div>
    </div>
  );
}