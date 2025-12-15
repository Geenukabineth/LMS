import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import authService from '@/services/authService';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Star,
  Play,
  FileText,
  MessageSquare,
  Download,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BarChart3,
  Lock,
  Loader,
} from 'lucide-react';

// ============================================================================
// API CONFIGURATION & SERVICE
// ============================================================================

const API_BASE_URL = 'http://localhost:8000/Course';

console.log(`📡 API Base URL: ${API_BASE_URL}`);

const courseApiService = {
  getAuthHeaders() {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('❌ Error getting auth headers:', error);
      throw error;
    }
  },

  async getEnrolledCourseDetail(courseId) {
    try {
      const url = `${API_BASE_URL}/student/enrolled-courses/${courseId}/`;
      console.log(`📡 Fetching course detail: ${url}`);

      const headers = this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch course detail: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Course detail fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Exception in getEnrolledCourseDetail:', error);
      throw error;
    }
  },

  async getCourseModules(courseId) {
    try {
      const url = `${API_BASE_URL}/student/enrolled-courses/${courseId}/modules/`;
      console.log(`📡 Fetching modules: ${url}`);

      const headers = this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Exception in getCourseModules:', error);
      throw error;
    }
  },

  async getCourseLessons(courseId) {
    try {
      const url = `${API_BASE_URL}/student/enrolled-courses/${courseId}/lessons/`;
      console.log(`📡 Fetching lessons: ${url}`);

      const headers = this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lessons: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Exception in getCourseLessons:', error);
      throw error;
    }
  },

  async getCourseProgress(courseId) {
    try {
      const url = `${API_BASE_URL}/student/enrolled-courses/${courseId}/progress/`;
      console.log(`📡 Fetching progress: ${url}`);

      const headers = this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Exception in getCourseProgress:', error);
      throw error;
    }
  },
};

// ============================================================================
// MAIN COURSE DETAIL COMPONENT
// ============================================================================

const CourseDetailView = () => {
  const navigate = useNavigate();
  // ✅ FIX: Try multiple ways to get courseId
  const { courseId: paramCourseId, id } = useParams();
  const location = useLocation();
  
  // ✅ FIX: Extract courseId from multiple sources
  const enrollment = location.state?.enrollment;
  const enrollmentCourseId = enrollment?.id || enrollment?.course?.id;
  
  // ✅ FIX: Use first available courseId from params or enrollment
  const courseId = paramCourseId || id || enrollmentCourseId;
  
  // State management
  const [courseDetail, setCourseDetail] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModule, setExpandedModule] = useState(null);

  // ✅ FIX: Fetch course details with better error handling
  useEffect(() => {
    const fetchCourseData = async () => {
      // ✅ FIX: Debug logging
      console.log('🔍 Extracting courseId:');
      console.log('  - paramCourseId:', paramCourseId);
      console.log('  - id:', id);
      console.log('  - enrollmentCourseId:', enrollmentCourseId);
      console.log('  - final courseId:', courseId);
      console.log('  - enrollment:', enrollment);

      // ✅ FIX: Check if courseId is available
      if (!courseId) {
        console.error('❌ CRITICAL: No courseId found!');
        console.error('  - URL params:', { paramCourseId, id });
        console.error('  - Enrollment data:', enrollment);
        setError(
          'Course ID not found. Please navigate from the courses list or check the URL. ' +
          'Expected URL format: /student/courses/:courseId or /courses/:id'
        );
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`📡 Starting to fetch course data for ID: ${courseId}`);

        // Fetch course detail
        const detailResponse = await courseApiService.getEnrolledCourseDetail(courseId);
        setCourseDetail(detailResponse);
        console.log('✅ Course detail loaded');

        // Fetch modules (with error recovery)
        try {
          const modulesResponse = await courseApiService.getCourseModules(courseId);
          const modulesArray = Array.isArray(modulesResponse) 
            ? modulesResponse 
            : modulesResponse?.results || modulesResponse?.data || [];
          setModules(modulesArray);
          console.log(`✅ Modules loaded: ${modulesArray.length} modules`);
        } catch (err) {
          console.warn('⚠️ Failed to fetch modules (will continue):', err.message);
          setModules([]);
        }

        // Fetch progress (with error recovery)
        try {
          const progressResponse = await courseApiService.getCourseProgress(courseId);
          setProgress(progressResponse);
          console.log('✅ Progress loaded');
        } catch (err) {
          console.warn('⚠️ Failed to fetch progress (will continue):', err.message);
        }

        console.log('✅ All course data loaded successfully');
      } catch (err) {
        console.error('❌ Error fetching course data:', err);
        setError(err.message || 'Failed to load course details');

        if (err.message.includes('Session expired') || err.message.includes('Unauthorized')) {
          console.log('🔐 Session expired - redirecting to login');
          setTimeout(() => navigate('/login'), 1000);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if courseId is available
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, navigate]); // Only depend on courseId

  // ✅ FIX: Better error state - show debugging info
  if (!courseId) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <div className="p-6 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="flex-shrink-0 w-6 h-6 mt-1 text-yellow-600" />
              <div>
                <h3 className="mb-2 font-semibold text-yellow-900">No Course ID Found</h3>
                <p className="mb-3 text-yellow-800">
                  The course ID is missing. This usually happens when:
                </p>
                <ul className="mb-4 space-y-1 text-yellow-800 list-disc list-inside">
                  <li>You navigated directly to this URL without a course ID</li>
                  <li>The URL doesn't include the course ID parameter</li>
                  <li>The browser state was lost (refresh or direct URL access)</li>
                </ul>
                <p className="mb-4 text-yellow-800">
                  <strong>Expected URL formats:</strong>
                </p>
                <code className="block p-2 mb-4 text-sm text-yellow-900 bg-yellow-100 rounded">
                  /student/courses/:courseId
                </code>
                <button
                  onClick={() => navigate('/student/courses')}
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Go to Course List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading course details for course {courseId}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <div className="p-6 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="flex-shrink-0 w-6 h-6 mt-1 text-red-600" />
              <div>
                <h3 className="mb-2 font-semibold text-red-900">Error Loading Course</h3>
                <p className="mb-3 text-red-700">{error}</p>
                <div className="p-3 mb-4 text-sm text-red-700 bg-white border border-red-200 rounded">
                  <p className="mb-2 font-semibold">Debug Info:</p>
                  <p>Course ID: {courseId}</p>
                  <p>API Endpoint: {API_BASE_URL}/student/enrolled-courses/{courseId}/</p>
                </div>
                <button
                  onClick={() => navigate('/student/courses')}
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Return to Courses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIX: Extract data with better fallbacks
  const courseData = courseDetail?.course || courseDetail || enrollment?.course || enrollment;
  const courseTitle = courseData?.course_title || courseData?.title || courseData?.course?.title || 'Untitled Course';
  const courseDescription = courseData?.description || 'No description available';
  const courseImage = courseData?.course_image;
  const teacherName = courseData?.teacher_name || courseData?.teacher?.name || 'N/A';
  const totalLessons = courseData?.total_lessons || progress?.total_lessons || 0;
  const completedLessons = courseDetail?.lessons_completed || progress?.completed_lessons || 0;
  const courseProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const hasAccess = courseDetail?.has_access !== false;
  const enrolledDate = courseDetail?.enrolled_date || enrollment?.enrolled_date;
  const expiryDate = courseDetail?.expiry_date || enrollment?.expiry_date;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 font-medium text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{courseTitle}</h1>
          <p className="mt-2 text-gray-600">By {teacherName}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Course Image */}
            {courseImage && (
              <div className="mb-8 overflow-hidden rounded-lg shadow-md">
                <img
                  src={courseImage}
                  alt={courseTitle}
                  className="object-cover w-full h-80"
                />
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-8 px-6 pt-4 mb-6 bg-white border-b border-gray-200 rounded-t-lg">
              {['overview', 'modules', 'resources'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 bg-white border border-gray-200 rounded-b-lg shadow-sm">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">About This Course</h2>
                    <p className="leading-relaxed text-gray-700">
                      {courseDescription}
                    </p>
                  </div>

                  {/* Course Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="mb-1 text-2xl font-bold text-blue-600">
                        {totalLessons}
                      </div>
                      <div className="text-sm font-medium text-gray-700">Total Lessons</div>
                    </div>
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                      <div className="mb-1 text-2xl font-bold text-green-600">
                        {completedLessons}
                      </div>
                      <div className="text-sm font-medium text-gray-700">Completed</div>
                    </div>
                    <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                      <div className="mb-1 text-2xl font-bold text-yellow-600">
                        {courseProgress}%
                      </div>
                      <div className="text-sm font-medium text-gray-700">Progress</div>
                    </div>
                    <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                      <div className={`font-bold text-2xl mb-1 ${hasAccess ? 'text-green-600' : 'text-red-600'}`}>
                        {hasAccess ? '✓' : '✕'}
                      </div>
                      <div className="text-sm font-medium text-gray-700">Access</div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="p-6 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="flex items-center gap-2 font-bold text-gray-900">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Your Progress
                      </h3>
                      <span className="text-lg font-bold text-blue-600">{courseProgress}%</span>
                    </div>
                    <div className="w-full h-3 overflow-hidden bg-gray-300 rounded-full">
                      <div
                        className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-gray-700">
                      You've completed {completedLessons} out of {totalLessons} lessons. Keep up the great work!
                    </p>
                  </div>

                  {/* Enrollment Info */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="mb-3 font-bold text-gray-900">Enrollment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {enrolledDate && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Enrolled Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(enrolledDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {expiryDate && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Expiry Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modules Tab */}
              {activeTab === 'modules' && (
                <div className="space-y-4">
                  <h2 className="mb-6 text-2xl font-bold text-gray-900">Course Modules</h2>
                  {modules.length === 0 ? (
                    <p className="text-gray-500">No modules available yet.</p>
                  ) : (
                    modules.map((module, index) => (
                      <div
                        key={module.id || index}
                        className="overflow-hidden transition-shadow border border-gray-200 rounded-lg hover:shadow-md"
                      >
                        <button
                          onClick={() => setExpandedModule(expandedModule === index ? null : index)}
                          className="flex items-center justify-between w-full p-4 transition-colors bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex items-center flex-1 gap-3">
                            <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-blue-600 bg-blue-100 rounded-full">
                              {index + 1}
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold text-gray-900">
                                {module.title || `Module ${index + 1}`}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {module.lessons?.length || 0} lessons
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              expandedModule === index ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {expandedModule === index && (
                          <div className="p-4 space-y-3 border-t border-gray-200">
                            {module.lessons && module.lessons.length > 0 ? (
                              module.lessons.map((lesson, lessonIndex) => (
                                <div
                                  key={lesson.id || lessonIndex}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                                >
                                  {lesson.completed ? (
                                    <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-green-500" />
                                  ) : (
                                    <div className="flex-shrink-0 w-5 h-5 border-2 border-gray-300 rounded-full" />
                                  )}
                                  <span className="flex-1 text-gray-700">
                                    {lesson.title || `Lesson ${lessonIndex + 1}`}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">No lessons in this module yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <h2 className="mb-6 text-2xl font-bold text-gray-900">Course Resources</h2>
                  <div className="grid gap-4">
                    <ResourceCard
                      title="Course Syllabus"
                      icon={FileText}
                      type="PDF"
                      description="Complete course outline and schedule"
                    />
                    <ResourceCard
                      title="Code Examples Repository"
                      icon={Download}
                      type="ZIP"
                      description="All code examples and projects"
                    />
                    <ResourceCard
                      title="Discussion Forum"
                      icon={MessageSquare}
                      type="Community"
                      description="Connect with other students"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Access Status Card */}
            <div className={`p-6 rounded-lg border-2 ${
              hasAccess 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {hasAccess ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <Lock className="w-6 h-6 text-red-600" />
                )}
                <h3 className={`font-bold ${hasAccess ? 'text-green-900' : 'text-red-900'}`}>
                  {hasAccess ? 'Active Access' : 'Expired Access'}
                </h3>
              </div>
              <p className={`text-sm ${hasAccess ? 'text-green-800' : 'text-red-800'}`}>
                {hasAccess 
                  ? 'You have full access to this course.' 
                  : 'Your access to this course has expired. Please renew to continue learning.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="mb-4 font-bold text-gray-900">Quick Actions</h3>
              <div className="space-y-3">
                <button className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  hasAccess
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
                disabled={!hasAccess}
                >
                  <Play className="w-5 h-5" />
                  Continue Learning
                </button>
                <button className="w-full py-3 font-semibold text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                  Download Certificate
                </button>
              </div>
            </div>

            {/* Course Info Card */}
            <div className="p-6 space-y-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-900">Course Information</h3>

              <div className="space-y-3">
                <InfoItem label="Instructor" value={teacherName} />
                <InfoItem label="Total Lessons" value={totalLessons.toString()} />
                <InfoItem label="Completed" value={completedLessons.toString()} />
                <InfoItem label="Progress" value={`${courseProgress}%`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const ResourceCard = ({ title, icon: Icon, type, description }) => (
  <div className="flex items-start justify-between gap-4 p-4 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50">
    <div className="flex items-start flex-1 gap-4">
      <div className="p-3 bg-blue-100 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{type} • {description}</p>
      </div>
    </div>
    <button className="px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap">
      Access
    </button>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div className="pb-3 border-b border-gray-200 last:border-b-0">
    <p className="text-xs font-semibold text-gray-600 uppercase">{label}</p>
    <p className="font-medium text-gray-900">{value}</p>
  </div>
);

export default CourseDetailView;