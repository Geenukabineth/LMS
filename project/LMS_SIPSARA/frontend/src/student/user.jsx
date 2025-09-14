import { useState } from 'react';
import { BarChart2, BookOpen, FileText, FileVideo, CreditCard, Settings, Clock } from 'lucide-react';
import Topbar from '@/components/topbar'


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
    { key: 'courses', icon: BookOpen, label: 'Courses' },
    { key: 'assignments', icon: FileText, label: 'Assignments' },
    { key: 'videos', icon: FileVideo, label: 'Videos' },
    { key: 'payment', icon: CreditCard, label: 'Payment' },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold mb-2">EduTeach</h1>
            <p className="text-sm text-gray-600 mt-1">Student Portal</p>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <Topbar/>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Dashboard Content */},
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Welcome back, John!</h3>
                <p className="text-blue-100 mb-4">Ready to continue your learning journey?</p>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Progress */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Course Progress</h3>
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {courses.map(course => (
                      <div key={course.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
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
                            <div className="w-full bg-gray-200 rounded-full h-2">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Upcoming Assignments</h3>
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {assignments.map(assignment => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Announcements</h3>
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {announcements.map(announcement => (
                      <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <h4 className="font-medium text-gray-800">{announcement.course}</h4>
                        <p className="text-sm text-gray-600 mb-1">{announcement.message}</p>
                        <span className="text-xs text-gray-500">{announcement.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Today's Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Today's Schedule</h3>
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {events.map(event => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
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

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Payment Center</h3>
              <p className="text-gray-600 mb-6">Manage your tuition payments and financial aid.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <h4 className="text-lg font-semibold mb-2">Current Balance</h4>
                  <p className="text-3xl font-bold">$2,450</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <h4 className="text-lg font-semibold mb-2">Next Payment Due</h4>
                  <p className="text-xl font-bold">March 15, 2025</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <h4 className="text-lg font-semibold mb-2">Financial Aid</h4>
                  <p className="text-xl font-bold">$5,000</p>
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">My Courses</h3>
              <p className="text-gray-600">View and manage your enrolled courses.</p>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Assignments</h3>
              <p className="text-gray-600">Track your assignments and submissions.</p>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Video Library</h3>
              <p className="text-gray-600">Access recorded lectures and educational videos.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Settings</h3>
              <p className="text-gray-600">Manage your account settings and preferences.</p>
            </div>
          )}
        </div>

        {/* Floating Chatbot Button */}
        <div className="fixed bottom-6 right-6">
          <button className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;