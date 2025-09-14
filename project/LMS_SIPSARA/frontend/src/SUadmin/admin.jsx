import { useState } from 'react';
import { Users, BookOpen, FileText, Award, Home, BarChart2, TvMinimalPlay  } from 'lucide-react';

import Chatbot from '@/components/aibot';
import Topbar from '@/components/topbar';
import StudentData from '@/components/data/studenData';
import ModuleCreator from '../components/courseData/module';
import AssignmentQuizPanel from '../components/courseData/quiz';
import TeacherFeedbackPanel from '../components/courseData/feedback';





const WelcomeCard = () => (
  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
    <h2 className="text-2xl font-bold mb-2">Welcome back, Teacher!</h2>
    <p className="text-blue-100">Here's an overview of your classes and student activities.</p>
  </div>
);

export default function TeachersDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'assigment', label: 'Assignment', icon: FileText },
    { id: 'live classroom ', label: 'Live Classroom', icon: TvMinimalPlay },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'feedback', label: 'Feedback', icon: BarChart2 },
  ];

  const statsData = [
    {
      title: 'Total Classes',
      value: '8',
      trend: '↑ 12% from last month',
      icon: BookOpen,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Students',
      value: '245',
      trend: '↑ 8% from last month',
      icon: Users,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Lessons Created',
      value: '42',
      trend: '↑ 24% from last month',
      icon: FileText,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Questions',
      value: '186',
      trend: '↑ 16% from last month',
      icon: Award,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    }
  ];

  const recentActivities = [
    {
      text: 'Emily Johnson submitted her assignment in Physics 101',
      time: '2 hours ago',
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      text: 'You created a new lesson "Chemical Equations" in Chemistry',
      time: '5 hours ago',
      icon: FileText,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      text: 'Added 5 new students to Advanced Mathematics',
      time: 'Yesterday',
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      text: 'Monthly reports are ready to review',
      time: '2 days ago',
      icon: BarChart2,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    }
  ];

  const upcomingClasses = [
    {
      name: 'Physics 101',
      time: 'Today, 10:00 - 11:30 AM',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      name: 'Chemistry Fundamentals',
      time: 'Today, 1:00 - 2:30 PM',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      name: 'Advanced Mathematics',
      time: 'Tomorrow, 9:00 - 10:30 AM',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold mb-2">EduTeach</h1>
          <p className="text-sm text-gray-600 mt-1">Teacher Portal</p>
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
                {statsData.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                          <Icon size={24} className={stat.iconColor} />
                        </div>
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        {stat.trend}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <div className={`p-2 rounded-full ${activity.bgColor} flex-shrink-0`}>
                            <Icon size={20} className={activity.iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 font-medium">{activity.text}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
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
                  <h3 className="text-lg font-semibold text-gray-800">Upcoming Classes</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {upcomingClasses.map((classItem, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${classItem.bgColor}`}>
                            <BookOpen size={24} className={classItem.iconColor} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800">{classItem.name}</h4>
                            <p className="text-xs text-gray-600">{classItem.time}</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                          View Class
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'students' && (
          <StudentData/>
        )}
        {activeTab === 'classes' && (
          <ModuleCreator/>
        )}
        {activeTab === 'assigment' && (
          <AssignmentQuizPanel/>
        )}
        {activeTab === 'feedback' && (
          <TeacherFeedbackPanel/>
        )}


         
        </main>

        

        <Chatbot />
      </div>
    </div>
  );
}