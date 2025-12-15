import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import AnnouncementPanel from '@/components/AnnouncementPanel';
import PaymentData from '@/components/data/paymentdata';
import CourseCreator from '@/components/courseData/course';
import TeamsLMSChat from '@/components/chat';
import UserDataPanel from '@/components/data/userdata';
import Topbar from '@/components/topbar';
import SettingsPanel from '@/components/setting';
import authService  from '@/services/authService'; // ✅ Import centralized auth service
import { API_USER_ENDPOINTS } from '@/config/userapi'; // ✅ Import API base URL
import { API_COURSE_ENDPOINTS } from '@/config/courseapi'; // ✅ Import API base URL


export const API_BASE_URL = 'http://localhost:8000';

const WelcomeCard = () => (
  <div className="p-6 text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
    <h2 className="mb-2 text-2xl font-bold">Welcome back, Admin!</h2>
    <p className="text-blue-100">Here's what's happening with your institution today.</p>
  </div>
);

// Sample data for charts - Replace with real API data
const websiteTrafficData = [
  { month: 'Jan', students: 245, teachers: 45, staff: 12, total: 302 },
  { month: 'Feb', students: 290, teachers: 48, staff: 12, total: 350 },
  { month: 'Mar', students: 335, teachers: 52, staff: 13, total: 400 },
  { month: 'Apr', students: 380, teachers: 55, staff: 14, total: 449 },
  { month: 'May', students: 425, teachers: 58, staff: 14, total: 497 },
  { month: 'Jun', students: 470, teachers: 62, staff: 15, total: 547 },
  { month: 'Jul', students: 520, teachers: 65, staff: 15, total: 600 },
  { month: 'Aug', students: 565, teachers: 68, staff: 16, total: 649 },
  { month: 'Sep', students: 610, teachers: 70, staff: 16, total: 696 },
  { month: 'Oct', students: 655, teachers: 73, staff: 17, total: 745 },
  { month: 'Nov', students: 700, teachers: 75, staff: 17, total: 792 },
  { month: 'Dec', students: 745, teachers: 78, staff: 18, total: 841 },
];

// Monthly income data
const monthlyIncomeData = [
  { month: 'Jan', income: 450000, expenses: 320000, profit: 130000 },
  { month: 'Feb', income: 520000, expenses: 340000, profit: 180000 },
  { month: 'Mar', income: 680000, expenses: 380000, profit: 300000 },
  { month: 'Apr', income: 750000, expenses: 400000, profit: 350000 },
  { month: 'May', income: 820000, expenses: 420000, profit: 400000 },
  { month: 'Jun', income: 950000, expenses: 450000, profit: 500000 },
  { month: 'Jul', income: 1050000, expenses: 480000, profit: 570000 },
  { month: 'Aug', income: 1120000, expenses: 500000, profit: 620000 },
  { month: 'Sep', income: 980000, expenses: 470000, profit: 510000 },
  { month: 'Oct', income: 890000, expenses: 460000, profit: 430000 },
  { month: 'Nov', income: 920000, expenses: 450000, profit: 470000 },
  { month: 'Dec', income: 1200000, expenses: 520000, profit: 680000 },
];

// Yearly income comparison
const yearlyIncomeData = [
  { year: '2020', income: 6500000, expenses: 4200000, profit: 2300000 },
  { year: '2021', income: 7800000, expenses: 4800000, profit: 3000000 },
  { year: '2022', income: 9200000, expenses: 5400000, profit: 3800000 },
  { year: '2023', income: 10500000, expenses: 5900000, profit: 4600000 },
  { year: '2024', income: 11330000, expenses: 5550000, profit: 5780000 },
];

// Enrollment per course data
const enrollmentData = [
  { course: 'Mathematics O/L', enrolled: 145, capacity: 200, percentage: 73 },
  { course: 'Physics A/L', enrolled: 98, capacity: 150, percentage: 65 },
  { course: 'English', enrolled: 187, capacity: 200, percentage: 94 },
  { course: 'Chemistry A/L', enrolled: 112, capacity: 150, percentage: 75 },
  { course: 'Biology O/L', enrolled: 156, capacity: 200, percentage: 78 },
  { course: 'ICT', enrolled: 134, capacity: 180, percentage: 74 },
  { course: 'Commerce', enrolled: 89, capacity: 120, percentage: 74 },
  { course: 'Sinhala', enrolled: 167, capacity: 200, percentage: 84 },
];

// Course distribution by department
const departmentData = [
  { name: 'Science', value: 35, color: '#2DD4BF' },
  { name: 'Mathematics', value: 28, color: '#F59E0B' },
  { name: 'Languages', value: 22, color: '#A855F7' },
  { name: 'Commerce', value: 15, color: '#EC4899' },
];

const COLORS = ['#2DD4BF', '#F59E0B', '#A855F7', '#EC4899'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teacherCount, setTeacherCount] = useState(0);
  const [receptionistsCount, setReceptionistsCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

 

  // ✅ Use centralized auth service for API calls
  const fetchWithAuth = async (url) => {
    const token = authService.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders() // ✅ Use auth service method
    };

    try {
      const response = await fetch(url, { headers });
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  // ✅ Check authentication on mount
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      console.warn('User is not authenticated');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
  }, []);

  // ✅ Fetch student count with auth service
useEffect(() => {
  const fetchStudentCount = async () => {
    try {
      const response = await fetchWithAuth(API_USER_ENDPOINTS.STUDENT_LIST);

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }

      const data = await response.json();

      console.log("Student API data:", data);

      setStudentsCount(data?.count ?? 0);
    } catch (error) {
      console.error("Error fetching student count:", error);
      setStudentsCount(0);
    }
  };

  fetchStudentCount();
}, []);


   


  // ✅ Fetch teacher count with auth service
  useEffect(() => {
  const fetchTeacherCount = async () => {
    try {
      const response = await fetchWithAuth(API_USER_ENDPOINTS.TEACHER_LIST);

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher: ${response.status}`);
      }

      const data = await response.json();

      console.log("Teacher API data:", data);

      // ✅ This WILL work now
      setTeacherCount(data?.count ?? 0);

    } catch (error) {
      console.error("Error fetching teacher count:", error);
      setTeacherCount(0);
    }
  };

  fetchTeacherCount();
}, []);


  // ✅ Fetch courses count with auth service
  useEffect(() => {
    const fetchCoursesCount = async () => {
      try {
        const response = await fetchWithAuth(API_COURSE_ENDPOINTS.COURSE_LIST);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Authentication expired, attempting refresh...');
            await authService.refreshToken();
            const retryResponse = await fetchWithAuth(`${API_BASE_URL}/lms/course/list/`);
            if (!retryResponse.ok) throw new Error('Failed after token refresh');
            const data = await retryResponse.json();
            processCoursesData(data);
            return;
          }
          throw new Error(`Failed to fetch courses: ${response.status}`);
        }
        
        const data = await response.json();
        processCoursesData(data);
        
      } catch (error) {
        console.error("Error fetching courses count:", error);
        setCoursesCount(0);
      }
    };

    const processCoursesData = (data) => {
      console.log('Courses data:', data);
      
      let count = 0;
      if (data.count !== undefined) {
        count = data.count;
      } else if (data.courses && Array.isArray(data.courses)) {
        count = data.courses.length;
      } else if (Array.isArray(data)) {
        count = data.length;
      } else if (data.results && Array.isArray(data.results)) {
        count = data.results.length;
      }
      
      setCoursesCount(count);
      console.log('Courses count set to:', count);
    };

    fetchCoursesCount();
  }, [API_BASE_URL]);

  // ✅ Fetch receptionist count with auth service
  useEffect(() => {
    const fetchReceptionistsCount = async () => {
      try {
        const response = await fetchWithAuth(API_USER_ENDPOINTS.RECEPTIONIST_LIST);
        
        if (!response.ok) {
        throw new Error(`Failed to fetch teacher: ${response.status}`);
      }

      const data = await response.json();

      console.log("Teacher API data:", data);

      // ✅ This WILL work now
      setReceptionistsCount(data?.count ?? 0);

    } catch (error) {
      console.error("Error fetching teacher count:", error);
      setReceptionistsCount(0);
    }
  };

  fetchReceptionistsCount();
}, []);

  useEffect(() => {
    if (teacherCount > 0 && studentsCount > 0 && coursesCount > 0 && receptionistsCount >= 0) {
      setLoadingStats(false);
    }
  }, [teacherCount, studentsCount, coursesCount, receptionistsCount]);

  const formatCurrency = (value) => {
    return `Rs.${(value / 1000).toFixed(1)}K`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && (
            <div className="p-8 space-y-8">
              {/* Welcome Card */}
              <WelcomeCard />

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Students */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="mt-2 text-3xl font-bold text-gray-800">
                        {studentsCount}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <TrendingUp className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Active enrollments</p>
                </div>

                {/* Total Teachers */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                      <p className="mt-2 text-3xl font-bold text-gray-800">
                        {teacherCount}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="text-green-600" size={24} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Registered instructors</p>
                </div>

                {/* Total Courses */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Courses</p>
                      <p className="mt-2 text-3xl font-bold text-gray-800">
                        {loadingStats ? '...' : coursesCount}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="text-purple-600" size={24} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Active programs</p>
                </div>

                {/* Receptionists */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Receptionists</p>
                      <p className="mt-2 text-3xl font-bold text-gray-800">
                        { receptionistsCount}
                      </p>
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
                {/* User Traffic Area Chart */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">User Traffic</h3>
                    <p className="text-sm text-gray-500">Monthly user activity</p>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={websiteTrafficData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3B82F6" 
                        fillOpacity={1} 
                        fill="url(#colorStudents)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Income Chart with Period Toggle */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Financial Overview</h3>
                      <p className="text-sm text-gray-500">Income, expenses, and profit analysis</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPeriod('monthly')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          selectedPeriod === 'monthly'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setSelectedPeriod('yearly')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          selectedPeriod === 'yearly'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Yearly
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart
                      data={selectedPeriod === 'monthly' ? monthlyIncomeData : yearlyIncomeData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey={selectedPeriod === 'monthly' ? 'month' : 'year'} 
                        stroke="#6b7280" 
                      />
                      <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value/1000).toFixed(0)}K`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', r: 5 }}
                        activeDot={{ r: 7 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#EF4444" 
                        strokeWidth={3}
                        dot={{ fill: '#EF4444', r: 5 }}
                        activeDot={{ r: 7 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', r: 5 }}
                        activeDot={{ r: 7 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Second Row Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Enrollment per Course Bar Chart */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Course Enrollment Status</h3>
                    <p className="text-sm text-gray-500">Current enrollments vs capacity</p>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={enrollmentData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="course" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value, name) => {
                          if (name === 'percentage') return `${value}%`;
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="enrolled" fill="#3B82F6" name="Enrolled" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="capacity" fill="#E5E7EB" name="Capacity" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Department Distribution Pie Chart */}
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
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {departmentData.map((dept, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: dept.color }}
                        ></div>
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
          {activeTab === 'chat' && <TeamsLMSChat />}
          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}