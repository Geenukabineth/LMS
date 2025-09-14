import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  X, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Info, 
  Star, 
  Zap,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

function AnnouncementPanel() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [updateData, setUpdateData] = useState(null);  
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([
    // Sample data for demonstration
    {
      id: 1,
      title: "Welcome to the new semester!",
      description: "We're excited to start this new academic year with fresh opportunities and challenges.",
      type: "general",
      priority: "high",
      startDate: "2024-06-01",
      endDate: "2024-06-30",
      createdAt: "2024-06-01T10:00:00Z"
    },
    {
      id: 2,
      title: "System Maintenance Notice",
      description: "Our learning management system will undergo scheduled maintenance this weekend.",
      type: "info",
      priority: "medium",
      startDate: "2024-06-15",
      endDate: "2024-06-16",
      createdAt: "2024-06-01T14:30:00Z"
    }
  ]);

  const [AnnouncementData, setAnnouncementData] = useState({
    title: '',
    description: '',
    type: 'general',
    priority: 'medium',
    startDate: '',
    endDate: '',
  });

  // Define announcement types and priority levels
  const announcementTypes = {
    info: { icon: Info, color: 'blue' },
    warning: { icon: AlertCircle, color: 'orange' },
    success: { icon: Star, color: 'green' },
    urgent: { icon: Zap, color: 'red' },
    general: { icon: Megaphone, color: 'blue' },
    course: { icon: Calendar, color: 'green' },
    instructor: { icon: Info, color: 'purple' }
  };

  const priorityLevels = {
    low: { color: 'gray' },
    medium: { color: 'blue' },
    high: { color: 'orange' },
    critical: { color: 'red' }
  };

  const saveCourse = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Sending announcement data:', AnnouncementData);

      const response = await fetch('http://localhost:8000/lms/announcement/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: AnnouncementData.title,
          description: AnnouncementData.description,
          type: AnnouncementData.type,
          priority: AnnouncementData.priority,
          start_date: AnnouncementData.startDate || null,
          end_date: AnnouncementData.endDate || null,
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('Error creating announcement:', errorData);
        return alert('Failed to create announcement: ' + (errorData.detail || errorData.message || 'Unknown error'));
      }
    
      const data = await response.json();
      console.log('Announcement created:', data);
    
      setAnnouncementData({
        title: '',
        description: '',
        type: 'general',
        priority: 'medium',
        startDate: '',
        endDate: '',
      });
    
      fetchAnnouncements();
      setShowCreateForm(false);
      alert('Announcement created successfully!');
    
    } catch (error) {
      console.error('Network or parsing error:', error);
      alert('Failed to create announcement. Please check your network connection and try again.');
    } finally { 
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!AnnouncementData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!AnnouncementData.description.trim()) {
      alert('Please enter a description');
      return;
    }
    
    if (updateData) {
      handleUpdate(updateData.id);
    } else {
      saveCourse(e);
    }
  };

  const handleEdit = (announcement) => {
    setUpdateData(announcement);
    setAnnouncementData({
      title: announcement.title || '',
      description: announcement.description || '',
      type: announcement.type || 'general',
      priority: announcement.priority || 'medium',
      startDate: announcement.startDate || '',
      endDate: announcement.endDate || '',
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const response = await fetch(`http://localhost:8000/lms/announcement/delete/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`, 
          }
        });
        
        if (response.ok) {
          fetchAnnouncements();
          alert('Announcement deleted successfully!');
        } else {
          alert('Failed to delete announcement.');
        }
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Failed to delete announcement.');
      }
    }
  };

  const handleUpdate = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/lms/announcement/update/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: AnnouncementData.title,
          description: AnnouncementData.description,
          type: AnnouncementData.type,
          priority: AnnouncementData.priority,
          start_date: AnnouncementData.startDate || null,
          end_date: AnnouncementData.endDate || null,
        }),
      });
      
      if (response.ok) {
        fetchAnnouncements();
        setShowCreateForm(false);
        setUpdateData(null);
        setAnnouncementData({
          title: '',
          description: '',
          type: 'general',
          priority: 'medium',
          startDate: '',
          endDate: '',
        });
        alert('Announcement updated successfully!');
      } else {
        alert('Failed to update announcement.');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Failed to update announcement.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
  
      const response = await fetch('http://localhost:8000/lms/announcement/view/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Expected array but received:', typeof data);
        return;
      }
  
      // Ensure all announcements have required fields with defaults
      const normalizedData = data.map(announcement => ({
        ...announcement,
        type: announcement.type || 'general',
        priority: announcement.priority || 'medium',
        title: announcement.title || 'Untitled',
        description: announcement.description || 'No description',
      }));
      
      setAnnouncements(normalizedData);
    } catch (err) {
      console.error('Error fetching announcements:', err);
     
      setAnnouncements([]);
    }
  };
  
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Sort announcements by priority and date
  const sortedAnnouncements = announcements.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aPriority = a.priority || 'medium';
    const bPriority = b.priority || 'medium';
    return (priorityOrder[bPriority] || 0) - (priorityOrder[aPriority] || 0);
  });

  const getPriorityBadgeColor = (priority) => {
    const safePriority = priority || 'medium';
    switch (safePriority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconColor = (type) => {
    const safeType = type || 'general';
    switch (safeType) {
      case 'info': return 'text-blue-500';
      case 'warning': return 'text-orange-500';
      case 'success': return 'text-green-500';
      case 'urgent': return 'text-red-500';
      case 'general': return 'text-blue-500';
      case 'course': return 'text-green-500';
      case 'instructor': return 'text-purple-500';
      default: return 'text-blue-500';
    }
  };

  const formatPriorityText = (priority) => {
    const safePriority = priority || 'medium';
    return safePriority.charAt(0).toUpperCase() + safePriority.slice(1);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Megaphone className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Announcement Panel</h1>
              <p className="text-gray-600 mt-1">Manage and display announcements</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Announcements</h3>
            <p className="text-3xl font-bold text-blue-600">{announcements.length}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Active Now</h3>
            <p className="text-3xl font-bold text-green-600">{announcements.length}</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">High Priority</h3>
            <p className="text-3xl font-bold text-orange-600">
              {announcements.filter(a => (a.priority || 'medium') === 'high' || (a.priority || 'medium') === 'critical').length}
            </p>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {updateData ? 'Edit Announcement' : 'Create New Announcement'}
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={AnnouncementData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter announcement title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  name="type"
                  value={AnnouncementData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="general">General</option>
                  <option value="course">Course</option>
                  <option value="instructor">Instructor</option>
                 
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  name="priority"
                  value={AnnouncementData.priority}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                 
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={AnnouncementData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={AnnouncementData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={AnnouncementData.description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Enter announcement description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Processing...' : (updateData ? 'Update' : 'Create')} Announcement
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setUpdateData(null);
                  setAnnouncementData({
                    title: '',
                    description: '',
                    type: 'general',
                    priority: 'medium',
                    startDate: '',
                    endDate: '',
                  });
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Announcements List</h2>
        <div className="space-y-4">
          {sortedAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Megaphone className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Announcements</h3>
              <p className="text-gray-500">Create your first announcement to get started.</p>
            </div>
          ) : (
            sortedAnnouncements.map((announcement) => {
              const safeType = announcement.type || 'general';
              const config = announcementTypes[safeType] || announcementTypes.general;
              const IconComponent = config.icon;

              return (
                <div key={announcement.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg bg-gray-50 ${getIconColor(safeType)}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900 truncate">
                            {announcement.title || 'Untitled'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeColor(announcement.priority)} w-fit`}>
                            {formatPriorityText(announcement.priority)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {announcement.description || 'No description available'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Created: {new Date(announcement.createdAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                          {announcement.startDate && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {announcement.startDate} - {announcement.endDate || 'Ongoing'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(announcement)} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(announcement.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default AnnouncementPanel;