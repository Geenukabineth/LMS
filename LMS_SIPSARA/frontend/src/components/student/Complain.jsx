import React, { useEffect, useMemo, useState } from "react";
import { courseService } from "@/config/course.config"; 

const Complain = () => {
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Data State
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [complaints, setComplaints] = useState([]);
  
  // Search State
  const [search, setSearch] = useState("");

  // Create Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [editing, setEditing] = useState(null);

  // --- Helpers ---
  const normalizeList = (resData) => {
    if (Array.isArray(resData)) return resData;
    // Handles pagination { count: ..., results: [...] }
    return resData?.results || [];
  };

  const getTeacherName = (course) => {
    if (!course) return "N/A";
    // The API sends 'teacher_name' directly in the serializer
    if (course.teacher_name) return course.teacher_name;
    
    // Fallbacks if data structure varies
    return (
      course.teacher?.full_name ||
      course.teacher?.user?.username ||
      "N/A"
    );
  };

  // --- Load Data ---
  const loadEnrolledCourses = async () => {
    setLoadingCourses(true);
    try {
      // ✅ Calls the new function we added to course.config.js
      const res = await courseService.getStudentEnrolledCourses(); 
      const list = normalizeList(res.data || res); // Handle both direct array or axios response
      setEnrolledCourses(list);

      // Auto-select first course if available
      if (!selectedCourse && list.length > 0) {
        setSelectedCourse(list[0]);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadComplaints = async (courseObj) => {
    // We need the Course ID (not enrollment ID) to fetch complaints
    if (!courseObj?.course_id) return;
    
    setLoadingComplaints(true);
    try {
      const res = await courseService.getCourseComplaints(courseObj.course_id);
      setComplaints(normalizeList(res.data));
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    loadEnrolledCourses();
    
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadComplaints(selectedCourse);
    }
  }, [selectedCourse]);

  // --- Filtering ---
  const filteredComplaints = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return complaints;
    return complaints.filter((c) => 
      (c.title || "").toLowerCase().includes(s) ||
      (c.description || "").toLowerCase().includes(s) ||
      (c.status || "").toLowerCase().includes(s)
    );
  }, [complaints, search]);

  // --- Actions ---
  const handleCreate = async () => {
    if (!selectedCourse?.course_id) {
      alert("Please select a course first.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      alert("Title and description are required.");
      return;
    }

    setLoadingComplaints(true);
    try {
      await courseService.createCourseComplaint(selectedCourse.course_id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        send_to: "teacher", 
      });

      setTitle("");
      setDescription("");
      setPriority("medium");
      await loadComplaints(selectedCourse);
      alert("Complaint submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create complaint.");
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing || !selectedCourse?.course_id) return;
    setLoadingComplaints(true);
    try {
      await courseService.updateCourseComplaint(selectedCourse.course_id, editing.id, {
        title: editing.title,
        description: editing.description,
        priority: editing.priority,
        send_to: "teacher",
        status: editing.status 
      });
      setEditing(null);
      await loadComplaints(selectedCourse);
      alert("Complaint updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update complaint.");
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    setLoadingComplaints(true);
    try {
      await courseService.deleteCourseComplaint(selectedCourse.course_id, id);
      await loadComplaints(selectedCourse);
    } catch (err) {
      console.error(err);
      alert("Failed to delete complaint.");
    } finally {
      setLoadingComplaints(false);
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen p-4 bg-gray-50 md:p-6">
      <div className="max-w-6xl mx-auto overflow-hidden bg-white shadow rounded-xl">
        <div className="flex flex-col gap-4 p-6 mb-6 text-white rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
          <h1 className="text-2xl font-bold uppercase">Student Complaints</h1>
          
        </div>

        {/* Course Selection */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">
                Select Course
              </label>
              {loadingCourses ? (
                <div className="text-sm text-gray-500">Loading courses...</div>
              ) : (
                <select
                  className="w-full px-4 py-2 bg-white border rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500"
                  value={selectedCourse?.id || ""} 
                  onChange={(e) => {
                    const enrollId = Number(e.target.value);
                    const course = enrolledCourses.find(c => c.id === enrollId);
                    setSelectedCourse(course || null);
                  }}
                >
                  {enrolledCourses.length === 0 && <option>No enrolled courses</option>}
                  {enrolledCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {/* ✅ USES course_title FROM API */}
                      {c.course_title || c.title || `Course #${c.course_id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="flex-1 md:max-w-xs">
              <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">
                Instructor
              </label>
              <div className="px-4 py-2 text-gray-700 bg-white border rounded-lg shadow-sm">
                {/* ✅ USES teacher_name FROM API */}
                {getTeacherName(selectedCourse)}
              </div>
            </div>
          </div>
        </div>

        {/* ... (Rest of the UI: Create Form, List, Edit Modal - same as before) ... */}
        
        <div className="p-6">
           {/* Create Complaint Form */}
           <div className="p-5 mb-8 border border-orange-100 bg-orange-50 rounded-xl">
            <h2 className="mb-4 text-lg font-bold text-orange-900">Submit New Complaint</h2>
            <div className="mb-4">
              <input 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Subject / Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <textarea 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="Describe your issue in detail..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-600">Priority:</span>
                <select 
                  className="px-3 py-1 text-sm bg-white border rounded-lg"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button 
                onClick={handleCreate}
                disabled={loadingComplaints || !selectedCourse}
                className="px-6 py-2 font-semibold text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {loadingComplaints ? "Sending..." : "Submit Complaint"}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">History</h3>
            <div className="flex gap-2">
              <input 
                className="px-3 py-1 text-sm border rounded-lg"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button 
                onClick={() => loadComplaints(selectedCourse)}
                className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="py-10 text-center text-gray-500 border-2 border-dashed rounded-xl">
              No complaints found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map(c => (
                <div key={c.id} className="p-4 transition-shadow bg-white border rounded-lg hover:shadow-md">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{c.title}</h4>
                      <div className="flex gap-2 mt-1 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${
                          c.status === 'open' ? 'bg-green-100 text-green-700' : 
                          c.status === 'resolved' ? 'bg-orange-100 text-orange-700' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {c.status.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 text-gray-600 bg-gray-100 rounded-full">
                          {c.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditing(c)}
                        className="px-3 py-1 text-xs font-medium text-orange-600 rounded bg-orange-50 hover:bg-orange-100"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="px-3 py-1 text-xs font-medium text-red-600 rounded bg-red-50 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{c.description}</p>
                  {c.reply && (
                    <div className="p-3 mt-4 border border-orange-100 rounded bg-orange-50">
                      <p className="mb-1 text-xs font-bold text-orange-800 uppercase">Response from {c.send_to}</p>
                      <p className="text-sm text-orange-900">{c.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal (Copied from previous valid logic) */}
        {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-xl">
            <h3 className="mb-4 text-xl font-bold">Edit Complaint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Title</label>
                <input 
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editing.title} 
                  onChange={e => setEditing({...editing, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  value={editing.description} 
                  onChange={e => setEditing({...editing, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase">Priority</label>
                   <select 
                      className="w-full px-3 py-2 border rounded-lg"
                      value={editing.priority}
                      onChange={e => setEditing({...editing, priority: e.target.value})}
                   >
                     <option value="low">Low</option>
                     <option value="medium">Medium</option>
                     <option value="high">High</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase">Status</label>
                   <select 
                      className="w-full px-3 py-2 border rounded-lg"
                      value={editing.status}
                      onChange={e => setEditing({...editing, status: e.target.value})}
                   >
                     <option value="open">Open</option>
                     <option value="resolved">Resolved</option>
                     <option value="closed">Closed</option>
                   </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Complain;