import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  useEffect(() => {
    console.log('Fetching courses...');
    
    // Get authentication token from localStorage, sessionStorage, or context
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    const fetchCourses = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/lms/courses/view/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication header if token exists
            ...(token && { 'Authorization': `Bearer ${token}` }),
            // Alternative for Django Token Auth: 'Authorization': `Token ${token}`
          },
          credentials: 'include', // Include cookies for session-based auth
        });
  
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          // Handle different error statuses
          if (response.status === 401) {
            throw new Error('Unauthorized - Please login again');
          } else if (response.status === 403) {
            throw new Error('Access forbidden - Insufficient permissions');
          } else if (response.status === 404) {
            throw new Error('Endpoint not found');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
  
        const data = await response.json();
        console.log('Fetched courses:', data);
        
        // Handle different response formats
        if (data.results) {
          // If using pagination (DRF pagination)
          setCourses(Array.isArray(data.results) ? data.results : []);
        } else if (Array.isArray(data)) {
          setCourses(data);
        } else if (data.courses && Array.isArray(data.courses)) {
          setCourses(data.courses);
        } else {
          setCourses([]);
        }
        
        setLoading(false);
        setError(null); // Clear any previous errors
        
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError(error.message);
        setLoading(false);
        
        // Handle authentication errors
        if (error.message.includes('Unauthorized')) {
          // Redirect to login or clear invalid token
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          // Optionally redirect to login page
          // window.location.href = '/login';
        }
      }
    };
  
    fetchCourses();
  }, []);

  // Handle responsive cards per view
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCardsPerView(1);
      } else if (width < 1200) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
      setCurrentIndex(0); // Reset to start when viewport changes
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex(prev => {
      const maxIndex = Math.max(0, courses.length - cardsPerView);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex(prev => {
      const maxIndex = Math.max(0, courses.length - cardsPerView);
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    if (cleanPath.startsWith('media/')) {
      cleanPath = cleanPath.substring(6);
    }
    const fullUrl = `http://127.0.0.1:8000/media/${cleanPath}`;
    console.log('Image URL:', fullUrl);
    return fullUrl;
  };

  const handleImageError = (e) => {
    console.log('Image failed to load:', e.target.src);
    e.target.style.display = 'none';
  };

  return (
    <div className="max-w-5xl mx-auto my-5 p-5 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-slate-800 text-center mb-10 text-4xl font-bold drop-shadow-sm">
        Available Courses
      </h1>
      
      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {error && (
        <p className="text-red-600 text-center text-lg py-15 px-5 bg-red-50 rounded-xl shadow-md">
          Error loading courses: {error}
        </p>
      )}
      
      {!loading && !error && courses.length > 0 && (
        <div className="relative overflow-hidden mx-15">
          <button 
            className={`absolute top-1/2 -translate-y-1/2 -left-8 bg-white border-2 border-gray-200 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 z-10 text-slate-800 hover:bg-blue-500 hover:text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${courses.length <= cardsPerView ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={prevSlide}
            disabled={courses.length <= cardsPerView}
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex transition-transform duration-300 ease-in-out gap-6 px-5">
            <div 
              className="flex gap-6 transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
                width: `${(courses.length / cardsPerView) * 100}%`
              }}
            >
              {courses.map(course => (
                <div 
                  key={course.id} 
                  className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 border border-gray-200 flex flex-col min-h-96 w-80 flex-shrink-0 cursor-pointer hover:-translate-y-1 hover:shadow-xl group"
                >
                  <div className="w-full h-48 relative overflow-hidden">
                    {course.image ? (
                      <>
                        <img
                          src={getImageUrl(course.image)}
                          alt={`${course.title || 'Course'} image`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={handleImageError}
                          onLoad={() => console.log('Image loaded successfully:', course.image)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <span className="text-white text-sm font-bold">
                            View Course
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {(course.title || 'Course').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-slate-800 mb-4 text-xl font-bold leading-tight">
                        {course.title || 'Untitled Course'}
                      </h3>
                      <p className="text-gray-600 mb-5 leading-relaxed text-sm line-clamp-3">
                        {course.description || 'No description available'}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Level</span>
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {course.level || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Price</span>
                        <span className="text-red-600 text-lg font-bold">
                          Rs. {course.price || '0'}
                        </span>                      
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Instructor</span>
                        <span className="text-slate-800 text-sm font-medium">
                          {course.instructor || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className={`absolute top-1/2 -translate-y-1/2 -right-8 bg-white border-2 border-gray-200 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 z-10 text-slate-800 hover:bg-blue-500 hover:text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${courses.length <= cardsPerView ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={nextSlide}
            disabled={courses.length <= cardsPerView}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
      
      {!loading && !error && courses.length === 0 && (
        <p className="text-gray-500 text-center text-lg py-15 px-5 bg-white rounded-xl shadow-md">
          No courses available at the moment.
        </p>
      )}
    </div>
  );
};

export default CourseList;