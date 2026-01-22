import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ Import the new service
import { courseService } from '@/config/course.config'; 
import {
  BookOpen,
  Users,
  ChevronRight,
  Search,
  Grid,
  List,
  AlertCircle,
  Loader,
} from 'lucide-react';

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
        // ✅ Use the service instead of local fetch
        // The service now handles the extraction logic (extractCoursesArray) internally
        const coursesData = await courseService.getEnrolledCourses({
          status: statusFilter,
          search: searchQuery,
        });
        
        setEnrolledCourses(coursesData);
        
      } catch (err) {
        console.error('❌ Error fetching courses:', err);
        // Clean error message handling
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to load courses.';
        setError(errorMessage);
        
        // Handle 401 specifically if needed, though your api interceptor usually handles this
        if (err.response?.status === 401) {
             navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchCourses, 300);
    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchQuery, navigate]);

  // Filter and search (Client-side refinement)
  useEffect(() => {
    if (!Array.isArray(enrolledCourses)) {
      setFilteredCourses([]);
      return;
    }

    let filtered = enrolledCourses;

    if (searchQuery) {
      filtered = filtered.filter(course => {
        // Handle nested course objects safely
        const courseTitle = course?.course?.title || course?.title || 'Untitled';
        return courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredCourses(filtered);
  }, [enrolledCourses, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto mb-4 text-orange-600 animate-spin" />
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
        <div className="flex flex-col gap-4 p-6 mb-6 text-white rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white uppercase">
            <BookOpen className="w-8 h-8" />
            My Courses
          </h1>
          
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
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-600'}`}
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
              // Handle data structure variations safely
              const courseData = enrollment?.course || enrollment;
              const courseTitle = courseData?.course_title || courseData?.title || courseData?.course?.title || 'Untitled Course';     
              const courseImage = courseData?.course_image;
              const teacherName = courseData?.teacher_name || courseData?.teacher?.name || 'N/A';
              const hasAccess = enrollment?.has_access !== false;
              
              // Key Identifier
              const courseId = enrollment?.course_id || courseData?.id;
              
              return (
                <div
                  key={courseId}
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

                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{teacherName}</span>
                    </div>

                    <div className="mb-3">
                      
                    </div>

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