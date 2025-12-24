import React, { useState, useEffect } from "react";
import {
  X, FileText, BookOpen, DollarSign, Check, Loader2, Users, AlertCircle, Globe, GraduationCap, Activity, Star
} from "lucide-react";
import { courseService } from '@/config/course.config';
import { userService } from '@/config/user.config';

function AdminCourseCreator({ isOpen, onClose = () => {}, onCourseCreated = () => {}, course = null }) {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);

  const levels = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Grade 13"];
  const languages = ["English", "Singhalese", "Tamil"];
  const platformStatuses = [
    { value: "published", label: "Published" },
    { value: "draft", label: "Draft" }
  ];

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    language: "English",
    level: "Grade 1",
    department: "",
    teacher: "",
    platform_status: "published",
    featured: false,
  });

  // Effect to pre-fill form or reset based on mode
  useEffect(() => {
    if (course && isOpen) {
      setCourseData({
        title: course.title || "",
        description: course.description || "",
        price: course.price || "",
        language: course.language || "English",
        level: course.level || "Grade 1",
        // ✅ Django Model uses 'Department' (Capital D)
        department: course.Department || course.department || "", 
        // ✅ Normalized to string so the <select> matches the ID correctly
        teacher: course.teacher_id?.toString() || course.teacher?.toString() || "",
        platform_status: course.platform_status || "published",
        featured: course.featured || false,
      });
      if (course.image) setPreview(course.image);
    } else if (!course && isOpen) {
      setCourseData({
        title: "", description: "", price: "", language: "English",
        level: "Grade 1", department: "", teacher: "",
        platform_status: "published", featured: false,
      });
      setPreview(null);
      setImageFile(null);
    }
  }, [course, isOpen]);

  // Fetch teachers list and extract departments
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!isOpen) return;
      try {
        setLoading(true);
        const data = await userService.getTeacherList();            
        const formatted = data.map((t) => ({
          id: t.id.toString(), // Keep as string for comparison
          name: t.First_Name ? `${t.First_Name} ${t.Last_Name}` : t.username,
          department: t.Department,
        }));
        setTeachers(formatted);
        const uniqueDeps = [...new Set(formatted.map((t) => t.department).filter(Boolean))];
        setDepartments(uniqueDeps);
      } catch (err) {
        setError("Failed to load teachers.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [isOpen]);

  // Helper to build FormData
  const prepareFormData = () => {
    const formData = new FormData();
    
    // ✅ FIX: Backend expects 'id' in request.data for update logic
    if (course?.id) {
      formData.append("id", course.id);
    }

    formData.append("title", courseData.title);
    formData.append("description", courseData.description);
    formData.append("price", courseData.price || "0.00");
    formData.append("language", courseData.language);
    formData.append("level", courseData.level);
    formData.append("Department", courseData.department); // Capital D
    formData.append("teacher", courseData.teacher);
    formData.append("platform_status", courseData.platform_status);
    formData.append("featured", courseData.featured);
    
    if (imageFile) formData.append("image", imageFile);
    return formData;
  };

  // ✅ Returning response data to prevent "undefined reading id" error in parent
  const handleCreateCourse = async () => {
    const formData = prepareFormData();
    const responseData = await courseService.postCoursesList(formData);
    alert("✅ Course created successfully!");
    return responseData;
  };

  const handleUpdateCourse = async () => {
    const formData = prepareFormData();
    const responseData = await courseService.putCoursesList(course.id, formData);
    alert("✅ Course updated successfully!");
    return responseData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result; 
      if (course?.id) {
        result = await handleUpdateCourse();
      } else {
        result = await handleCreateCourse();
      }
      
      // ✅ Pass result back to parent to avoid TypeError in course.jsx
      onCourseCreated(result); 
      onClose();
    } catch (err) {
      console.error("Submission Error:", err);
      const serverData = err.response?.data;
      setError(serverData?.detail || (typeof serverData === 'object' ? JSON.stringify(serverData) : err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    setError(null);
    if (type === "file") {
      const file = files[0];
      if (file) {
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
      }
    } else if (type === "checkbox") {
      setCourseData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setCourseData((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <BookOpen className="text-blue-600" /> 
            {course ? "Edit Course Settings" : "New Course Settings"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X /></button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-500 p-4 flex gap-3">
            <AlertCircle className="text-red-600 shrink-0" />
            <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText size={16}/> Title *</label>
              <input type="text" name="title" value={courseData.title} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><DollarSign size={16}/> Price</label>
              <input type="number" name="price" value={courseData.price} onChange={handleInputChange} className="w-full border rounded-lg p-2.5" step="0.01" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Department *</label>
              <select name="department" value={courseData.department} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 bg-white" required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Users size={16}/> Assigned Teacher *</label>
              <select name="teacher" value={courseData.teacher} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 bg-white" required>
                <option value="">Select Teacher</option>
                {/* ✅ Normalizing comparison to string prevents selection failure */}
                {teachers.filter(t => !courseData.department || t.department === courseData.department).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><GraduationCap size={16}/> Course Level</label>
              <select name="level" value={courseData.level} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 bg-white">
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Globe size={16}/> Language</label>
              <select name="language" value={courseData.language} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 bg-white">
                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Activity size={16}/> Platform Status</label>
              <select name="platform_status" value={courseData.platform_status} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 bg-white">
                {platformStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-8">
              <input type="checkbox" id="featured" name="featured" checked={courseData.featured} onChange={handleInputChange} className="w-5 h-5 accent-blue-600 cursor-pointer" />
              <label htmlFor="featured" className="text-sm font-semibold text-gray-700 flex items-center gap-2 cursor-pointer">
                <Star size={16} className={courseData.featured ? "text-yellow-500 fill-yellow-500" : ""} /> Featured Course
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Description *</label>
            <textarea name="description" value={courseData.description} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" rows="3" required />
          </div>

          <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Thumbnail Image</label>
              <input type="file" name="image" accept="image/*" onChange={handleInputChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
            </div>
            {preview && <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg border shadow-sm" />}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
              {loading ? (course ? "Updating..." : "Creating...") : (course ? "Update Course" : "Create Course")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminCourseCreator;