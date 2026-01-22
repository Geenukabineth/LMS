import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Plus, ExternalLink, Loader, AlertCircle, Trash2, Edit } from 'lucide-react'; // ✅ Added Icons
import { courseService } from "@/config/course.config";

const LiveClassroom = ({ courseId: propCourseId, isTeacher: propIsTeacher }) => {
  const [sessions, setSessions] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(propCourseId || "");
  const [loading, setLoading] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', time: '' });
  const [editingSession, setEditingSession] = useState(null); // ✅ Track editing state

  // 1. Fetch Courses if needed
  useEffect(() => {
    if (!propCourseId) {
      const loadCourses = async () => {
        try {
          const data = await courseService.getCoursesteacher(); 
          const coursesList = Array.isArray(data) ? data : (data?.results || []);
          setMyCourses(coursesList);
          if (coursesList.length > 0) setSelectedCourseId(coursesList[0].id);
        } catch (e) { console.error(e); }
      };
      loadCourses();
    }
  }, [propCourseId]);

  // 2. Fetch Sessions
  useEffect(() => {
    if (selectedCourseId) fetchSessions(selectedCourseId);
  }, [selectedCourseId]);

  const fetchSessions = async (id) => {
    try {
      setLoading(true);
      const data = await courseService.getLiveSessions(id);
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({ title: '', date: '', time: '' });
    setEditingSession(null);
  };

  // ✅ Handle Create OR Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return alert("Select a course first.");

    try {
      if (editingSession) {
        // UPDATE Existing
        await courseService.updateLiveSession(editingSession.id, { ...formData, course_id: selectedCourseId });
        alert("Class Updated Successfully!");
      } else {
        // CREATE New
        await courseService.createLiveSession({ ...formData, course_id: selectedCourseId });
        alert("Class Scheduled Successfully!");
      }
      resetForm();
      fetchSessions(selectedCourseId);
    } catch (error) {
      alert("Failed to save class.");
    }
  };

  // ✅ Handle Edit Click
  const handleEditClick = (session) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      date: session.date,
      time: session.time // Ensure format matches input type="time" (HH:MM:SS or HH:MM)
    });
    setShowForm(true);
  };

  // ✅ Handle Delete Click
  const handleDelete = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await courseService.deleteLiveSession(sessionId);
      alert("Session deleted.");
      fetchSessions(selectedCourseId);
    } catch (error) {
      alert("Failed to delete session.");
    }
  };

  const handleJoin = async (sessionId) => {
    try {
      const response = await courseService.joinSessionAndMarkAttendance(sessionId);
      if (response.join_url) window.open(response.join_url, '_blank');
    } catch (error) {
      alert("Could not join session.");
    }
  };

  const canCreate = propIsTeacher || (myCourses.length > 0);

  return (
    <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
      <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row md:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Video className="text-orange-500" /> Live Classroom
          </h2>
          <p className="text-sm text-gray-500">Manage your Jitsi Meet sessions.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => {
                if (showForm) resetForm();
                else setShowForm(true);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-white transition rounded-lg ${showForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-orange-600 hover:bg-orange-700'}`}
          >
            <Plus size={18} className={showForm ? "rotate-45 transition-transform" : ""} /> 
            {showForm ? "Cancel" : "Schedule Class"}
          </button>
        )}
      </div>

      {!propCourseId && (
        <div className="mb-6">
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full p-2 border rounded">
                <option value="">-- Select Course --</option>
                {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
        </div>
      )}

      {showForm && (
        <div className="p-5 mb-8 border rounded-lg bg-gray-50">
          <h3 className="mb-4 font-semibold text-gray-700">{editingSession ? "Update Session" : "Schedule New Session"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input type="text" placeholder="Topic" required className="p-2 border rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="date" required className="p-2 border rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            <input type="time" required className="p-2 border rounded" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            <button type="submit" className="py-2 font-semibold text-white bg-green-600 rounded col-span-full hover:bg-green-700">
                {editingSession ? "Update Class" : "Generate Meeting Link"}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {loading ? <Loader className="mx-auto animate-spin" /> : sessions.map((session) => (
            <div key={session.id} className="flex flex-col items-center justify-between p-4 border rounded-lg md:flex-row hover:shadow-md">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{session.title}</h3>
                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                   <span className="flex items-center gap-1"><Calendar size={14}/> {session.date}</span> 
                   <span className="flex items-center gap-1"><Clock size={14}/> {session.time}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-3 md:mt-0">
                  {/* Join Button */}
                  <button onClick={() => handleJoin(session.id)} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700">
                    <ExternalLink size={16} className="inline mr-2"/> Join
                  </button>

                  {/* ✅ Edit/Delete Actions (Only for Teachers/Creators) */}
                  {canCreate && (
                    <div className="flex gap-2 pl-3 ml-2 border-l border-gray-300">
                        <button 
                            onClick={() => handleEditClick(session)}
                            className="p-2 text-blue-600 transition rounded-lg bg-blue-50 hover:bg-blue-100"
                            title="Edit Session"
                        >
                            <Edit size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(session.id)}
                            className="p-2 text-red-600 transition rounded-lg bg-red-50 hover:bg-red-100"
                            title="Delete Session"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  )}
              </div>
            </div>
        ))}
        {!loading && sessions.length === 0 && (
            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl">
                <p>No live sessions scheduled yet.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LiveClassroom;