import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Plus, ExternalLink, Loader, AlertCircle } from 'lucide-react';
import { courseService } from "@/config/course.config";

const LiveClassroom = ({ courseId: propCourseId, isTeacher: propIsTeacher }) => {
  const [sessions, setSessions] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(propCourseId || "");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', time: '' });

  // 1. Fetch Courses if needed (Dashboard view)
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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return alert("Select a course first.");

    try {
      await courseService.createLiveSession({ ...formData, course_id: selectedCourseId });
      alert("Class Scheduled Successfully!");
      setShowForm(false);
      setFormData({ title: '', date: '', time: '' });
      fetchSessions(selectedCourseId);
    } catch (error) {
      alert("Failed to create class.");
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
            <Video className="text-blue-500" /> Live Classroom
          </h2>
          <p className="text-sm text-gray-500">Manage your Jitsi Meet sessions.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} /> {showForm ? "Cancel" : "Schedule Class"}
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
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input type="text" placeholder="Topic" required className="p-2 border rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="date" required className="p-2 border rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            <input type="time" required className="p-2 border rounded" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            <button type="submit" className="py-2 font-semibold text-white bg-green-600 rounded col-span-full hover:bg-green-700">Generate Meeting Link</button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {loading ? <Loader className="mx-auto animate-spin" /> : sessions.map((session) => (
            <div key={session.id} className="flex flex-col items-center justify-between p-4 border rounded-lg md:flex-row hover:shadow-md">
              <div>
                <h3 className="text-lg font-bold">{session.title}</h3>
                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                   <span>{session.date}</span> <span>{session.time}</span>
                </div>
              </div>
              <button onClick={() => handleJoin(session.id)} className="px-6 py-2 mt-2 text-blue-600 border border-blue-200 rounded-lg md:mt-0 bg-blue-50 hover:bg-blue-100">
                <ExternalLink size={18} className="inline mr-2"/> Join Now
              </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default LiveClassroom;