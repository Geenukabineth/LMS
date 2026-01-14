import React, { useEffect, useMemo } from "react";
import {
  Users, Book, BookOpen, DollarSign, LogOut, Settings,
  MessagesSquare, Home, UserRoundCog,BarChart2, CreditCard, TvMinimalPlay, FileText, ShoppingCart
} from "lucide-react";
import authService from "@/context/authService";
import logo from "@/assets/master_logo.png";

const Sidebar = ({ activeTab, setActiveTab, userType }) => {
  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ✅ normalize userType to match roles
  const normalizedUserType = (userType || "").toLowerCase(); // "instructor"

  const menuItems = useMemo(() => ([
    { id: "dashboard", label: "Dashboard", icon: Home, roles: ["admin"] },

    { id: "teacherdashboard", label: "Dashboard", icon: Home, roles: ["instructor"] },
    { id: "userdashboard", icon: Home, label: "Dashboard",roles: ["student"]  },
    {id: "receptionistdashboard", label: "Dashboard", icon: Home, roles: ["receptionist"] },
    { id: "lecturers", label: "Lecturers", icon: Users, roles: ["admin"] },
    { id: "receptionists", label: "Receptionists", icon: UserRoundCog, roles: ["admin"] },
    { id: "classes", label: "Classes", icon: BookOpen , roles: [ "instructor"] },
    { id: "students", label: "Students", icon: Users, roles: [ "instructor"] },
    { id: "feedback", label: "Feedback", icon: BarChart2 , roles: ["admin", "instructor"] },
    { id: "payment", label: "Payment", icon: CreditCard , roles: [ "instructor"]},
    { id: "liveclassroom", label: "Live Classroom", icon: TvMinimalPlay , roles: [ "instructor"]},
    { id: "PlagiarismReports", label: "PlagiarismReports", icon: FileText , roles: [ "instructor"]},
    {id: 'courses', icon: BookOpen, label: 'My Courses', roles: ['student']},
    {id: 'browse', icon: ShoppingCart, label: 'Browse Courses', roles: ['student']},
    {id: 'complaints', icon: FileText, label: 'Complaints', roles: ['student']},
   
    {id: 'payment', icon: CreditCard, label: 'Payment History', roles: ['student']}, 
    { id: "programs", label: "Programs & Courses", icon: BookOpen, roles: ["admin", ] },
    { id: "payments", label: "Payments", icon: DollarSign, roles: ["admin", "receptionist"] },
    { id: "announcements", label: "Announcements", icon: Book, roles: ["admin", "lecturer", "receptionist", "instructor"] },
    { id: "chat", label: "Chat", icon: MessagesSquare, roles: ["admin", "student", "receptionist", "instructor"] },
    { id: "settings", label: "Settings", icon: Settings, roles: ["admin", "instructor","student"] },
  ]), []);

  const visibleItems = useMemo(
    () => menuItems.filter((i) => i.roles.includes(normalizedUserType)),
    [menuItems, normalizedUserType]
  );

  // ✅ if activeTab not allowed, set first allowed tab
  useEffect(() => {
    if (!visibleItems.length) return;
    const allowed = visibleItems.some((i) => i.id === activeTab);
    if (!allowed) setActiveTab(visibleItems[0].id);
  }, [activeTab, setActiveTab, visibleItems]);

  return (
    <aside className="flex flex-col w-64 h-screen bg-white border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <img src={logo} alt="Logo" className="h-12" />
        </div>
        <h2 className="font-semibold text-center text-gray-700 uppercase">
          {normalizedUserType} Portal
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-2 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 space-x-3 text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
