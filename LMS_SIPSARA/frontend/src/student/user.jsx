import { useState } from 'react';
import { BarChart2, BookOpen, FileText, FileVideo, CreditCard, Settings, MessagesSquare, Clock, ShoppingCart } from 'lucide-react';
import Topbar from '@/components/topbar'
import SettingsPanel from '@/components/setting';
import TeamsLMSChat from '@/components/chat';
import StudentCourseView from '../components/courseData/Studentcourseview';

import StudentAssignments from './StudentAssignments';
import StudentPaymentHistory from './StudentPaymentHistory';
import CourseBrowsePage from './CourseBrowsePage';
import Chatbot from '@/components/aibot';


const StudentPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const courses = [
    { id: 1, name: "Calculus II", instructor: "Prof. Smith", progress: 85, nextClass: "Tomorrow, 10 AM", color: "blue" },
    { id: 2, name: "Physics 101", instructor: "Prof. Jones", progress: 70, nextClass: "Today, 2 PM", color: "green" },
    { id: 3, name: "English Lit", instructor: "Prof. Brown", progress: 90, nextClass: "Tomorrow, 1 PM", color: "purple" },
  ];
  
  const assignments = [
    { id: 1, title: "Math Problem Set", course: "Calculus II", due: "Tomorrow", status: "urgent" },
    { id: 2, title: "Physics Lab Report", course: "Physics 101", due: "In 3 days", status: "normal" },
    { id: 3, title: "Essay Draft", course: "English Lit", due: "In 5 days", status: "normal" },
  ];
  
  const announcements = [
    { id: 1, course: "Calculus II", message: "Midterm review session scheduled.", time: "2 hours ago" },
    { id: 2, course: "Physics 101", message: "Lab equipment updated.", time: "Yesterday" },
  ];
  
  const events = [
    { id: 1, title: "Physics 101 Lecture", time: "10:00 AM - 11:30 AM", location: "Room 204" },
    { id: 2, title: "Study Group", time: "2:00 PM - 3:00 PM", location: "Library" },
  ];

  const getProgressColor = (color) => {
    const colors = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500"
    };
    return colors[color] || "bg-gray-500";
  };

  const navItems = [
    { key: 'dashboard', icon: BarChart2, label: 'Dashboard' },
    { key: 'courses', icon: BookOpen, label: 'My Courses' },
    { key: 'browse', icon: ShoppingCart, label: 'Browse Courses' },
    { key: 'assignments', icon: FileText, label: 'Assignments' },
    { key: 'chat', icon: MessagesSquare, label: 'Chat' },
    { key: 'payment', icon: CreditCard, label: 'Payment History' },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
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
          <p className="mt-1 text-sm text-gray-600">Student Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.key
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <Topbar/>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Dashboard Content */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <div className="p-6 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <h3 className="mb-2 text-2xl font-bold">Welcome back, John!</h3>
                <p className="mb-4 text-blue-100">Ready to continue your learning journey?</p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Clock size={16} />
                    <span className="text-sm">4 Upcoming Assignments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileVideo size={16} />
                    <span className="text-sm">3 Events Today</span>
                  </div>
                </div>
              </div>
              
              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Course Progress */}
                <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Course Progress</h3>
                    <button 
                      onClick={() => setActiveTab('courses')}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {courses.map(course => (
                      <div key={course.id} className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">{course.name}</h4>
                          <span className="text-xs text-gray-500">{course.nextClass}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getProgressColor(course.color)}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">{course.instructor}</span>
                              <span className="text-sm font-medium text-gray-800">{course.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(course.color)}`}
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Upcoming Assignments */}
                <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Upcoming Assignments</h3>
                    <button 
                      onClick={() => setActiveTab('assignments')}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {assignments.map(assignment => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div>
                          <h4 className="font-medium text-gray-800">{assignment.title}</h4>
                          <p className="text-sm text-gray-600">{assignment.course}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          assignment.status === 'urgent' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          Due {assignment.due}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Announcements */}
                <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Announcements</h3>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {announcements.map(announcement => (
                      <div key={announcement.id} className="py-2 pl-4 border-l-4 border-blue-500">
                        <h4 className="font-medium text-gray-800">{announcement.course}</h4>
                        <p className="mb-1 text-sm text-gray-600">{announcement.message}</p>
                        <span className="text-xs text-gray-500">{announcement.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Today's Schedule */}
                <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Today's Schedule</h3>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {events.map(event => (
                      <div key={event.id} className="flex items-start p-3 space-x-3 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg">
                          <Clock size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{event.title}</h4>
                          <p className="text-sm text-gray-600">{event.time}</p>
                          <p className="text-sm text-gray-500">{event.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Browse Courses Tab */}
          {activeTab === 'browse' && <CourseBrowsePage />}

          {/* My Courses Tab */}
          {activeTab === 'courses' && <StudentCourseView />}

          {/* Payment History Tab */}
          {activeTab === 'payment' && <StudentPaymentHistory />}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && <StudentAssignments />}

          {/* Chat Tab */}
          {activeTab === 'chat' && <TeamsLMSChat />}

          {/* Settings Tab */}
          {activeTab === 'settings' && <SettingsPanel />}
          
        </div>

        {/* Floating Chatbot Button */}
        <Chatbot />
        
      </div>
    </div>
  );
};

export default StudentPortal;