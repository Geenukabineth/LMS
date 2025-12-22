import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Sparkle, Star, Trash2, Pencil, Book, DollarSign, Loader2 } from 'lucide-react';
import CourseCreator from '@/components/courseData/courseCreator';
import CustomNotification from '@/components/CustomNotification';
import { courseService } from '@/config/course.config';

const CourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCourseCreator, setShowCourseCreator] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Maps backend API response to frontend UI structure
  const mapCourseData = (course) => ({
    id: course.id,
    course_id: course.course_id,
    title: course.title || 'Untitled',
    slug: course.slug,
    image: course.image,
    platform_status: course.platform_status || 'draft',
    description: course.description,
    department: course.Department || course.department || 'General',
    teacher_id: course.teacher?.teacher_id || course.teacher_id,
    teacher_name: course.teacher?.full_name || 'Unknown Instructor',
    students: course.student_count || 0,
    language: course.language || 'English',
    level: course.level || 'Grade 1',
    price: course.price || '0.00',
    average_rating: course.average_rating ? parseFloat(course.average_rating).toFixed(1) : 'N/A',
  });

  // Fetch courses on component mount
  const loadCourses = async () => {
    setLoading(true);
    try {
      // Backend returns { "courses": [...] }, so we access .courses
      const data = await courseService.getCoursesList();
      const mapped = Array.isArray(data) ? data.map(mapCourseData) : [];
      setCourses(mapped);
      setError(null);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to load courses. Please check your connection or permissions.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Handles UI update after POST or PUT
  const handleCourseCreatedOrUpdated = (updatedCourse) => {
    const mapped = mapCourseData(updatedCourse);
    
    setCourses((prev) => {
      const exists = prev.find(c => c.id === mapped.id);
      if (exists) {
        return prev.map(c => c.id === mapped.id ? mapped : c);
      }
      return [mapped, ...prev];
    });

    showNotify(editingCourse ? 'Course updated successfully!' : 'Course created successfully!', 'success');
    setEditingCourse(null);
    setShowCourseCreator(false);
  };

  // DELETE Implementation
  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this course?')) return;

    try {
      await courseService.deleteCoursesList(id); // Calls API DELETE Course/courses/delete/<id>/
      setCourses((prev) => prev.filter((course) => course.id !== id));
      showNotify('Course deleted successfully!', 'success');
    } catch (err) {
      console.error('Delete Error:', err);
      showNotify('Failed to delete course. Ensure you have admin privileges.', 'error');
    }
  };

  // PUT Implementation - Opens modal with existing data
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowCourseCreator(true);
  };

  const showNotify = (message, type) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification(n => ({ ...n, visible: false })), 3000);
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.platform_status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600">Manage {courses.length} courses on the platform</p>
          </div>
          <button
            onClick={() => { setEditingCourse(null); setShowCourseCreator(true); }}
            className="flex items-center px-6 py-3 space-x-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create Course</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 mb-6 bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search by title or teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 pl-4 pr-10 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 mb-4 animate-spin text-blue-600" />
            <p>Loading your courses...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.length === 0 && (
              <div className="py-20 text-center text-gray-500 md:col-span-3">No courses found.</div>
            )}

            {filteredCourses.map((course) => (
              <div key={course.id} className="overflow-hidden bg-white border border-gray-200 shadow-md rounded-xl hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <img
                    src={course.image || 'https://placehold.co/600x400?text=No+Image'}
                    alt={course.title}
                    className="object-cover w-full h-full"
                  />
                  <span className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full ${
                    course.platform_status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {course.platform_status.toUpperCase()}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="mb-1 text-lg font-bold text-gray-900 truncate">{course.title}</h3>
                  <p className="mb-4 text-sm text-gray-500">Instructor: {course.teacher_name}</p>

                  <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                    <div className="flex items-center"><Users className="w-4 h-4 mr-1" /> {course.students}</div>
                    <div className="flex items-center"><Book className="w-4 h-4 mr-1" /> {course.level}</div>
                    <div className="flex items-center text-yellow-600"><Star className="w-4 h-4 mr-1 fill-current" /> {course.average_rating}</div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-lg font-bold text-green-700">Rs. {course.price}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="p-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit Course"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Create/Update */}
        <CourseCreator
          isOpen={showCourseCreator}
          onClose={() => { setShowCourseCreator(false); setEditingCourse(null); }}
          onCourseCreated={handleCourseCreatedOrUpdated}
          course={editingCourse} // Pass existing course for PUT
        />

        {notification.visible && (
          <CustomNotification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification((n) => ({ ...n, visible: false }))}
          />
        )}
      </div>
    </div>
  );
};

export default CourseManagement;