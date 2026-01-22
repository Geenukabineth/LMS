import React, { useState, useEffect } from "react";
import {
  Clock,
  FileVideo,
  FileText,
  Video,
  HelpCircle,
  TrendingUp,
  Calendar,
  AlertCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import Topbar from "@/components/topbar";
import SettingsPanel from "@/components/setting";
import TeamsLMSChat from "@/components/chat";
import StudentCourseView from "@/components/courseData/Studentcourseview";
import Sidebar from "@/components/Sidebar";
import Complain from "@/components/student/Complain";

import StudentPaymentHistory from "@/components/Student/StudentPaymentHistory";
import CourseBrowsePage from "@/components/Student/CourseBrowsePage";
import Chatbot from "@/components/aibot";
import { courseService } from "@/config/course.config";
import authService from "@/context/authService";

const StudentPortal = () => {
  const [activeTab, setActiveTab] = useState("userdashboard");
  const [loading, setLoading] = useState(true);
  
  const [user, setUser] = useState(null);

  // State for Dashboard Data
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]); 
  const [events, setEvents] = useState([]); 

  const userType = (localStorage.getItem("userType") || "student").toLowerCase();

  useEffect(() => {
    if (userType === "student") setActiveTab("userdashboard");
  }, [userType]);

  useEffect(() => {
    try {
      if (typeof authService.getCurrentUser === "function") {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } else if (authService.getToken()) {
        const token = authService.getToken();
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
        setUser(JSON.parse(jsonPayload));
      }
    } catch (err) {
      console.error("Error getting current user:", err);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await courseService.getStudentDashboardStats();
        
        if (data) {
          setCourses(data.courses || []);
          setAssignments(data.upcoming_assignments || []);
          setQuizzes(data.upcoming_quizzes || []);
          setEvents(data.todays_schedule || []);
        }
      } catch (error) {
        console.error("Error fetching student dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "userdashboard") {
        fetchDashboardData();
    }
  }, [activeTab]);

  // CHART DATA
  const performanceData = courses.map(c => ({
    subject: c.name.length > 10 ? c.name.substring(0, 10) + "..." : c.name,
    score: c.avg_score || 0,
    fullSubject: c.name 
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userType={userType}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-gray-200">
          <Topbar />
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "userdashboard" && (
            <div className="mx-auto space-y-6 max-w-7xl">
              
              {/* --- 1. WELCOME BANNER --- */}
              {/* ✅ UPDATED GRADIENT HERE */}
              <div className="relative p-8 overflow-hidden text-white shadow-lg rounded-2xl bg-gradient-to-r from-orange-600 to-red-600">
                <div className="relative z-10">
                    <h2 className="mb-2 text-3xl font-bold">
                    Welcome back, {user ? (user.username || user.name || 'Student') : "Student"}!
                    </h2>
                    <p className="max-w-xl mb-6 text-orange-100">
                    You have {assignments.length} assignments due soon and {events.length} classes scheduled for today.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <Clock size={18} className="text-white" />
                            <span className="font-medium">{assignments.length} Assignments</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <HelpCircle size={18} className="text-white" />
                            <span className="font-medium">{quizzes.length} Quizzes</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <Video size={18} className="text-white" />
                            <span className="font-medium">{events.length} Classes</span>
                        </div>
                    </div>
                </div>
                {/* Decorative background circle */}
                <div className="absolute w-64 h-64 bg-orange-500 rounded-full opacity-20 -right-10 -bottom-20 blur-3xl"></div>
              </div>

              {/* --- MAIN DASHBOARD GRID --- */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                
                {/* --- LEFT COLUMN (2/3 width) --- */}
                <div className="space-y-6 lg:col-span-2">

                    {/* 2. TODAY'S SCHEDULE */}
                    <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-50">
                                    <Calendar className="text-blue-600" size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">Today's Schedule</h3>
                            </div>
                            <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                {new Date().toLocaleDateString()}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {events.length === 0 ? (
                                <div className="py-8 text-center text-gray-400 border border-gray-200 border-dashed rounded-lg col-span-full bg-gray-50">
                                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No live classes scheduled for today.</p>
                                </div>
                            ) : (
                                events.map((ev) => (
                                <div key={ev.id} className="flex flex-col justify-between p-4 transition-shadow border border-gray-100 rounded-xl bg-gray-50 hover:shadow-md">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-blue-600 bg-white rounded-lg shadow-sm">
                                            <Video size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 line-clamp-1">{ev.title}</h4>
                                            <p className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                                <Clock size={12} /> {ev.time}
                                            </p>
                                        </div>
                                    </div>
                                    {ev.link && (
                                        <a 
                                        href={ev.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full py-2 text-sm font-semibold text-center text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                                        >
                                        Join Class
                                        </a>
                                    )}
                                </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 3. PERFORMANCE CHART */}
                    <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 rounded-lg bg-orange-50">
                                <TrendingUp className="text-orange-600" size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Performance Overview</h3>
                        </div>
                        
                        <div className="w-full h-72">
                            {performanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={performanceData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis 
                                            dataKey="subject" 
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis 
                                            domain={[0, 100]} 
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ 
                                                borderRadius: '8px', 
                                                border: 'none', 
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                backgroundColor: '#1f2937',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar 
                                            dataKey="score" 
                                            name="Avg. Marks" 
                                            fill="#f97316" 
                                            radius={[6, 6, 0, 0]} 
                                            barSize={32}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <TrendingUp size={32} className="mb-2 opacity-50" />
                                    <p>Not enough data for analysis</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* --- RIGHT COLUMN (1/3 width) --- */}
                <div className="space-y-6">

                    {/* 4. UPCOMING ASSIGNMENTS */}
                    <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">Assignments</h3>
                            <button
                            onClick={() => setActiveTab("assignments")}
                            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                            >
                            View All
                            </button>
                        </div>

                        <div className="space-y-3">
                            {assignments.length === 0 ? (
                                <p className="text-sm italic text-gray-500">No pending assignments.</p>
                            ) : (
                                assignments.map((a) => (
                                <div key={a.id} className="p-3 transition-all border border-gray-100 rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm group">
                                    <div className="flex items-start justify-between mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            a.status === "urgent" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                        }`}>
                                            Due: {a.due}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-800 transition-colors group-hover:text-orange-600">{a.title}</h4>
                                    <p className="mt-1 text-xs text-gray-500">{a.course}</p>
                                </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 5. PENDING QUIZZES */}
                    <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle size={18} className="text-purple-500" />
                            <h3 className="font-bold text-gray-800">Pending Quizzes</h3>
                        </div>

                        <div className="space-y-3">
                            {quizzes.length === 0 ? (
                                <p className="text-sm italic text-gray-500">No pending quizzes.</p>
                            ) : (
                                quizzes.map((q) => (
                                <div key={q.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50">
                                    <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-purple-600 bg-purple-100 rounded-full">
                                        <HelpCircle size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-800 truncate">{q.title}</h4>
                                        <p className="text-xs text-gray-500 truncate">{q.course}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-medium bg-gray-200 px-2 py-1 rounded text-gray-600">
                                            {q.time_limit}
                                        </span>
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
              </div>

            </div>
          )}

          {/* Tabs Content */}
          {activeTab === "browse" && <CourseBrowsePage />}
          {activeTab === "courses" && <StudentCourseView />}
          {activeTab === "complaints" && <Complain />}
          
          {activeTab === "payment" && <StudentPaymentHistory />}
          {activeTab === "chat" && <TeamsLMSChat />}
          {activeTab === "settings" && <SettingsPanel />}
        </main>

        <Chatbot />
      </div>
    </div>
  );
};

export default StudentPortal;