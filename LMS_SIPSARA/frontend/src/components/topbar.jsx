import React, { useState, useEffect, useRef } from "react";
import { Bell, User, LogOut } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import authService from "@/context/authService"; 

function Topbar() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userFullName, setUserFullName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const dropdownRef = useRef(null);

  // ✅ FIXED: Proper logout with refreshToken retrieval
  const handleLogout = async () => {
    try {
      if (!authService.isAuthenticated()) {
        setError('Not authenticated');
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        window.location.href = "/";
        return;
      }

      // ✅ FIXED: Retrieve refreshToken before using
      const refreshToken = authService.getRefreshToken();

      if (!refreshToken) {
        console.warn("No refresh token found, proceeding with local logout");
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        window.location.href = "/";
        return;
      }

      const response = await fetch("http://localhost:8000/lms/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      // Handle both successful logout (200) and already-logged-out state (205)
      if (response.ok || response.status === 205) {
        console.log("Logout successful");
      } else {
        const errorData = await response.json().catch(() => ({
          error: "Logout failed, no JSON response.",
        }));
        console.error("Logout failed:", errorData);
        // Continue with local cleanup anyway
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Continue with local cleanup anyway
    } finally {
      // Always clear local storage and redirect
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      window.location.href = "/";
    }
  };

  // ✅ Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("authToken");
        const storedUserId = localStorage.getItem("userId");

        if (!token) {
          console.warn("No authentication token found");
          setUserFullName("Guest User");
          return;
        }

        // Set userId for NotificationBell
        if (storedUserId) {
          setUserId(parseInt(storedUserId));
        }

        const response = await fetch(`http://localhost:8000/lms/user/me/`, {
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
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userId");
            localStorage.removeItem("username");
            window.location.href = "/";
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const fullName = data.profile?.full_name || data.username || "User Profile";
        setUserFullName(fullName);

        // Set user ID
        if (data.id) {
          setUserId(data.id);
          localStorage.setItem("userId", data.id);
        }

        // Set profile image if available
        if (data.profile?.image) {
          setProfileImage(`http://localhost:8000${data.profile.image}`);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(error.message || "Failed to fetch user data");
        setUserFullName("Guest User");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ FIXED: currentDate is properly scoped and defined before use
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <header className="px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{currentDate}</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* New NotificationBell Component - Real-Time Notifications */}
            {userId && (
              <NotificationBell userId={userId} />
            )}

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center justify-center p-2 text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User Menu"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="object-cover w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      setProfileImage(null);
                    }}
                  />
                ) : (
                  <User size={20} />
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 z-50 w-56 py-2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 overflow-hidden bg-indigo-500 rounded-full">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <User size={20} className="text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {isLoading ? "Loading..." : error ? "Error" : userFullName}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <button
                    className="flex items-center w-full px-4 py-2 space-x-2 text-sm text-left text-gray-700 hover:bg-gray-100"
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
    </div>
  );
}

export default Topbar;