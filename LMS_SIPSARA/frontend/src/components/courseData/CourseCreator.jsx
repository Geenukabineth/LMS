import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  BookOpen,
  DollarSign,
  Check,
  Loader2,
  Users,
  AlertCircle,
} from "lucide-react";
import authService from '@/services/authService';

function AdminCourseCreator({ isOpen, onClose = () => {}, onCourseCreated = () => {} }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [error, setError] = useState(null);

  const levels = Array.from({ length: 13 }, (_, i) => [`Grade ${i + 1}`, `Grade ${i + 1}`]);

  const languages = [
    { value: "English", label: "English" },
    { value: "Singhalese", label: "Singhalese" },
    { value: "Tamil", label: "Tamil" },
  ];

  const platformStatuses = [
    { value: "published", label: "Published" },
    { value: "draft", label: "Draft" },
  ];

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setError('Please log in to view teachers.');
          return;
        }

        const token = authService.getToken();
        const response = await fetch("http://localhost:8000/lms/register/teacher/list/", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const formattedTeachers = data.map((teacher) => ({
          id: teacher.id,
          name:
            teacher.First_Name && teacher.Last_Name
              ? `${teacher.First_Name} ${teacher.Last_Name}`
              : teacher.username,
          department: teacher.Department,
          email: teacher.user?.email || "",
        }));

        setTeachers(formattedTeachers);
        setFilteredTeachers(formattedTeachers);

        if (formattedTeachers.length > 0) {
          const uniqueDepartments = [
            ...new Set(formattedTeachers.map((t) => t.department).filter(Boolean)),
          ].map((dep, idx) => ({ id: `dep${idx}`, title: dep }));
          setDepartments(uniqueDepartments);
        }
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setError("Failed to load teachers. Please try again.");
      }
    };

    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  const initialState = {
    title: "",
    description: "",
    price: "",
    language: "English",
    level: "Grade 1",
    department: "",
    teacher: "",
    platform_status: "published",
    featured: false,
    image: null,
  };

  const [courseData, setCourseData] = useState(initialState);

  useEffect(() => {
    if (courseData.department) {
      const filtered = teachers.filter(
        (t) => t.department === courseData.department
      );
      setFilteredTeachers(filtered);

      if (
        courseData.teacher &&
        !filtered.some((t) => t.id.toString() === courseData.teacher.toString())
      ) {
        setCourseData((prev) => ({ ...prev, teacher: "" }));
      }
    } else {
      setFilteredTeachers(teachers);
    }
  }, [courseData.department, teachers]);

  // ✅ ENHANCED: Better error reporting
  const saveCourse = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Please log in to create a course.");
      }

      // Validation
      if (
        !courseData.title ||
        !courseData.description ||
        !courseData.department ||
        !courseData.teacher
      ) {
        throw new Error("Please fill in all required fields (Title, Description, Department, Teacher).");
      }

      const formData = new FormData();
      formData.append("title", courseData.title);
      formData.append("description", courseData.description);
      formData.append("price", courseData.price || "0.00");
      formData.append("language", courseData.language);
      formData.append("level", courseData.level);
      formData.append("Department", courseData.department);
      formData.append("teacher", courseData.teacher);
      formData.append("platform_status", courseData.platform_status);
      formData.append("featured", courseData.featured);

      if (image) {
        formData.append("image", image, image.name);
      }

      const token = authService.getToken();
      if (!token) {
        throw new Error("Authentication token not found. Please log in.");
      }

      console.log('📤 Creating course...');
      console.log('Token:', token ? '✅ Present' : '❌ Missing');
      console.log('Department:', courseData.department);
      console.log('Teacher ID:', courseData.teacher);

      const response = await fetch(
        "http://localhost:8000/Course/admin/courses/create/",
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ ENHANCED ERROR HANDLING
      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ Server error details:', errorData);
          
          // Parse different error formats
          if (errorData.detail) {
            errorDetail = errorData.detail;
          } else if (errorData.error) {
            errorDetail = errorData.error;
          } else if (errorData.teacher) {
            errorDetail = `Teacher error: ${JSON.stringify(errorData.teacher)}`;
          } else if (errorData.Department) {
            errorDetail = `Department error: ${JSON.stringify(errorData.Department)}`;
          } else if (errorData.title) {
            errorDetail = `Title error: ${JSON.stringify(errorData.title)}`;
          } else {
            errorDetail = JSON.stringify(errorData);
          }
        } catch (parseError) {
          // If response is HTML (Django error page)
          try {
            const text = await response.text();
            console.error('❌ Server error (HTML):', text.substring(0, 500));
            
            // Extract Django error messages
            if (text.includes('ProgrammingError')) {
              errorDetail = '🔴 Database error: Column missing. Please run: python manage.py migrate course';
            } else if (text.includes('column course_course.assignment_status does not exist')) {
              errorDetail = '🔴 Missing database column. Run migrations: python manage.py migrate course';
            } else if (text.includes('IntegrityError')) {
              errorDetail = '🔴 Database integrity error. Check all required fields are filled.';
            } else if (text.includes('DoesNotExist')) {
              errorDetail = '🔴 Related object not found. Verify teacher exists.';
            } else if (text.includes('PermissionDenied') || text.includes('is_staff')) {
              errorDetail = '🔴 Permission denied. User must be staff/admin.';
            } else if (text.includes('MultiValueDictKeyError')) {
              errorDetail = '🔴 Missing form field. Check all required fields are sent.';
            } else {
              errorDetail = '🔴 Server error. Check Django console for details.';
            }
          } catch {}
        }
        
        // Handle 401 with token refresh
        if (response.status === 401) {
          console.log('🔄 Token expired, attempting refresh...');
          try {
            await authService.refreshToken();
            const newToken = authService.getToken();
            
            const retryResponse = await fetch(
              "http://localhost:8000/Course/admin/courses/create/",
              {
                method: "POST",
                body: formData,
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
            
            if (!retryResponse.ok) {
              throw new Error('❌ Authentication failed after token refresh.');
            }
            
            const createdCourse = await retryResponse.json();
            console.log('✅ Course created after token refresh!');
            alert("✅ Course created successfully and assigned to teacher!");
            onCourseCreated(createdCourse);
            clearForm();
            onClose();
            return;
          } catch (refreshError) {
            throw new Error('❌ Session expired. Please log in again.');
          }
        }
        
        throw new Error(errorDetail);
      }

      const createdCourse = await response.json();
      console.log('✅ Course created successfully:', createdCourse);
      
      alert("✅ Course created successfully and assigned to teacher!");
      onCourseCreated(createdCourse);
      clearForm();
      onClose();
      
    } catch (error) {
      console.error("❌ Error saving course:", error);
      setError(error.message || "Failed to save course. Please try again.");
      
      // Auto-redirect if authentication error
      if (error.message.includes('log in') || error.message.includes('Session expired')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setCourseData(initialState);
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFilteredTeachers(teachers);
    setError(null);
  };

  const handleCourseChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    setError(null);

    if (name === "image" && files && files[0]) {
      const file = files[0];
      setImage(file);
      if (preview) URL.revokeObjectURL(preview);
      const newPreview = URL.createObjectURL(file);
      setPreview(newPreview);
      setCourseData((prev) => ({ ...prev, image: file }));
    } else if (type === "checkbox") {
      setCourseData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setCourseData((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Create Course & Assign to Teacher
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 transition-colors hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ✅ ENHANCED ERROR DISPLAY */}
        {error && (
          <div className="flex items-start p-4 mb-4 border-l-4 border-red-500 rounded-lg shadow-sm bg-red-50">
            <AlertCircle className="w-5 h-5 mr-3 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="mb-1 font-semibold text-red-800">Error Creating Course</p>
              <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
              {error.includes('migrate') && (
                <div className="p-2 mt-2 text-xs border border-yellow-200 rounded bg-yellow-50">
                  <p className="font-semibold text-yellow-800">Quick Fix:</p>
                  <pre className="mt-1 text-yellow-700">
                    python manage.py makemigrations course{'\n'}
                    python manage.py migrate course
                  </pre>
                </div>
              )}
              {error.includes('staff') && (
                <div className="p-2 mt-2 text-xs border border-yellow-200 rounded bg-yellow-50">
                  <p className="font-semibold text-yellow-800">Solution:</p>
                  <p className="text-yellow-700">Make your user a staff member in Django admin panel.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={saveCourse}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Title */}
              <div>
                <label className="flex items-center mb-2 space-x-2 text-sm font-semibold text-gray-700">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span>Course Title *</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={courseData.title}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter course title..."
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center mb-2 space-x-2 text-sm font-semibold text-gray-700">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Description *</span>
                </label>
                <textarea
                  name="description"
                  value={courseData.description}
                  onChange={handleCourseChange}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg resize-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe what students will learn..."
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="flex items-center mb-2 space-x-2 text-sm font-semibold text-gray-700">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span>Price</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={courseData.price}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Level */}
              <div>
                <label className="mb-2 text-sm font-semibold text-gray-700">Level *</label>
                <select
                  name="level"
                  value={courseData.level}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  {levels.map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="mb-2 text-sm font-semibold text-gray-700">Language *</label>
                <select
                  name="language"
                  value={courseData.language}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform Status */}
              <div>
                <label className="mb-2 text-sm font-semibold text-gray-700">Platform Status *</label>
                <select
                  name="platform_status"
                  value={courseData.platform_status}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {platformStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="mb-2 text-sm font-semibold text-gray-700">Department *</label>
                <select
                  name="department"
                  value={courseData.department}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.title}>
                      {dep.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Assignment */}
              <div>
                <label className="flex items-center mb-2 space-x-2 text-sm font-semibold text-gray-700">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Assign to Teacher *</span>
                </label>
                <select
                  name="teacher"
                  value={courseData.teacher}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Teacher</option>
                  {filteredTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.department})
                    </option>
                  ))}
                </select>
                {filteredTeachers.length === 0 && courseData.department && (
                  <p className="mt-1 text-sm text-yellow-600">
                    No teachers found in this department.
                  </p>
                )}
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="featured"
                  id="featured"
                  checked={courseData.featured}
                  onChange={handleCourseChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                  Featured Course
                </label>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-700">
                Course Image
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleCourseChange}
                className="w-full px-4 py-2 border rounded-lg cursor-pointer focus:ring-indigo-500 focus:border-indigo-500"
              />
              {preview && (
                <div className="mt-2">
                  <p className="mb-2 text-xs text-gray-500">Preview:</p>
                  <img
                    src={preview}
                    alt="Preview"
                    className="object-cover w-full h-48 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-center pt-4 mt-6 space-x-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              {loading ? "Creating Course..." : "Create & Assign Course"}
            </button>

            <button
              type="button"
              onClick={clearForm}
              disabled={loading}
              className="px-6 py-3 font-medium text-gray-800 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminCourseCreator;