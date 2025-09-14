import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, User, LogOut, Settings, X } from "lucide-react";
import SettingsPanel from '@/components/setting';
import NotificationBell from "@/components/sidebar";

function Topbar() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("authToken");
    console.log("Redirecting to login page");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
          console.warn("No authentication token found");
          setUserName("Guest User");
          setIsLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8000/lms/user/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.warn("Authentication failed - token may be expired");
            localStorage.removeItem("authToken");
            setUserName("Guest User");
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUserName(data.username || data.name || "username");
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserName("Guest User");

        if (error.message.includes("Failed to fetch")) {
          console.error("Network error - server may be down");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (isSettingsModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSettingsModalOpen]);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
    if (notificationRef.current && !notificationRef.current.contains(event.target)) {
      setShowNotification(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{currentDate}</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

        {/* Notification */}
        <div className="relative" ref={notificationRef}>
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowNotification(!showNotification)}
            aria-label="Notifications"
          >
           <NotificationBell />  
          </button>
        </div>

        {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User Menu"
              >
                <User size={20} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {isLoading ? "Loading..." : userName}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => {
                      setActiveTab("settings");
                      setDropdownOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>

                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-h-[90vh] w-full max-w-3xl mx-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SettingsPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export default Topbar;
