import React, { useEffect, useMemo, useState } from "react";
import { courseService } from "@/config/course.config";
import { 
  Search, 
  Filter, 
  MessageCircle, 
  AlertCircle, 
  X, 
  Send, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Clock 
} from "lucide-react";

// Helper to safely format dates
const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TeacherFeedbackPanel = () => {
  const [activeTab, setActiveTab] = useState("complaints"); // complaints | feedback
  const [isAdminView, setIsAdminView] = useState(false); 

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState("");

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [complaintsList, setComplaintsList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); 
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [replyText, setReplyText] = useState("");
  const [statusValue, setStatusValue] = useState("open");

  const normalizeList = (resData) => {
    if (Array.isArray(resData)) return resData;
    return resData?.results || resData?.data?.results || [];
  };

  // 1. Auto-Detect Admin Role
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.is_staff || user.is_superuser || user.user_type === 'admin') {
          setIsAdminView(true);
        }
      } catch (e) {
        console.error("Error parsing user", e);
      }
    }
  }, []);

  // 2. Load Courses
  const loadTeacherCourses = async () => {
    setLoadingCourses(true);
    try {
      const list = await courseService.getCoursesteacher();
      const safe = Array.isArray(list) ? list : [];
      setCourses(safe);
      if (safe.length > 0) {
        setSelectedCourseId(String(safe[0]?.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCourses(false);
    }
  };

  // 3. Load Data
  const loadData = async () => {
    setLoadingData(true);
    try {
      let cData = [];
      let fData = [];

      if (isAdminView) {
        const [cRes, fRes] = await Promise.all([
           courseService.getAdminAllComplaints(),
           courseService.getAdminAllFeedback(),
        ]);
        cData = normalizeList(cRes?.data || cRes);
        fData = normalizeList(fRes?.data || fRes);
      } else {
        if (!selectedCourseId) {
            setLoadingData(false);
            return;
        }
        const [cRes, fRes] = await Promise.all([
          courseService.getTeacherComplaints(selectedCourseId),
          courseService.getTeacherFeedback(selectedCourseId),
        ]);
        cData = normalizeList(cRes?.data);
        fData = normalizeList(fRes?.data);
      }

      setComplaintsList(cData);
      setFeedbackList(fData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadTeacherCourses();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, isAdminView]); 

  // Filtering
  const filteredComplaints = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return complaintsList;
    return complaintsList.filter((x) =>
      (x.title || "").toLowerCase().includes(s) ||
      (x.description || "").toLowerCase().includes(s) ||
      (x.student_name || "").toLowerCase().includes(s)
    );
  }, [complaintsList, search]);

  const filteredFeedback = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return feedbackList;
    return feedbackList.filter((x) =>
      (x.title || "").toLowerCase().includes(s) ||
      (x.student_name || "").toLowerCase().includes(s)
    );
  }, [feedbackList, search]);

  // Actions
  const openReplyModal = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setReplyText("");
    
    if (type === "complaint") {
      setReplyText(item?.reply || "");
      setStatusValue(item?.status || "open");
    }
    
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setSelectedItem(null);
    setReplyText("");
  };

  const handleDelete = async (type, item) => {
    if (!window.confirm("Are you sure you want to delete this? This action cannot be undone.")) return;

    try {
      if (type === "complaint") {
        await courseService.deleteTeacherComplaint(item.course, item.id);
      } else {
        await courseService.deleteTeacherFeedback(item.qa_id || item.id);
      }
      loadData();
    } catch (e) {
      alert("Failed to delete item.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    try {
      if (modalType === "complaint") {
        await courseService.updateTeacherComplaint(selectedCourseId || selectedItem.course, selectedItem.id, {
          reply: replyText,
          status: statusValue,
        });
      } else if (modalType === "feedback") {
        const targetCourseId = selectedItem.course_id || selectedCourseId;
        await courseService.replyToFeedback(targetCourseId, selectedItem.qa_id, {
            message: replyText
        });
      }
      closeModal();
      loadData(); 
    } catch (e) {
      alert("Failed to submit reply.");
    }
  };

  return (
    <div className="min-h-screen p-6 font-sans bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col gap-4 p-6 mb-6 text-white rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold uppercase">Feedback & Complaints Center</h1>
            <p className="mt-1 text-sm text-orange-100 opacity-90">
              {isAdminView ? "Admin View: Managing system-wide records" : "Manage student inquiries and course issues"}
            </p>
          </div>
          
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-col items-center justify-between gap-4 mb-6 md:flex-row">
          
          {/* Tabs */}
          <div className="flex p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
            <button
              onClick={() => setActiveTab("complaints")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "complaints" 
                  ? "bg-orange-600 text-white shadow-md" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <AlertCircle size={16} /> Complaints
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "feedback" 
                  ? "bg-orange-600 text-white shadow-md" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MessageCircle size={16} /> Q&A Feedback
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col w-full gap-3 sm:flex-row md:w-auto">
            {!isAdminView && (
              <div className="relative">
                <Filter className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={16} />
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  disabled={loadingCourses}
                  className="w-full h-10 py-2 pr-4 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm outline-none pl-9 sm:w-48 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or title..."
                className="w-full h-10 py-2 pr-4 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm outline-none pl-9 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-h-[400px] overflow-hidden">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-8 h-8 mb-4 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
              <p>Loading records...</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {activeTab === "complaints" ? (
                // --- COMPLAINTS GRID ---
                filteredComplaints.length === 0 ? (
                  <p className="py-12 text-center text-gray-500">No complaints found.</p>
                ) : (
                  <div className="grid gap-4">
                    {filteredComplaints.map((c) => (
                      <div key={c.id} className="relative p-5 transition-all bg-white border border-gray-200 group rounded-xl hover:shadow-md hover:border-orange-200">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">{c.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                            c.status === 'resolved' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {c.status === 'resolved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {c.status}
                          </span>
                        </div>
                        
                        <p className="mb-4 text-sm leading-relaxed text-gray-600">{c.description}</p>
                        
                        <div className="flex items-center gap-3 pb-4 mb-4 text-xs text-gray-500 border-b border-gray-100">
                          <span className="font-medium text-gray-700">From: {c.student_name}</span>
                          <span>•</span>
                          <span className={`capitalize ${c.priority === 'high' ? 'text-red-600 font-bold' : ''}`}>Priority: {c.priority}</span>
                          <span>•</span>
                          <span>{formatDate(c.created_at)}</span>
                        </div>

                        {c.reply && (
                          <div className="p-3 mb-4 text-sm border-l-4 border-orange-500 rounded-lg bg-gray-50">
                            <span className="block mb-1 font-bold text-gray-800">Teacher Reply:</span>
                            <span className="text-gray-600">{c.reply}</span>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openReplyModal("complaint", c)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-400"
                          >
                            <Edit2 size={14} />
                            {c.reply ? "Edit Reply" : "Resolve"}
                          </button>
                          <button
                            onClick={() => handleDelete("complaint", c)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 transition-colors bg-white border border-red-200 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // --- FEEDBACK GRID ---
                filteredFeedback.length === 0 ? (
                  <p className="py-12 text-center text-gray-500">No feedback found.</p>
                ) : (
                  <div className="grid gap-4">
                    {filteredFeedback.map((f) => (
                      <div key={f.qa_id || f.id} className="p-5 transition-all bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-orange-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{f.title}</h4>
                          <span className="text-xs font-medium text-gray-400">{formatDate(f.date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                          <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Student</span>
                          {f.profile?.full_name || "Unknown Student"}
                        </div>

                        <div className="flex items-center gap-2 p-2 mb-4 text-xs text-gray-500 rounded-lg bg-gray-50 w-fit">
                          <MessageCircle size={14} className="text-orange-500" />
                          {f.messages?.length || 0} messages in thread
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openReplyModal("feedback", f)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700"
                          >
                            <MessageCircle size={14} />
                            View & Reply
                          </button>
                          <button
                            onClick={() => handleDelete("feedback", f)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 transition-colors bg-white border border-red-200 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Modal Overlay */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
            <div 
              className="w-full max-w-lg overflow-hidden transition-all transform scale-100 bg-white shadow-2xl rounded-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">
                  {modalType === "complaint" ? "Resolve Complaint" : "Feedback Thread"}
                </h3>
                <button onClick={closeModal} className="p-1 text-gray-400 transition rounded-full hover:text-gray-600 hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {modalType === "complaint" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Status</label>
                      <select 
                        value={statusValue} 
                        onChange={(e) => setStatusValue(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Official Response</label>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={5}
                        className="w-full p-3 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Write your response to the student..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Chat History */}
                    <div className="flex-1 p-4 mb-4 space-y-3 overflow-y-auto border border-gray-100 bg-gray-50 rounded-xl max-h-64">
                      {selectedItem.messages && selectedItem.messages.length > 0 ? (
                        selectedItem.messages.map((msg, idx) => {
                          // Simple logic to detect if message is from student or teacher (based on object user vs profile match)
                          // Adjust based on your actual data structure logic for user IDs
                          const isStudent = msg.user === selectedItem.user; 
                          return (
                            <div key={idx} className={`flex ${isStudent ? 'justify-start' : 'justify-end'}`}>
                              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                                isStudent 
                                  ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' 
                                  : 'bg-orange-600 text-white rounded-tr-none'
                              }`}>
                                <p>{msg.message}</p>
                                <span className={`text-[10px] block mt-1 ${isStudent ? 'text-gray-400' : 'text-orange-200'}`}>
                                  {formatDate(msg.date)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-sm text-gray-400">
                          <MessageCircle size={24} className="mb-2 opacity-50" />
                          <p>No messages yet.</p>
                        </div>
                      )}
                    </div>

                    {/* Reply Input */}
                    <div>
                      <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Reply</label>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        className="w-full p-3 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Type your message here..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button 
                  onClick={closeModal} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit} 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-orange-600 rounded-lg hover:bg-orange-700"
                >
                  {modalType === "complaint" ? <CheckCircle2 size={16} /> : <Send size={16} />}
                  {modalType === "complaint" ? "Update Status" : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherFeedbackPanel;