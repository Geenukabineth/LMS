// ✅ ENHANCED: Module Component - Integrated with Your AddWeeklyContent
// This works seamlessly with your existing AddWeeklyContent.jsx

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  FileText,
  Clock,
  Lock,
  BarChart3,
  BookOpen,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Video,
  HelpCircle,
  Settings,
  Eye,
  EyeOff,
  Zap,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddWeeklyContent from '@/components/courseData/AddWeeklyContent';

const Module = ({ courseId: propCourseId, courseTitle: propCourseTitle, courseSlug: propCourseSlug }) => {
  // ✅ State Management
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(propCourseId || null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [showAddContent, setShowAddContent] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [error, setError] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const navigate = useNavigate();

  // ✅ Helper Functions
  const getToken = () => {
    try {
      if (window.authService?.getToken) return window.authService.getToken();
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    } catch (e) {
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    }
  };

  const getUserType = () => {
    try {
      if (window.authService?.getUserType) return window.authService.getUserType();
      return localStorage.getItem('userType');
    } catch (e) {
      return localStorage.getItem('userType');
    }
  };

  const getUserId = () => {
    try {
      if (window.authService?.getUserId) return window.authService.getUserId();
      return localStorage.getItem('userId') || localStorage.getItem('user_id');
    } catch (e) {
      return localStorage.getItem('userId') || localStorage.getItem('user_id');
    }
  };

  // ✅ Initialize
  useEffect(() => {
    const type = getUserType();
    const token = getToken();

    console.log('🔍 Module Init:', { type, tokenExists: !!token });
    setUserType(type);

    if (!token) {
      setError('Please login first. Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
      setCoursesLoading(false);
      return;
    }

    if (type === 'instructor' || type === 'teacher') {
      fetchTeacherCourses();
    } else if (type === 'student') {
      fetchStudentCourses();
    } else {
      setCoursesLoading(false);
      if (propCourseId) {
        fetchCourseFullDetails(propCourseId);
      } else {
        setLoading(false);
        setError('User type not recognized. Please login again.');
      }
    }
  }, []);

  // ✅ Fetch Teacher Courses
  const fetchTeacherCourses = async () => {
    setCoursesLoading(true);
    try {
      const token = getToken();

      const response = await fetch('http://localhost:8000/Course/courses/teacher/count/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        let courses = Array.isArray(data) ? data : data.courses || data.results || [];

        setTeacherCourses(courses);
        setError(null);

        if (!selectedCourseId && courses.length > 0) {
          const courseIdToSelect = courses[0].id || courses[0].course_id;
          setSelectedCourseId(courseIdToSelect);
          setTimeout(() => fetchCourseFullDetails(courseIdToSelect), 100);
        }
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError(`Failed to load courses (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error fetching teacher courses:', error);
      setError('Error loading courses: ' + error.message);
    } finally {
      setCoursesLoading(false);
    }
  };

  // ✅ Fetch Student Courses (FIXED)
  const fetchStudentCourses = async () => {
    setCoursesLoading(true);
    try {
      const token = getToken();
      const userId = getUserId();

      if (!token || !userId) {
        setError('Authentication required. Please login again.');
        setCoursesLoading(false);
        return;
      }

      const url = new URL('http://localhost:8000/Course/enrollments/');
      url.searchParams.append('student_id', userId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        let enrollmentList = Array.isArray(data) ? data : data.results || data.enrollments || [];

        const courses = enrollmentList.map((enrollment) => ({
          id: enrollment.id,
          course_id: enrollment.course_id || enrollment.course?.id,
          course_pk: enrollment.course_id || enrollment.course?.id,
          title: enrollment.course_title || enrollment.course?.title || 'Unknown Course',
          slug: enrollment.course?.slug || enrollment.slug || '',
          enrollment_id: enrollment.enrollment_id,
          teacher_name: enrollment.teacher_name,
          is_expired: enrollment.is_expired || false,
          days_remaining: enrollment.days_remaining || 0,
          has_access: enrollment.has_access || false,
          started_at: enrollment.started_at,
          ended_at: enrollment.ended_at,
          status: enrollment.status,
        })).filter(c => c.course_id && c.title && c.title !== 'Unknown Course');

        setTeacherCourses(courses);
        setError(courses.length === 0 ? 'No enrolled courses available. Browse available courses to enroll!' : null);

        if (!selectedCourseId && courses.length > 0) {
          const courseIdToSelect = courses[0].course_id;
          setSelectedCourseId(courseIdToSelect);
          setTimeout(() => fetchCourseFullDetails(courseIdToSelect), 100);
        }
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError(`Failed to load enrollments (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error fetching student courses:', error);
      setError('Error loading courses: ' + error.message);
    } finally {
      setCoursesLoading(false);
    }
  };

  // ✅ Fetch Course Full Details
  const fetchCourseFullDetails = async (courseId) => {
    setLoading(true);
    try {
      const token = getToken();

      const response = await fetch(`http://localhost:8000/Course/teacher/courses/${courseId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const courseData = await response.json();
        setCourseDetails(courseData.course || courseData);

        if (courseData.modules && Array.isArray(courseData.modules)) {
          setModules(courseData.modules);
          setExpandedModules({}); // Reset expanded modules
        }
      }
    } catch (error) {
      console.error('❌ Error fetching course details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    fetchCourseFullDetails(courseId);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // ✅ Handle returning from AddWeeklyContent
  const handleBackFromAddContent = () => {
    setShowAddContent(false);
    // Refresh course data to show new content
    if (selectedCourseId) {
      setTimeout(() => fetchCourseFullDetails(selectedCourseId), 500);
    }
  };

  // ✅ Get Lesson Icon
  const getLessonIcon = (contentType) => {
    const iconProps = { size: 18, className: 'flex-shrink-0' };
    switch (contentType) {
      case 'video':
        return <Video {...iconProps} className={`${iconProps.className} text-red-500`} />;
      case 'quiz':
        return <BarChart3 {...iconProps} className={`${iconProps.className} text-purple-500`} />;
      case 'assignment':
        return <Zap {...iconProps} className={`${iconProps.className} text-orange-500`} />;
      case 'document':
        return <FileText {...iconProps} className={`${iconProps.className} text-blue-500`} />;
      default:
        return <FileText {...iconProps} className={`${iconProps.className} text-gray-500`} />;
    }
  };

  // ✅ Lesson Card Component
  const LessonCard = ({ lesson }) => (
    <div className="flex items-start gap-4 p-4 transition-all bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:border-blue-300 group">
      {getLessonIcon(lesson.content_type)}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 transition group-hover:text-blue-600 line-clamp-2">
          {lesson.title}
        </h4>
        <p className="text-sm text-gray-600 capitalize">{lesson.content_type}</p>
        {lesson.duration_minutes && (
          <p className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Clock size={12} />
            {lesson.duration_minutes} minutes
          </p>
        )}
      </div>
    </div>
  );

  // ✅ Module Card Component
  const ModuleCard = ({ module, index, isExpanded, onToggle }) => (
    <div className="overflow-hidden transition-shadow bg-white rounded-lg shadow-sm hover:shadow-md">
      <button
        onClick={() => onToggle(module.id)}
        className="flex items-center justify-between w-full px-6 py-4 transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent"
      >
        <div className="flex items-center flex-1 gap-4">
          <div className="flex items-center justify-center w-12 h-12 font-bold text-white rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            {index + 1}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
            <p className="text-sm text-gray-500">
              {module.lessons?.length || 0} lesson{(module.lessons?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={20} className="text-gray-600" />
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {module.lessons && module.lessons.length > 0 ? (
            <div className="space-y-3">
              {module.lessons.map((lesson) => (
                <LessonCard key={lesson.lesson_id || lesson.id} lesson={lesson} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <BookOpen size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No lessons in this module</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ✅ Stats Section
  const StatsSection = ({ course }) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <StatCard
        icon={<BookOpen size={24} />}
        label="Level"
        value={course.level || 'All Levels'}
        color="blue"
      />
      <StatCard
        icon={<Play size={24} />}
        label="Modules"
        value={modules.length}
        color="green"
      />
      <StatCard
        icon={<FileText size={24} />}
        label="Language"
        value={course.language || 'English'}
        color="purple"
      />
      {userType === 'student' && (
        <StatCard
          icon={<Clock size={24} />}
          label="Days Left"
          value={courseDetails?.days_remaining || '∞'}
          color={courseDetails?.is_expired ? 'red' : 'orange'}
        />
      )}
    </div>
  );

  const StatCard = ({ icon, label, value, color }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
    };

    return (
      <div className="p-4 transition bg-white rounded-lg shadow-sm hover:shadow-md">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <p className="text-xs font-medium text-gray-600 uppercase">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </div>
    );
  };

  // ✅ ERROR STATE
  if (error && !teacherCourses.length && !coursesLoading) {
    return (
      <div className="max-w-6xl p-6 mx-auto">
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="flex-shrink-0 mt-1 text-red-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Unable to Load Courses</h3>
              <p className="mt-1 text-gray-600">{error}</p>
              <button
                onClick={() => navigate('/courses')}
                className="px-4 py-2 mt-4 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Browse Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Show AddWeeklyContent when adding content
  if (showAddContent) {
    return (
      <AddWeeklyContent 
        courseId={selectedCourseId} 
        onBack={handleBackFromAddContent}
      />
    );
  }

  // ✅ TEACHER/INSTRUCTOR VIEW
  if (userType === 'teacher' || userType === 'instructor') {
    return (
      <div className="p-6 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600">Manage your courses and content</p>
        </div>

        {/* Course Selector */}
        <div className="p-6 mb-8 bg-white rounded-lg shadow-sm">
          {coursesLoading ? (
            <div className="py-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading your courses...</p>
            </div>
          ) : teacherCourses.length > 0 ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Select a Course to Manage
              </label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {teacherCourses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseChange(course.id)}
                    className={`p-4 text-left rounded-lg border-2 transition ${
                      selectedCourseId === course.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">{course.level || 'All Levels'}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <BookOpen size={40} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">No courses found. Create your first course!</p>
            </div>
          )}
        </div>

        {/* Course Content */}
        {selectedCourseId && !loading ? (
          <>
            {/* Stats */}
            {courseDetails && showStats && (
              <div className="mb-8">
                <StatsSection course={courseDetails} />
              </div>
            )}

            {/* Modules */}
            <div className="space-y-4">
              {modules.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Course Modules</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowStats(!showStats)}
                        className="p-2 transition rounded-lg hover:bg-gray-100"
                        title="Toggle Stats"
                      >
                        {showStats ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                      <button
                        onClick={() => setShowAddContent(true)}
                        className="flex items-center gap-2 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        <Plus size={18} />
                        Add Content
                      </button>
                    </div>
                  </div>
                  {modules.map((module, index) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      index={index}
                      isExpanded={expandedModules[module.id]}
                      onToggle={() => toggleModule(module.id)}
                    />
                  ))}
                </>
              ) : (
                <div className="p-12 text-center bg-white rounded-lg shadow-sm">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">No modules yet</h3>
                  <p className="mb-6 text-gray-600">Create modules in your course to get started</p>
                  <button
                    onClick={() => setShowAddContent(true)}
                    className="inline-flex items-center gap-2 px-6 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={18} />
                    Add Content
                  </button>
                </div>
              )}
            </div>
          </>
        ) : selectedCourseId && loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading course content...</p>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // ✅ STUDENT VIEW
  if (userType === 'student') {
    return (
      <div className="p-6 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">My Learning</h1>
          <p className="text-gray-600">Continue your learning journey</p>
        </div>

        {/* Course Selector */}
        <div className="p-6 mb-8 bg-white rounded-lg shadow-sm">
          {coursesLoading ? (
            <div className="py-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading your enrolled courses...</p>
            </div>
          ) : teacherCourses.length > 0 ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Your Enrolled Courses
              </label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {teacherCourses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseChange(course.course_id)}
                    className={`p-4 text-left rounded-lg border-2 transition relative ${
                      selectedCourseId === course.course_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    {course.is_expired && (
                      <span className="absolute px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded top-2 right-2">
                        Expired
                      </span>
                    )}
                    <h3 className="pr-12 font-semibold text-gray-900">{course.title}</h3>
                    <p className="mt-2 text-xs text-gray-500">{course.teacher_name}</p>
                    {!course.is_expired && course.days_remaining <= 7 && (
                      <p className="mt-2 text-xs font-semibold text-orange-600">
                        ⏰ {course.days_remaining} days left
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <BookOpen size={40} className="mx-auto mb-3 text-gray-400" />
              <p className="mb-4 text-gray-600">You haven't enrolled in any courses yet</p>
              <button
                onClick={() => navigate('/courses')}
                className="inline-flex items-center gap-2 px-6 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Browse Courses
              </button>
            </div>
          )}
        </div>

        {/* Course Content */}
        {selectedCourseId && !loading ? (
          <>
            {/* Stats */}
            {courseDetails && showStats && (
              <div className="mb-8">
                <StatsSection course={courseDetails} />
              </div>
            )}

            {/* Modules */}
            <div className="space-y-4">
              {modules.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>
                    <button
                      onClick={() => setShowStats(!showStats)}
                      className="p-2 transition rounded-lg hover:bg-gray-100"
                      title="Toggle Stats"
                    >
                      {showStats ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                  {modules.map((module, index) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      index={index}
                      isExpanded={expandedModules[module.id]}
                      onToggle={() => toggleModule(module.id)}
                    />
                  ))}
                </>
              ) : (
                <div className="p-12 text-center bg-white rounded-lg shadow-sm">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">No content available</h3>
                  <p className="text-gray-600">This course doesn't have any modules yet</p>
                </div>
              )}
            </div>
          </>
        ) : selectedCourseId && loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading course content...</p>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-600">Loading...</p>
    </div>
  );
};

export default Module;