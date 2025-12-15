import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Play,
  FileText,
  MessageSquare,
  Download,
  ChevronRight,
  Search,
  Filter,
  Grid,
  List,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BarChart3,
  Lock,
  ArrowLeft,
  Loader,
} from 'lucide-react';

// ============================================================================
// 🔌 API CONFIGURATION
// ============================================================================

const API_BASE_URL = 'http://localhost:8000/Course';

console.log(`📡 API Base URL: ${API_BASE_URL}`);

// ============================================================================
// API SERVICE WITH CORRECT authService METHODS
// ============================================================================

const courseApiService = {
  /**
   * Get authentication headers using authService.getToken()
   */
  getAuthHeaders() {
    try {
      const token = authService.getToken();
      
      if (!token) {
        console.warn('⚠️ No token found in authService');
        throw new Error('No authentication token - Please login first');
      }

      console.log(`🔐 Token found: ${token.substring(0, 20)}...`);

      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('❌ Error getting auth headers:', error);
      throw error;
    }
  },

  /**
   * GET /Course/student/enrolled-courses/
   * Get all enrolled courses for the current student
   */
  async getEnrolledCourses(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const url = `${API_BASE_URL}/student/enrolled-courses/?${params}`;
      console.log(`📡 Fetching: ${url}`);

      const headers = this.getAuthHeaders();
      console.log(`🔐 Using auth headers with token`);

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      console.log(`📊 Response status: ${response.status}`);

      if (response.status === 401) {
        console.error('❌ 401 Unauthorized - Token invalid or expired');
        authService.logout();
        throw new Error('Unauthorized: Session expired - Please login again');
      }

      if (response.status === 404) {
        console.error('❌ 404 Not Found - Endpoint does not exist');
        throw new Error('Endpoint not found - Check API configuration');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch courses: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Raw API response:`, data);
      return data;
    } catch (error) {
      console.error('❌ Exception in getEnrolledCourses:', error);
      throw error;
    }
  },

  /**
   * GET /Course/student/enrolled-courses/<course_id>/
   */
  async getEnrolledCourseDetail(courseId) {
    try {
      const url = `${API_BASE_URL}/student/enrolled-courses/${courseId}/`;
      console.log(`📡 Fetching: ${url}`);

      const headers = this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch course detail: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Exception in getEnrolledCourseDetail:`, error);
      throw error;
    }
  },

  /**
   * GET /Course/student/enrolled-courses/<course_id>/progress/
   */
  async getCourseProgress(courseId) {
    try {
      const url = `${API_BASE_URL}/student/enrolled-courses/${courseId}/progress/`;
      console.log(`📡 Fetching: ${url}`);

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
      console.error(`❌ Exception in getCourseProgress:`, error);
      throw error;
    }
  },

  /**
   * GET /Course/student/enrolled-courses/<course_id>/lessons/
   */
  async getCourseLessons(courseId) {
    try {
      const url = `${API_BASE_URL}/student/enrolled-courses/${courseId}/lessons/`;
      console.log(`📡 Fetching: ${url}`);

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
      console.error(`❌ Exception in getCourseLessons:`, error);
      throw error;
    }
  },

  /**
   * GET /Course/student/enrolled-courses/<course_id>/modules/
   */
  async getCourseModules(courseId) {
    try {
      const url = `${API_BASE_URL}/student/enrolled-courses/${courseId}/modules/`;
      console.log(`📡 Fetching: ${url}`);

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
      console.error(`❌ Exception in getCourseModules:`, error);
      throw error;
    }
  },
};

// ============================================================================
// HELPER FUNCTION: Extract Array from Response
// ============================================================================

const extractCoursesArray = (data) => {
  console.log('🔍 Extracting courses from response...');
  
  // If it's already an array
  if (Array.isArray(data)) {
    console.log('✅ Response is a direct array');
    return data;
  }

  // If it's an object with results key (DRF paginated format)
  if (data?.results && Array.isArray(data.results)) {
    console.log('✅ Response is DRF paginated format with results key');
    return data.results;
  }

  // If it's an object with data key
  if (data?.data && Array.isArray(data.data)) {
    console.log('✅ Response has data key with array');
    return data.data;
  }

  console.warn('⚠️ Could not extract array from response. Raw response:', data);
  return [];
};

// ============================================================================
// MAIN COMPONENT: StudentCourseView
// ============================================================================

const StudentCourseView = () => {
  const navigate = useNavigate();
  
  // State management
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Fetch enrolled courses
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await courseApiService.getEnrolledCourses({
          status: statusFilter,
          search: searchQuery,
        });

        const coursesArray = extractCoursesArray(response);
        
        if (!Array.isArray(coursesArray)) {
          throw new Error('Failed to process courses data - response is not an array');
        }
        
        setEnrolledCourses(coursesArray);
        console.log(`✅ Loaded ${coursesArray.length} courses`);
      } catch (err) {
        console.error('❌ Error fetching courses:', err);
        setError(err.message || 'Failed to load courses. Please try again later.');
        
        if (err.message.includes('Session expired')) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchCourses, 300);
    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchQuery, navigate]);

  // Filter and search
  useEffect(() => {
    console.log('🔄 Filtering courses...');
    
    if (!Array.isArray(enrolledCourses)) {
      console.warn('⚠️ enrolledCourses is not an array');
      setFilteredCourses([]);
      return;
    }

    let filtered = enrolledCourses;

    if (searchQuery) {
      filtered = filtered.filter(course => {
        const courseTitle = course?.course?.title || course?.title || 'Untitled';
        return courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
      });
      console.log(`🔍 After search: ${filtered.length} courses`);
    }

    setFilteredCourses(filtered);
  }, [enrolledCourses, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="flex-shrink-0 w-6 h-6 mt-1 text-red-600" />
              <div>
                <h3 className="mb-2 font-semibold text-red-900">Error Loading Courses</h3>
                <p className="text-red-700">{error}</p>
                <p className="mt-2 text-sm text-red-600">
                  API endpoint: {API_BASE_URL}/student/enrolled-courses/
                </p>
                <details className="p-3 mt-4 bg-white border border-red-200 rounded">
                  <summary className="font-semibold text-red-800 cursor-pointer">
                    🔍 Debugging Info
                  </summary>
                  <div className="mt-3 space-y-2 text-xs text-red-700">
                    <p>✓ Check browser console (F12) for detailed response structure</p>
                    <p>✓ Is authenticated: {authService.isAuthenticated() ? '✅ Yes' : '❌ No'}</p>
                    <p>✓ Has token: {authService.getToken() ? '✅ Yes' : '❌ No'}</p>
                    <p>✓ Try logging in again if needed</p>
                    <p>✓ Verify Django is running: python manage.py runserver</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safety check
  if (!Array.isArray(filteredCourses)) {
    console.error('❌ Critical: filteredCourses is not an array!', filteredCourses);
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="flex-shrink-0 w-6 h-6 mt-1 text-red-600" />
              <div>
                <h3 className="mb-2 font-semibold text-red-900">Data Processing Error</h3>
                <p className="text-red-700">Failed to process courses data. Please check console for details.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render - Course list view
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <BookOpen className="w-8 h-8" />
            My Courses
          </h1>
          <p className="mt-2 text-gray-600">View and manage your enrolled courses</p>
        </div>

        {/* Search and Filter */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Courses Grid/List */}
        {filteredCourses.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">No enrolled courses yet</p>
            <p className="mt-2 text-sm text-gray-400">Start exploring courses to begin learning</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredCourses.map((enrollment) => {
              // Handle different data structures
              const courseData = enrollment?.course || enrollment;
              const courseTitle = courseData?.course_title || courseData?.title || courseData?.course?.title || 'Untitled Course';     

              const courseImage = courseData?.course_image;
              const teacherName = courseData?.teacher_name || courseData?.teacher?.name || 'N/A';
              const hasAccess = enrollment?.has_access !== false;
              
              // ✅ FIX 1: Extract COURSE ID, not enrollment ID
              const courseId = enrollment?.course_id || courseData?.id;
              
              // Debug logging
              console.log(`Course: ${courseTitle}, ID: ${courseId}, enrollment.id: ${enrollment?.id}`);

              return (
                <div
                  key={courseId}
                  // ✅ FIX 2: Use correct route path /student/courses/:courseId
                  onClick={() => navigate(`/student/courses/${courseId}`, { state: { enrollment } })}
                  className="overflow-hidden transition bg-white rounded-lg shadow cursor-pointer hover:shadow-lg"
                >
                  {/* Course Image */}
                  {courseImage && (
                    <img
                      src={courseImage}
                      alt={courseTitle}
                      className="object-cover w-full h-48"
                    />
                  )}

                  {/* Course Info */}
                  <div className="p-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      {courseTitle}
                    </h3>

                    {/* Teacher Info */}
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{teacherName}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1 text-xs text-gray-600">
                        <span>Progress</span>
                        <span>0%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-blue-600 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>

                    {/* Status & Access */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        hasAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasAccess ? 'Active' : 'Expired'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourseView;