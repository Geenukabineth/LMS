import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { userService } from "@/config/user.config";

const SidebarHeader = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  unreadCount = 0,
}) => {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await userService.getUserProfile();
        setUser(data);

        // ✅ IMAGE COMES FROM profile.image (based on your API response)
        const imagePath = data?.profile?.image;

        if (imagePath) {
          const fullUrl = imagePath.startsWith("http")
            ? imagePath
            : `http://localhost:8000${imagePath}`;

          setProfileImage(fullUrl);
        } else {
          setProfileImage(null);
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
        setUser(null);
        setProfileImage(null);
      }
    };

    loadUser();
  }, []);

  return (
    <div className="p-4 bg-orange-400 border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 ">
        <h1 className="text-2xl font-bold text-white">Messages</h1>

        {/* Profile Image */}
        <div className="flex items-center justify-center w-10 h-10 overflow-hidden bg-orange-500 rounded-full">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.onerror = null;
                setProfileImage(null);
              }}
            />
          ) : (
            <span className="font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
        <input
          type="text"
          placeholder="Search users or groups..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full py-2 pl-10 pr-4 text-black placeholder-purple-200 rounded-full bg-white-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {/* Tabs */}
      <div className="flex p-1 space-x-1 bg-orange-500 rounded-full">
        {["chats", "friends", "groups"].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition relative ${
              activeTab === tab
                ? "bg-orange-500 text-red-600"
                : "text-white hover:bg-red-600"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}

            {tab === "chats" && unreadCount > 0 && (
              <span className="absolute top-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full right-2">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SidebarHeader;
