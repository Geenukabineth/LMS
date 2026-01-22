// components/AnnouncementPanel.jsx
import React, { useState, useEffect } from "react";
import {
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import notificationConfig from "../config/notification.config";

const AnnouncementPanel = ({
  userId,
  userRole = "student",
  onAnnouncementCreated,
}) => {
  
  // -------------------- state --------------------
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general",
    visibility: "everyone",
    expires_at: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // -------------------- load list --------------------
  useEffect(() => {
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  // -------------------- WS for real-time --------------------
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      console.warn("⚠️ No auth token found. AnnouncementPanel WebSocket will not connect.");
      return;
    }

    const wsUrl = `ws://127.0.0.1:8000/ws/notifications/?token=${token}`;
    

    const socket = new WebSocket(wsUrl);

   

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "announcement_push" && data.data) {
          const newAnnouncement = data.data;

          setAnnouncements((prev) => {
            const exists = prev.some((a) => a.id === newAnnouncement.id);
            if (exists) return prev;
            return [newAnnouncement, ...prev];
          });
        }
      } catch (err) {
        console.error("❌ Error parsing WS message in AnnouncementPanel:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("🔴 AnnouncementPanel WebSocket Error:", error);
    };

    socket.onclose = (e) => {
      console.log(`🔓 AnnouncementPanel WebSocket Closed. Code: ${e.code}`);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, []);

  // -------------------- API helpers --------------------
  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      const params = {};
      if (filterType !== "all") params.type = filterType;

      const data = await notificationConfig.getnotification(params);
      
      const announcements_list = data.results || data;
      setAnnouncements(announcements_list);
    } catch (error) {
      console.error("❌ Error loading announcements:", error);
      setErrorMessage("Failed to load announcements. " + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "general",
      visibility: "everyone",
      expires_at: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      if (editingId) {
        const updatedAnnouncement = await notificationConfig.updateAnnouncement(editingId, formData);

        setAnnouncements((prev) =>
          prev.map((ann) => (ann.id === editingId ? updatedAnnouncement : ann))
        );

        setSuccessMessage("✅ Announcement updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        resetForm();
        return;
      }

      const newAnnouncement = await notificationConfig.createAnnouncement(formData);

      setAnnouncements((prev) => {
        const exists = prev.some((a) => a.id === newAnnouncement.id);
        if (exists) return prev;
        return [newAnnouncement, ...prev];
      });

      setSuccessMessage("✅ Announcement posted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      if (onAnnouncementCreated) {
        onAnnouncementCreated({
          id: newAnnouncement.id,
          message: `New announcement: "${newAnnouncement.title}"`,
          type: newAnnouncement.type,
          time: "Just now",
          author: newAnnouncement.author?.username || "System",
        });
      }

      resetForm();
    } catch (error) {
      console.error("❌ Error submitting announcement:", error);
      setErrorMessage(error.response?.data?.detail || error.message || "Failed to submit announcement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    try {
      setIsLoading(true);
      setErrorMessage("");

      await notificationConfig.deleteAnnouncement(id);

      setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
      setSuccessMessage("✅ Announcement deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("❌ Error deleting announcement:", error);
      setErrorMessage(error.response?.data?.detail || error.message || "Failed to delete announcement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    let formattedDate = "";
    if (announcement.expires_at) {
      const date = new Date(announcement.expires_at);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      formattedDate = date.toISOString().slice(0, 16);
    }

    setFormData({
      title: announcement.title || "",
      content: announcement.content || "",
      type: announcement.type || "general",
      visibility: announcement.visibility || "everyone",
      expires_at: formattedDate,
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  // -------------------- UI helpers --------------------
  const getTypeColor = (type) => {
    const colors = {
      general: "bg-orange-50 border-l-4 border-orange-500",
      course: "bg-green-50 border-l-4 border-green-500",
      assignment: "bg-yellow-50 border-l-4 border-yellow-500",
      urgent: "bg-red-50 border-l-4 border-red-500",
    };
    return colors[type] || colors.general;
  };

  const getTypeBadge = (type) => {
    const badges = {
      general: { label: "General", color: "bg-orange-100 text-orange-800" },
      course: { label: "Course", color: "bg-green-100 text-green-800" },
      assignment: { label: "Assignment", color: "bg-yellow-100 text-yellow-800" },
      urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
    };
    return badges[type] || badges.general;
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: "Admin", color: "bg-purple-100 text-purple-800" },
      teacher: { label: "Teacher", color: "bg-indigo-100 text-indigo-800" },
      student: { label: "Student", color: "bg-gray-100 text-gray-800" },
    };
    return badges[role] || badges.student;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesType = filterType === "all" || ann.type === filterType;
    const matchesSearch =
      (ann.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ann.content || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // 🔴 REMOVED: canManage function

  return (
    
    <div className="w-full p-6 bg-white rounded-lg ">
      <div className="flex flex-col gap-4 p-6 mb-6 text-white rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
          <div className="px-2 py-2">
            <h1 className="mb-2 text-3xl font-bold text-white uppercase">Announcements</h1>
          </div>
        </div>
      

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 mb-6 text-red-700 bg-red-100 border border-red-400 rounded-lg">
          <AlertCircle size={20} />
          <span className="text-red-900">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-4 mb-6 text-green-700 bg-green-100 border border-green-400 rounded-lg">
          <CheckCircle className="text-green-600" size={20} />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        disabled={isLoading}
        className="px-4 py-2 mb-6 font-semibold text-white transition bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
      >
        {showForm ? "Cancel" : "+ New Announcement"}
      </button>

      {showForm && (
        <div className="p-6 mb-6 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            {editingId ? "Edit Announcement" : "Create Announcement"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="general">General</option>
                  <option value="course">Course</option>
                  <option value="assignment">Assignment</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Visibility
                </label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="everyone">Everyone</option>
                  <option value="students">Students Only</option>
                  <option value="teachers">Teachers Only</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? "Posting..." : editingId ? "Update" : "Post Announcement"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 font-semibold text-gray-800 transition bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "general", "course", "assignment", "urgent"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterType === type
                ? "bg-orange-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search announcements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {isLoading && filteredAnnouncements.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">Loading announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="py-12 text-center rounded-lg bg-gray-50">
          <p className="font-semibold text-gray-500">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`rounded-lg p-6 ${getTypeColor(announcement.type)} transition hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {announcement.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${getTypeBadge(
                        announcement.type
                      ).color}`}
                    >
                      {getTypeBadge(announcement.type).label}
                    </span>

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${getRoleBadge(
                        announcement.role
                      ).color}`}
                    >
                      {getRoleBadge(announcement.role).label}
                    </span>
                  </div>
                </div>

                {/* ✅ Buttons are now ALWAYS visible (permission check removed) */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(announcement)}
                    className="p-2 text-gray-600 transition hover:text-orange-600"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-gray-600 transition hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {announcement.expires_at && (
                <div className="flex items-center gap-1 mb-3 text-xs font-medium text-orange-700">
                  <Clock size={14} />
                  <span>Vanishes on: {new Date(announcement.expires_at).toLocaleString()}</span>
                </div>
              )}

              <p className="mb-4 text-gray-800">{announcement.content}</p>

              <div className="flex items-center justify-between pb-4 mb-4 text-sm text-gray-600 border-b border-gray-300">
                <div>
                  <span className="font-semibold">{announcement.author?.username}</span>
                  {" · "}
                  <span>{formatDate(announcement.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementPanel;