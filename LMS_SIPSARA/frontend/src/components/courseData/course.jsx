import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Sparkle, Star, PlayCircle, Trash2, Pencil, Book, DollarSign } from 'lucide-react';
import CourseCreator from '@/components/courseData/courseCreator';
import CustomNotification from '@/components/CustomNotification';
import authService from '@/services/authService';
import axios from 'axios';

const CourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCourseCreator, setShowCourseCreator] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ FIXED: Helper function to map backend data to frontend format
  const mapCourseData = (course) => ({
    id: course.id,
    course_id: course.course_id,
    title: course.title || 'Untitled',
    slug: course.slug,
    image: course.image,
    platform_status: course.platform_status || 'draft',
    
    // ✅ FIX: Map Department field (capital D) to department
    department: course.Department || course.department || 'General',
    
    // ✅ FIX: Extract teacher name from teacher object
    teacher_name: course.teacher?.full_name || 
                  (course.teacher?.First_Name && course.teacher?.Last_Name 
                    ? `${course.teacher.First_Name} ${course.teacher.Last_Name}`
                    : 'Unknown Instructor'),
    
    // ✅ FIX: Map student_count to students for display
    students: course.student_count || 0,
    
    language: course.language || 'N/A',
    level: course.level || 'N/A',
    price: course.price || '0.00',
    
    // ✅ FIX: Handle average_rating safely
    average_rating: course.average_rating 
      ? parseFloat(course.average_rating).toFixed(1) 
      : 'N/A',
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:8000/Course/courses/list/admin/');
        let data = response.data;
        console.log('✅ Raw API response:', data);
        
        // ✅ FIXED: Handle backend response format { courses: [...], course_count: ... }
        let coursesArray = [];
        
        if (Array.isArray(data)) {
          // Direct array response
          coursesArray = data;
        } else if (data.courses && Array.isArray(data.courses)) {
          // Backend returns { courses: [...], course_count: ..., user_authenticated: ..., is_staff: ... }
          coursesArray = data.courses;
          console.log(`✅ Found ${data.courses.length} courses from API`);
        } else if (data.results && Array.isArray(data.results)) {
          // Pagination format { results: [...] }
          coursesArray = data.results;
        } else if (typeof data === 'object' && data !== null && Object.keys(data).length > 0) {
          // Single course object
          coursesArray = [data];
        } else {
          coursesArray = [];
        }

        // ✅ FIXED: Map all courses to frontend format
        const mappedCourses = coursesArray.map(mapCourseData);
        
        console.log('✅ Mapped courses:', mappedCourses);
        console.log(`✅ Total courses to display: ${mappedCourses.length}`);
        
        setCourses(mappedCourses);
      } catch (error) {
        console.error('❌ Error fetching courses:', error);
        console.error('❌ Error response:', error.response?.data);
        setError(`Failed to load courses: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Handle course creation or update
  const handleCourseCreatedOrUpdated = (course) => {
    const mappedCourse = mapCourseData(course);
    
    setCourses((prevCourses) => {
      if (editingCourse) {
        return prevCourses.map((c) =>
          c.id === mappedCourse.id ? mappedCourse : c
        );
      }
      return [mappedCourse, ...prevCourses];
    });
    setNotification({
      message: editingCourse ? 'Course updated successfully!' : 'Course created successfully!',
      type: 'success',
      visible: true,
    });
    setTimeout(() => {
      setNotification((n) => ({ ...n, visible: false }));
    }, 3000);
    setEditingCourse(null);
    setShowCourseCreator(false);
  };

  // Handle course deletion
  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    if (!authService.isAuthenticated()) {
      setNotification({
        message: 'Please log in to delete a course.',
        type: 'error',
        visible: true,
      });
      setTimeout(() => {
        setNotification((n) => ({ ...n, visible: false }));
      }, 3000);
      return;
    }

    try {
      await authService.deleteCourse(id);
      setCourses((prevCourses) => prevCourses.filter((course) => course.id !== id));
      setNotification({
        message: 'Course deleted successfully!',
        type: 'success',
        visible: true,
      });
      setTimeout(() => {
        setNotification((n) => ({ ...n, visible: false }));
      }, 3000);
    } catch (error) {
      console.error('Error deleting course:', error);
      setNotification({
        message: error.response?.status === 401
          ? 'Unauthorized: Please log in again.'
          : error.message || 'Failed to delete course. Please try again.',
        type: 'error',
        visible: true,
      });
      setTimeout(() => {
        setNotification((n) => ({ ...n, visible: false }));
      }, 3000);
    }
  };

  // Handle edit course
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowCourseCreator(true);
  };

  // Handle create course button click
  const handleCreateCourseClick = () => {
    if (!authService.isAuthenticated()) {
      setNotification({
        message: 'Please log in to create a course.',
        type: 'error',
        visible: true,
      });
      setTimeout(() => {
        setNotification((n) => ({ ...n, visible: false }));
      }, 3000);
      return;
    }
    
    setEditingCourse(null);
    setShowCourseCreator(true);
  };

  // Filter courses
  const filteredCourses = Array.isArray(courses)
    ? courses.filter((course) => {
        const matchesSearch =
          (course.title && course.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (course.teacher_name && course.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
          filterStatus === 'all' ||
          (course.platform_status && course.platform_status.toLowerCase() === filterStatus.toLowerCase());

        return matchesSearch && matchesStatus;
      })
    : [];

  return (
    <div className="min-h-screen p-8 font-sans bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between mb-6 space-y-4 sm:flex-row sm:items-center sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600">Create, edit, and manage your courses</p>
          </div>
          <button
            onClick={handleCreateCourseClick}
            className="flex items-center px-6 py-3 space-x-2 text-white transition-transform transform bg-blue-600 shadow-md hover:bg-blue-700 rounded-xl hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create Course</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-10 text-center text-gray-500">Loading courses...</div>
        )}

        {/* Search & Filter */}
        {!loading && (
          <div className="p-6 mb-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Filter className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="py-2 pl-10 pr-8 transition-all border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                    <svg
                      className="w-4 h-4 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.length === 0 && (
              <div className="py-10 text-center text-gray-500 md:col-span-3">
                {courses.length === 0 
                  ? 'No courses available. Create your first course!'
                  : 'No courses found matching your criteria.'}
              </div>
            )}

            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="overflow-hidden transition-shadow duration-300 bg-white border border-gray-200 shadow-lg rounded-xl hover:shadow-xl"
              >
                <div className="relative">
                  <img
                    src={
                      course.image ||
                      'https://placehold.co/300x200/e5e7eb/757575?text=Course+Image'
                    }
                    alt={course.title}
                    className="object-cover w-full h-48"
                    onError={(e) => {
                      e.target.src =
                        'https://placehold.co/300x200/e5e7eb/757575?text=Course+Image';
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        course.platform_status?.toLowerCase() === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : course.platform_status?.toLowerCase() === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {course.platform_status || 'Unknown'}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 text-xs font-medium text-gray-700 rounded-full bg-white/90 backdrop-blur">
                      {course.department}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {course.title}
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    by {course.teacher_name}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {course.students}
                      </div>
                      <div className="flex items-center">
                        <Book className="w-4 h-4 mr-1" />
                        {course.language}
                      </div>
                      <div className="flex items-center">
                        <Sparkle className="w-4 h-4 mr-1" />
                        {course.level}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-yellow-600">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      {course.average_rating}
                    </div>
                  </div>
                  
                  <p className="flex items-center mb-4 text-sm font-medium text-gray-800">
                    <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                    <span className="text-lg font-semibold text-green-700">
                      Rs. {course.price}
                    </span>
                  </p>

                  <div className="flex space-x-2">
                    
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                      title="Edit course"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="px-4 py-2 text-sm font-medium text-red-700 transition-colors border border-red-300 rounded-lg hover:bg-red-50"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Course Creator Modal */}
        <CourseCreator
          isOpen={showCourseCreator}
          onClose={() => {
            setEditingCourse(null);
            setShowCourseCreator(false);
          }}
          onCourseCreated={handleCourseCreatedOrUpdated}
          course={editingCourse}
        />

        {/* Custom Notification */}
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