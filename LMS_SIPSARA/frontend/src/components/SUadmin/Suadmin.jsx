import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import AnnouncementPanel from '@/components/AnnouncementPanel';
import PaymentData from '@/components/data/paymentdata';
import CourseCreator from '@/components/courseData/course';
import TeamsLMSChat from '@/components/chat';
import UserDataPanel from '@/components/SUadmin/teacheradd';
import Topbar from '@/components/topbar';
import ReceptionistManagementPanel from '@/components/SUadmin/receptionistadd';
import FeedbackPanel from "../courseData/feedback";
import SettingsPanel from '@/components/setting';
import authService  from '@/context/authService'; 
import { userService } from '@/config/user.config';
import { courseService } from '@/config/course.config';
import { paymentService } from '@/config/payment.config';


const COLORS = ['#2DD4BF', '#F59E0B', '#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F97316'];
const userType = (localStorage.getItem("userType") || "").toLowerCase();

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [departmentData, setDepartmentData] = useState([]);
  const [userActivityData, setUserActivityData] = useState([]);
  const [financialData, setFinancialData] = useState([]);
  
  
  // Stats State
  const [teacherCount, setTeacherCount] = useState(0);
  const [receptionistsCount, setReceptionistsCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  
  // Data State
  const [enrollmentData, setEnrollmentData] = useState([]);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      if (typeof authService.getCurrentUser === 'function') {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } else if (authService.getToken()) {
        const token = authService.getToken();
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const userData = JSON.parse(jsonPayload);
          setUser(userData);
        } catch (decodeError) {
          console.warn('Could not decode user from token:', decodeError);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const data = await paymentService.getFinancialStats(selectedPeriod);
        setFinancialData(data);
      } catch (error) {
        console.error("Error fetching financial stats:", error);
      }
    };
    fetchFinancials();
  }, [selectedPeriod]);

  // ✅ Fetch User Activity (for Area Chart)
  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        const data = await userService.getuseractivity();
        setUserActivityData(data);
      } catch (error) {
        console.error("Error fetching user activity:", error);
      }
    };
    fetchUserActivity();
  }, []);

  // ✅ Fetch Department Data
  useEffect(() => {
    const fetchDepartmentData = async () => {
      try {
        const data = await courseService.getCourseDistribution();
        
        // Map colors to the data (cycle through the COLORS array)
        const coloredData = data.map((item, index) => ({
          ...item,
          color: COLORS[index % COLORS.length] // loops colors if there are many depts
        }));

        setDepartmentData(coloredData);
      } catch (error) {
        console.error("Error loading department stats:", error);
        setDepartmentData([]);
      }
    };
    fetchDepartmentData();
  }, []);

  // ✅ Fetch Dashboard Counts
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [students, teachers, courses, receptionists] = await Promise.all([
          userService.getStudentsCount().catch(() => 0),
          userService.getTeachersCount().catch(() => 0),
          courseService.getCoursesCount().catch(() => 0),
          userService.getReceptionistsCount().catch(() => 0)
        ]);

        setStudentsCount(students);
        setTeacherCount(teachers);
        setCoursesCount(courses);
        setReceptionistsCount(receptionists);
        setLoadingStats(false);
      } catch (err) {
        console.error("Error loading dashboard stats", err);
        setLoadingStats(false);
      }
    };
    loadStats();
  }, []); 

  // ✅ Fetch Enrollment Data for the Chart
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      try {
        const data = await courseService.getEnrollmentStats();
        
        if (Array.isArray(data)) {
          setEnrollmentData(data);
        } else {
          console.warn("API did not return an array", data);
          setEnrollmentData([]);
        }
      } catch (error) {
        console.error('Error fetching enrollment data:', error);
        setEnrollmentData([]);
      }
    };
    fetchEnrollmentData();
  }, []);



  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab}
       setActiveTab={setActiveTab}
       userType={userType} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && (
            <div className="p-8 space-y-8">
              {/* Welcome Card */}
              <div className="relative p-8 overflow-hidden text-white shadow-lg rounded-2xl bg-gradient-to-r from-orange-600 to-red-600">
                <h2 className="mb-2 text-2xl font-bold">
                  Welcome back{user ? `, ${user.username || user.name || 'User'}` : ""}!
                </h2>
              </div>          

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="mt-2 text-3xl font-bold text-gray-800">{studentsCount}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <TrendingUp className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Active enrollments</p>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                      <p className="mt-2 text-3xl font-bold text-gray-800">{teacherCount}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="text-green-600" size={24} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Registered instructors</p>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Courses</p>
                      <p className="mt-2 text-3xl font-bold text-gray-800">{coursesCount}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="text-purple-600" size={24} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Active programs</p>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Receptionists</p>
                      <p className="mt-2 text-3xl font-bold text-gray-800">{receptionistsCount}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <TrendingUp className="text-yellow-600" size={24} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Support staff</p>
                </div>
              </div>

              {/* First Row Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                
                {/* ✅ FIXED: User Traffic Chart uses stacked areas for student/instructor/receptionist */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">User Traffic</h3>
                    <p className="text-sm text-gray-500">Monthly user activity</p>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userActivityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorStudent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorInstructor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorReceptionist" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />

                      <Area 
                        type="monotone" 
                        dataKey="student" 
                        stackId="1" 
                        stroke="#3B82F6" 
                        fill="url(#colorStudent)" 
                        name="Students" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="instructor" 
                        stackId="1" 
                        stroke="#10B981" 
                        fill="url(#colorInstructor)" 
                        name="Instructors" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="receptionist" 
                        stackId="1" 
                        stroke="#F59E0B" 
                        fill="url(#colorReceptionist)" 
                        name="Receptionists" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Financial Overview</h3>
                      <p className="text-sm text-gray-500">Income, expenses, and profit analysis</p>
                    </div>
                    {/* Period Toggle Buttons */}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedPeriod('monthly')} 
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedPeriod === 'monthly' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Monthly
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('yearly')} 
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedPeriod === 'yearly' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Yearly
                      </button>
                    </div>
                  </div>

                  {/* 👇 3. UPDATED LINE CHART */}
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart 
                      data={financialData} // ✅ Uses dynamic data
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      
                      {/* XAxis matches the 'name' key from API (Jan, Feb or 2023, 2024) */}
                      <XAxis dataKey="name" stroke="#6b7280" />
                      
                      <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value/1000).toFixed(0)}K`} />
                      
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                        formatter={(value) => `Rs. ${value.toLocaleString()}`} 
                      />
                      <Legend />
                      
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#10B981" 
                        strokeWidth={3} 
                        dot={{ fill: '#10B981', r: 5 }} 
                        activeDot={{ r: 7 }} 
                        name="Income"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#EF4444" 
                        strokeWidth={3} 
                        dot={{ fill: '#EF4444', r: 5 }} 
                        activeDot={{ r: 7 }} 
                        name="Expenses"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#3B82F6" 
                        strokeWidth={3} 
                        dot={{ fill: '#3B82F6', r: 5 }} 
                        activeDot={{ r: 7 }} 
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Second Row Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                
                <div className="p-6 bg-white rounded-lg shadow">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Course Enrollment Status</h3>
                  <p className="text-sm text-gray-500">Current enrollments (Active)</p>
                </div>
                
                <div className="w-full h-[350px]"> {/* Increased container height slightly */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={enrollmentData} 
                      margin={{ top: 20, right: 30, left: 0, bottom: 80 }} // ✅ Increased bottom margin to 80px
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      
                      <XAxis 
                        dataKey="course" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} // ✅ Allocated more height for rotated labels
                        interval={0} // Force show all labels
                        stroke="#6b7280"
                        tick={{ fontSize: 11, fill: '#4B5563' }} // Tailwind gray-600
                      />
                      
                      <YAxis 
                        stroke="#6b7280" 
                        allowDecimals={false} 
                        tick={{ fontSize: 12, fill: '#4B5563' }}
                      />
                      
                      <Tooltip 
                        cursor={{ fill: '#F9FAFB' }} // Tailwind gray-50 hover effect
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '0.5rem', // Tailwind rounded-lg
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' // Tailwind shadow-md
                        }} 
                      />
                      
                      <Legend 
                        verticalAlign="top" // ✅ Moved Legend to the top
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '0px', paddingBottom: '10px' }}
                      />
                      
                      <Bar 
                        dataKey="enrolled" 
                        fill="#3B82F6" // Tailwind blue-500
                        name="Enrolled Students" 
                        radius={[4, 4, 0, 0]} 
                        barSize={40}
                        activeBar={{ fill: '#2563EB' }} // Darker blue on hover (blue-600)
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Course Distribution by Department</h3>
                    <p className="text-sm text-gray-500">Percentage of courses per department</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={departmentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {departmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {departmentData.map((dept, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: dept.color }}></div>
                        <span className="text-sm text-gray-700">{dept.name}</span>
                        <span className="text-sm font-semibold text-gray-900">({dept.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && <PaymentData />}
          {activeTab === 'programs' && <CourseCreator />}
          {activeTab === 'announcements' && <AnnouncementPanel />}
          {activeTab === 'lecturers' && <UserDataPanel />}
          {activeTab === 'receptionists' && <ReceptionistManagementPanel />}
          {activeTab === 'chat' && <TeamsLMSChat />}
          {activeTab === 'settings' && <SettingsPanel />}
          {activeTab === 'feedback' && <FeedbackPanel />}
        </main>
      </div>
    </div>
  );
}