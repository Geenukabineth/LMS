import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  FileText,
  Award,
  BarChart2,
  Video,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import Chatbot from "@/components/aibot";
import Topbar from "@/components/topbar";
import StudentData from "@/components/data/studenData";
import ModuleCreator from "../courseData/module";
import TeacherFeedbackPanel from "../courseData/feedback";
import SettingsPanel from "@/components/setting";
import TeamsLMSChat from "@/components/chat";
import Sidebar from "@/components/Sidebar";
import authService from "@/context/authService";
import PlagiarismReports from "@/components/courseData/PlagiarismReports";
import AnnouncementPanel from '@/components/AnnouncementPanel';
import LiveClassroom from "@/components/courseData/liveclassroom";
import TeacherPaymentPage from "@/components/data/Teacherpaymentpage ";
import { courseService } from "@/config/course.config";
import { userService } from "../../config/user.config";


export default function TeachersDashboard() {
  const [activeTab, setActiveTab] = useState("teacherdashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  // Dashboard State
  const [coursesCount, setCoursesCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [lessonsCount, setLessonsCount] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);

  const userType = (localStorage.getItem("userType") || "").toLowerCase();

  // 1. Fetch User
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

  // 2. Fetch All Dashboard Stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch basic course count
        const courseCountData = await courseService.getCoursesCountteacher();
        setCoursesCount(courseCountData);

        // Fetch total students
        const studentsData = await userService.getteachercoursestudents();
        setTotalStudents(studentsData);

        // Fetch the new Detailed Stats (Lessons, Questions, Chart, Upcoming)
        // ✅ FIX: Use courseService and handle direct data response
        const data = await courseService.getdashborddata();
        
        if (data) {
            setLessonsCount(data.total_lessons || 0);
            setQuestionsCount(data.total_quizzes || 0);
            setChartData(data.chart_data || []);
            setUpcomingClasses(data.upcoming_classes || []);
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (userType === "instructor") setActiveTab("teacherdashboard");
  }, [userType]);

  const statsData = [
    {
      title: "Total Classes",
      value: loading ? "..." : coursesCount,
      trend: "Active Courses",
      icon: BookOpen,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Students",
      value: loading ? "..." : totalStudents,
      trend: "Enrolled Students",
      icon: Users,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Lessons Created",
      value: loading ? "..." : lessonsCount,
      trend: "Total Content",
      icon: FileText,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Questions",
      value: loading ? "..." : questionsCount,
      trend: "Student Queries",
      icon: Award,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userType={userType}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm">
          <Topbar />
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "teacherdashboard" && (
            <div className="p-8 space-y-8">
              {/* Welcome Banner */}
              <div className="p-6 text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <h2 className="mb-2 text-2xl font-bold">
                  Welcome back {user ? `, ${user.username || user.name || "User"}` : ""}!
                </h2>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statsData.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="p-6 transition bg-white rounded-lg shadow hover:shadow-md">
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
                      <div className="text-sm font-medium text-gray-500">
                        {stat.trend}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* 1. Bar Chart: Attendance / Students per Class */}
                <div className="p-6 bg-white rounded-lg shadow lg:col-span-2">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800">
                      Class Enrollment & Attendance
                    </h3>
                    <p className="text-sm text-gray-500">Overview of students enrolled per course</p>
                  </div>
                  
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{fill: '#6b7280', fontSize: 12}}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{fill: '#6b7280', fontSize: 12}}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          cursor={{fill: '#f3f4f6'}}
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        />
                        <Legend />
                        <Bar 
                          dataKey="students" 
                          name="Students Enrolled" 
                          fill="#4F46E5" 
                          radius={[4, 4, 0, 0]} 
                          barSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Upcoming Online Classes */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">
                      Upcoming Online Classes
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        Live
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {upcomingClasses.length === 0 ? (
                        <p className="py-4 text-center text-gray-500">No upcoming classes scheduled.</p>
                    ) : (
                        upcomingClasses.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 transition-colors border border-gray-100 rounded-lg bg-gray-50 hover:bg-blue-50"
                        >
                            <div className="flex items-start space-x-3">
                            <div className="p-2 mt-1 bg-blue-100 rounded-full">
                                <Video size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">
                                {item.name}
                                </h4>
                                <p className="mb-1 text-xs font-medium text-gray-600">
                                {item.topic}
                                </p>
                                <p className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {item.time}
                                </p>
                            </div>
                            </div>
                            {item.link && (
                                <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 text-xs font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                Join
                                </a>
                            )}
                        </div>
                        ))
                    )}
                  </div>
                  
                  <button className="w-full py-2 mt-6 text-sm font-medium text-blue-600 transition-colors border border-blue-200 rounded-lg hover:bg-blue-50">
                    View Full Schedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs */}
          {activeTab === "students" && <StudentData />}
          {activeTab === "classes" && <ModuleCreator />}
          {activeTab === "PlagiarismReports" && <PlagiarismReports />}
          {activeTab === "feedback" && <TeacherFeedbackPanel />}
          {activeTab === 'announcements' && <AnnouncementPanel />}
          {activeTab === "liveclassroom" && <LiveClassroom />}
          {activeTab === "payment" && <TeacherPaymentPage />}
          {activeTab === "chat" && <TeamsLMSChat />}
          {activeTab === "settings" && <SettingsPanel />}

          {error && (
            <div className="p-4 mt-4 text-red-600 bg-white rounded-lg shadow">
              {error}
            </div>
          )}
        </main>

        <Chatbot />
      </div>
    </div>
  );
}