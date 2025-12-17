import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Video, FileText, ClipboardList, BookOpen, PlayCircle } from 'lucide-react';
import axios from 'axios';

function StudentCourseView({ courseSlug, isModal = false }) {
  const { slug } = useParams();
  const actualSlug = courseSlug || slug;
  
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [expandedModules, setExpandedModules] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseContent();
  }, [actualSlug]);

  const fetchCourseContent = async () => {
    try {
      // Fetch course details
      const courseResponse = await axios.get(`http://localhost:8000/api/courses/${actualSlug}/`);
      const courseData = courseResponse.data;
      setCourse(courseData);

      // Fetch modules for this course
      if (courseData.course_id) {
        const modulesResponse = await axios.get(
          `http://localhost:8000/api/modules/?course_id=${courseData.course_id}`
        );
        const modulesData = Array.isArray(modulesResponse.data) ? modulesResponse.data : modulesResponse.data.results || [];
        setModules(modulesData);
        
        // Expand first module by default
        if (modulesData.length > 0) {
          setExpandedModules([modulesData[0].id || modulesData[0].module_id]);
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getContentIcon = (contentType) => {
    switch (contentType?.toLowerCase()) {
      case 'video':
        return <Video size={18} className="text-blue-600" />;
      case 'document':
        return <FileText size={18} className="text-green-600" />;
      case 'quiz':
        return <ClipboardList size={18} className="text-orange-600" />;
      case 'assignment':
        return <BookOpen size={18} className="text-purple-600" />;
      default:
        return <FileText size={18} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="font-semibold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${isModal ? 'bg-white' : 'min-h-screen bg-gray-50'}`}>
      {/* Sidebar */}
      <div className="p-4 overflow-y-auto border-r border-gray-200 w-80 bg-gray-50">
        <h2 className="mb-4 text-lg font-bold text-gray-900">{course?.title}</h2>
        
        {/* Course Introduction */}
        <button
          onClick={() => setSelectedLesson(null)}
          className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition ${
            !selectedLesson
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          📚 Course Introduction
        </button>

        {/* Modules */}
        <div className="space-y-2">
          {modules.map((module, index) => {
            const moduleId = module.id || module.module_id;
            const isExpanded = expandedModules.includes(moduleId);
            const lessons = module.lessons || module.module_lessons || [];

            return (
              <div key={moduleId} className="overflow-hidden border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleModule(moduleId)}
                  className="flex items-center justify-between w-full px-4 py-3 transition bg-gray-100 hover:bg-gray-200"
                >
                  <span className="text-sm font-medium text-gray-900">
                    Week {String(index + 1).padStart(2, '0')} - {module.title}
                  </span>
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-gray-600" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-600" />
                  )}
                </button>

                {isExpanded && (
                  <div className="bg-white divide-y">
                    {lessons.length > 0 ? (
                      lessons.map((lesson) => {
                        const lessonId = lesson.id || lesson.lesson_id;
                        return (
                          <button
                            key={lessonId}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${
                              selectedLesson?.id === lessonId || selectedLesson?.lesson_id === lessonId
                                ? 'bg-blue-50 border-l-4 border-blue-600'
                                : ''
                            }`}
                          >
                            {getContentIcon(lesson.content_type)}
                            <span className="flex-1 text-sm text-gray-700">{lesson.title}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm italic text-gray-500">
                        No content available
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {!selectedLesson ? (
          <div className="max-w-4xl">
            {/* Welcome Section */}
            <div className="p-8 mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <h1 className="mb-4 text-3xl font-bold text-gray-900">
                Welcome to {course?.title}
              </h1>
              
              {course?.teacher && (
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-semibold">Instructor:</span>{' '}
                    <span className="text-red-600">{course.teacher.full_name || course.teacher.username}</span>
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span>{' '}
                    <a href={`mailto:${course.teacher.email}`} className="text-blue-600 hover:underline">
                      {course.teacher.email}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Course Description */}
            {course?.description && (
              <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Course Overview</h2>
                <p className="leading-relaxed text-gray-700">{course.description}</p>
              </div>
            )}

            {/* Intro Video */}
            {course?.intro_video && (
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Course Introduction Video</h2>
                <div className="overflow-hidden bg-black rounded-lg aspect-video">
                  <iframe
                    src={course.intro_video}
                    className="w-full h-full"
                    allowFullScreen
                    title="Course Introduction"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl">
            {/* Lesson Header */}
            <div className="p-6 mb-6 text-white rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center gap-3 mb-2">
                {getContentIcon(selectedLesson.content_type)}
                <span className="text-sm font-medium">
                  {selectedLesson.content_type?.charAt(0).toUpperCase()}
                  {selectedLesson.content_type?.slice(1)}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{selectedLesson.title}</h2>
            </div>

            {/* Lesson Content */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              {selectedLesson.content_type?.toLowerCase() === 'video' && (
                <div className="mb-6 overflow-hidden bg-black rounded-lg aspect-video">
                  {selectedLesson.content_url_or_text?.includes('youtube') ||
                   selectedLesson.content_url_or_text?.includes('youtu.be') ? (
                    <iframe
                      src={selectedLesson.content_url_or_text?.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allowFullScreen
                      title={selectedLesson.title}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PlayCircle size={64} className="text-gray-400" />
                    </div>
                  )}
                </div>
              )}

              {selectedLesson.content_type?.toLowerCase() === 'document' && (
                <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                  <FileText size={48} className="mb-4 text-green-600" />
                  <p className="mb-4 text-gray-700">{selectedLesson.content_url_or_text}</p>
                  <a
                    href={selectedLesson.content_url_or_text}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-2 text-white transition bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Download Document
                  </a>
                </div>
              )}

              {selectedLesson.content_type?.toLowerCase() === 'quiz' && (
                <div className="p-6 border border-yellow-200 rounded-lg bg-yellow-50">
                  <ClipboardList size={48} className="mb-4 text-yellow-600" />
                  <p className="mb-4 text-gray-700">{selectedLesson.content_url_or_text}</p>
                  <button className="px-6 py-2 text-white transition bg-yellow-600 rounded-lg hover:bg-yellow-700">
                    Start Quiz
                  </button>
                </div>
              )}

              {selectedLesson.content_type?.toLowerCase() === 'assignment' && (
                <div className="p-6 border border-blue-200 rounded-lg bg-blue-50">
                  <BookOpen size={48} className="mb-4 text-blue-600" />
                  <p className="mb-4 text-gray-700">{selectedLesson.content_url_or_text}</p>
                  <button className="px-6 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700">
                    View Assignment
                  </button>
                </div>
              )}

              {!selectedLesson.content_type && (
                <div className="p-6 rounded-lg bg-gray-50">
                  <p className="text-gray-600">{selectedLesson.content_url_or_text}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentCourseView;