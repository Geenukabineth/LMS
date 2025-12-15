import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertCircle, Filter, Search, Calendar, User, BookOpen, CheckCircle, Clock, X, Eye, Reply, Trash2, Download } from 'lucide-react';

const TeacherFeedbackPanel = () => {
  const [activeTab, setActiveTab] = useState('feedback');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');

  // Sample feedback data
  const [feedbackData, setFeedbackData] = useState([
    {
      FeedbackID: 1,
      StudentID: 101,
      StudentName: "Alice Johnson",
      CourseID: 201,
      CourseName: "Advanced Mathematics",
      Rating: 5,
      Comments: "Excellent teaching method! The explanations are very clear and the examples help a lot. I really appreciate the extra time you spend helping students understand complex concepts.",
      FeedbackDate: "2024-06-01T10:30:00Z",
      IsRead: true,
      Response: null
    },
    {
      FeedbackID: 2,
      StudentID: 102,
      StudentName: "Bob Smith",
      CourseID: 202,
      CourseName: "Physics Fundamentals",
      Rating: 4,
      Comments: "Good course overall, but could use more practical examples. The theoretical part is well explained.",
      FeedbackDate: "2024-06-02T14:15:00Z",
      IsRead: false,
      Response: null
    },
    {
      FeedbackID: 3,
      StudentID: 103,
      StudentName: "Carol Davis",
      CourseID: 201,
      CourseName: "Advanced Mathematics",
      Rating: 3,
      Comments: "The pace is a bit fast for me. Sometimes I feel lost during lectures.",
      FeedbackDate: "2024-06-03T09:45:00Z",
      IsRead: true,
      Response: "Thank you for the feedback. I'll make sure to slow down and check for understanding more frequently."
    },
    {
      FeedbackID: 4,
      StudentID: 104,
      StudentName: "David Wilson",
      CourseID: 203,
      CourseName: "Computer Science Basics",
      Rating: 5,
      Comments: "Amazing course! Very engaging and practical. Love the hands-on projects.",
      FeedbackDate: "2024-06-04T16:20:00Z",
      IsRead: false,
      Response: null
    }
  ]);

  // Sample complaints data
  const [complaintsData, setComplaintsData] = useState([
    {
      ComplaintID: 1,
      UserID: 105,
      UserName: "Emma Brown",
      UserType: "Student",
      AdminID: null,
      IssueDescription: "The assignment deadline was changed without proper notice. This caused confusion and stress for many students.",
      Status: "Open",
      Priority: "Medium",
      Category: "Academic",
      ResolutionDate: null,
      CreatedDate: "2024-06-01T11:00:00Z",
      LastUpdated: "2024-06-01T11:00:00Z",
      Response: null
    },
    {
      ComplaintID: 2,
      UserID: 106,
      UserName: "Frank Miller",
      UserType: "Student",
      AdminID: 501,
      IssueDescription: "Grading seems inconsistent across different assignments. Some criteria are not clear.",
      Status: "In Progress",
      Priority: "High",
      Category: "Grading",
      ResolutionDate: null,
      CreatedDate: "2024-06-02T13:30:00Z",
      LastUpdated: "2024-06-03T10:15:00Z",
      Response: "Thank you for bringing this to our attention. We are reviewing the grading rubrics and will provide clarification soon."
    },
    {
      ComplaintID: 3,
      UserID: 107,
      UserName: "Grace Lee",
      UserType: "Parent",
      AdminID: 502,
      IssueDescription: "My child is not receiving adequate support for learning difficulties despite multiple requests.",
      Status: "Resolved",
      Priority: "High",
      Category: "Support",
      ResolutionDate: "2024-06-03T15:45:00Z",
      CreatedDate: "2024-05-28T09:20:00Z",
      LastUpdated: "2024-06-03T15:45:00Z",
      Response: "We have arranged additional support sessions and assigned a learning specialist to help your child."
    }
  ]);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredFeedback = feedbackData.filter(feedback => {
    const matchesSearch = feedback.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.CourseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.Comments.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || feedback.Rating.toString() === filterRating;
    return matchesSearch && matchesRating;
  });

  const filteredComplaints = complaintsData.filter(complaint => {
    const matchesSearch = complaint.UserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.IssueDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || complaint.Status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleResponseSubmit = (type, id) => {
    if (type === 'feedback') {
      setFeedbackData(prev => prev.map(item => 
        item.FeedbackID === id ? { ...item, Response: responseText } : item
      ));
    } else {
      setComplaintsData(prev => prev.map(item => 
        item.ComplaintID === id ? { 
          ...item, 
          Response: responseText,
          Status: 'In Progress',
          LastUpdated: new Date().toISOString()
        } : item
      ));
    }
    setShowResponseModal(false);
    setResponseText('');
  };

  const markAsRead = (feedbackId) => {
    setFeedbackData(prev => prev.map(item => 
      item.FeedbackID === feedbackId ? { ...item, IsRead: true } : item
    ));
  };

  const updateComplaintStatus = (complaintId, newStatus) => {
    setComplaintsData(prev => prev.map(item => 
      item.ComplaintID === complaintId ? { 
        ...item, 
        Status: newStatus,
        ResolutionDate: newStatus === 'Resolved' ? new Date().toISOString() : null,
        LastUpdated: new Date().toISOString()
      } : item
    ));
  };

  const exportData = () => {
    const dataToExport = activeTab === 'feedback' ? filteredFeedback : filteredComplaints;
    console.log('Exporting data:', dataToExport);
    alert(`${activeTab === 'feedback' ? 'Feedback' : 'Complaints'} data exported successfully!`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">Feedback & Complaints Dashboard</h1>
          <p className="text-blue-100">Manage student feedback and resolve complaints</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'feedback'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
            >
              <MessageSquare className="inline-block w-4 h-4 mr-2" />
              Student Feedback ({feedbackData.length})
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'complaints'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
            >
              <AlertCircle className="inline-block w-4 h-4 mr-2" />
              Complaints ({complaintsData.length})
            </button>
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              
              {activeTab === 'feedback' ? (
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              ) : (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              )}
            </div>
            
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'feedback' ? (
            /* Feedback Section */
            <div className="space-y-4">
              {filteredFeedback.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No feedback found matching your criteria.</p>
                </div>
              ) : (
                filteredFeedback.map((feedback) => (
                  <div
                    key={feedback.FeedbackID}
                    className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
                      !feedback.IsRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-800">{feedback.StudentName}</span>
                            {!feedback.IsRead && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">New</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">{feedback.CourseName}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-1">
                            {renderStars(feedback.Rating)}
                            <span className="text-sm text-gray-600 ml-2">({feedback.Rating}/5)</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(feedback.FeedbackDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!feedback.IsRead && (
                          <button
                            onClick={() => markAsRead(feedback.FeedbackID)}
                            className="p-2 text-blue-500 hover:text-blue-700"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedFeedback(feedback)}
                          className="p-2 text-gray-500 hover:text-gray-700"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{feedback.Comments}</p>
                    
                    {feedback.Response ? (
                      <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-4">
                        <p className="text-sm font-medium text-green-800 mb-1">Your Response:</p>
                        <p className="text-green-700">{feedback.Response}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedFeedback(feedback);
                          setShowResponseModal(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center"
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Respond
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Complaints Section */
            <div className="space-y-4">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No complaints found matching your criteria.</p>
                </div>
              ) : (
                filteredComplaints.map((complaint) => (
                  <div
                    key={complaint.ComplaintID}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-800">{complaint.UserName}</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {complaint.UserType}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(complaint.Status)}`}>
                            {complaint.Status}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                          <span className={`font-medium ${getPriorityColor(complaint.Priority)}`}>
                            {complaint.Priority} Priority
                          </span>
                          <span>{complaint.Category}</span>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(complaint.CreatedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <select
                          value={complaint.Status}
                          onChange={(e) => updateComplaintStatus(complaint.ComplaintID, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="p-2 text-gray-500 hover:text-gray-700"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{complaint.IssueDescription}</p>
                    
                    {complaint.Response ? (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-4">
                        <p className="text-sm font-medium text-blue-800 mb-1">Response:</p>
                        <p className="text-blue-700">{complaint.Response}</p>
                        <p className="text-xs text-blue-600 mt-2">
                          Last updated: {new Date(complaint.LastUpdated).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowResponseModal(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center"
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Respond
                      </button>
                    )}
                    
                    {complaint.ResolutionDate && (
                      <div className="mt-3 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Resolved on {new Date(complaint.ResolutionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Respond to {activeTab === 'feedback' ? 'Feedback' : 'Complaint'}
              </h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {activeTab === 'feedback' ? 'Original Feedback:' : 'Original Complaint:'}
              </p>
              <p className="text-gray-800">
                {activeTab === 'feedback' ? selectedFeedback?.Comments : selectedComplaint?.IssueDescription}
              </p>
            </div>
            
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Enter your response..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResponseSubmit(
                  activeTab, 
                  activeTab === 'feedback' ? selectedFeedback?.FeedbackID : selectedComplaint?.ComplaintID
                )}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={!responseText.trim()}
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherFeedbackPanel;