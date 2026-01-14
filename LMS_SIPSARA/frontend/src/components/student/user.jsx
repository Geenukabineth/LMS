import React, { useState, useEffect } from "react";
import {
  Clock,
  FileVideo,
  FileText,
  Video,
  HelpCircle
} from "lucide-react";

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
import authService from "@/context/authService"; // ✅ IMPORT ADDED

const StudentPortal = () => {
  const [activeTab, setActiveTab] = useState("userdashboard");
  const [loading, setLoading] = useState(true);
  
  // ✅ ADDED: User State
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

  // ✅ ADDED: Fetch User Data
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

  // Fetch Real Data from API
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

  const getProgressColor = (color) => {
    const colors = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
    };
    return colors[color] || "bg-blue-500";
  };

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
          {/* Dashboard */}
          {activeTab === "userdashboard" && (
            <div className="space-y-6">
              
              {/* ✅ UPDATED: Welcome Card with Dynamic Name */}
              <div className="p-6 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <h2 className="mb-2 text-2xl font-bold">
                  Welcome back{user ? `, ${user.username || user.name || 'Student'}` : ""}!
                </h2>
                <p className="mb-4 text-blue-100">Ready to continue your learning journey?</p>
                
                {/* Stats Summary inside Welcome Card */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Clock size={16} />
                    <span className="text-sm">{assignments.length} Assignments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HelpCircle size={16} />
                    <span className="text-sm">{quizzes.length} Pending Quizzes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileVideo size={16} />
                    <span className="text-sm">{events.length} Classes Today</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 1. Course Progress */}
                <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Course Progress</h3>
                    <button
                      onClick={() => setActiveTab("courses")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {courses.length === 0 ? (
                        <p className="text-gray-500">No active courses found.</p>
                    ) : (
                        courses.map((course) => (
                        <div key={course.id} className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">{course.name}</h4>
                            <span className="text-xs text-gray-500">{course.nextClass}</span>
                            </div>

                            <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getProgressColor(course.color)}`} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">{course.instructor}</span>
                                <span className="text-sm font-medium text-gray-800">{course.progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div
                                    className={`h-2 rounded-full ${getProgressColor(course.color)}`}
                                    style={{ width: `${course.progress}%` }}
                                />
                                </div>
                            </div>
                            </div>
                        </div>
                        ))
                    )}
                  </div>
                </div>

                {/* 2. Upcoming Assignments */}
                <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Upcoming Assignments</h3>
                    <button
                      onClick={() => setActiveTab("assignments")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {assignments.length === 0 ? (
                        <p className="text-gray-500">No pending assignments.</p>
                    ) : (
                        assignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div>
                            <h4 className="font-medium text-gray-800">{a.title}</h4>
                            <p className="text-sm text-gray-600">{a.course}</p>
                            </div>
                            <span
                            className={`text-xs px-2 py-1 rounded-full ${
                                a.status === "urgent"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                            >
                            Due {a.due}
                            </span>
                        </div>
                        ))
                    )}
                  </div>
                </div>

                {/* 3. Upcoming Quizzes */}
                <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Pending Quizzes</h3>
                  </div>

                  <div className="space-y-4">
                    {quizzes.length === 0 ? (
                        <p className="text-gray-500">No pending quizzes.</p>
                    ) : (
                        quizzes.map((q) => (
                        <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-full">
                                    <HelpCircle size={18} className="text-yellow-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-800">{q.title}</h4>
                                    <p className="text-sm text-gray-600">{q.course}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs font-medium text-gray-500">
                                    {q.time_limit}
                                </span>
                            </div>
                        </div>
                        ))
                    )}
                  </div>
                </div>

                {/* 4. Today's Schedule */}
                <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Today's Schedule</h3>
                  </div>

                  <div className="space-y-4">
                    {events.length === 0 ? (
                        <p className="text-gray-500">No live classes scheduled for today.</p>
                    ) : (
                        events.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-start space-x-3">
                                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg">
                                <Video size={16} className="text-blue-600" />
                                </div>
                                <div>
                                <h4 className="font-medium text-gray-800">{ev.title}</h4>
                                <p className="text-sm text-gray-600">{ev.time}</p>
                                <p className="text-sm text-gray-500">{ev.location}</p>
                                </div>
                            </div>
                            {ev.link && (
                                <a 
                                href={ev.link} 
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
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
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