import React, { useState, useEffect } from 'react';
import { Plus, X, Video, FileText, Save, Trash2, GripVertical, Upload, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { API_COURSE_ENDPOINTS } from '@/config/courseapi';
import authService from '@/context/authService';


const AddWeeklyContent = ({ courseId, onBack }) => {
  const [modules, setModules] = useState([
    {
      id: 1,
      title: '',
      order: 1,
      lessons: []
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch course details on mount
  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    if (!courseId) return; //
    try {
      const response = await authService.api.get(`/Course/courses/teacher/${courseId}/`);
        
        setCourseDetails(res.data);
      } catch (err) {
        console.error(err);
      }
    };

  // Add new module (week)
  const addModule = () => {
    const newModule = {
      id: Date.now(),
      title: '',
      order: modules.length + 1,
      lessons: []
    };
    setModules([...modules, newModule]);
  };

  // Remove module
  const removeModule = (moduleId) => {
    if (modules.length > 1) {
      setModules(modules.filter(m => m.id !== moduleId));
    }
  };

  // Update module title
  const updateModuleTitle = (moduleId, title) => {
    setModules(modules.map(m => 
      m.id === moduleId ? { ...m, title } : m
    ));
  };

  // Add lesson to module
  const addLesson = (moduleId, contentType) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        const newLesson = {
          id: Date.now(),
          title: '',
          content_type: contentType,
          order: m.lessons.length + 1,
          content_url_or_text: '',
          duration_minutes: '',
          file: null,
          uploadType: 'url' // 'url' or 'file'
        };
        return { ...m, lessons: [...m.lessons, newLesson] };
      }
      return m;
    }));
  };

  // Remove lesson
  const removeLesson = (moduleId, lessonId) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
      }
      return m;
    }));
  };

  // Update lesson
  const updateLesson = (moduleId, lessonId, field, value) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => 
            l.id === lessonId ? { ...l, [field]: value } : l
          )
        };
      }
      return m;
    }));
  };

  // Handle file upload for lesson
  const handleFileUpload = (moduleId, lessonId, file) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => 
            l.id === lessonId ? { ...l, file: file } : l
          )
        };
      }
      return m;
    }));
  };

  // Validate form
  const validateForm = () => {
    for (const module of modules) {
      if (!module.title.trim()) {
        setErrorMessage('All modules must have a title');
        return false;
      }
      if (module.lessons.length === 0) {
        setErrorMessage('Each module must have at least one lesson');
        return false;
      }
      for (const lesson of module.lessons) {
        if (!lesson.title.trim()) {
          setErrorMessage('All lessons must have a title');
          return false;
        }
        if (!lesson.content_url_or_text && !lesson.file) {
          setErrorMessage('Each lesson must have content (URL or file)');
          return false;
        }
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Process each module
      for (const module of modules) {
        // Create module first
        const moduleData = {
          course: courseId,
          title: module.title,
          order: module.order
        };

        const moduleResponse = await fetch(API_COURSE_ENDPOINTS.CREATE_MODULE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(moduleData)
        });

        if (!moduleResponse.ok) {
          throw new Error('Failed to create module');
        }

        const createdModule = await moduleResponse.json();

        // Create lessons for this module
        for (const lesson of module.lessons) {
          const formData = new FormData();
          formData.append('module', createdModule.module_id || createdModule.id);
          formData.append('title', lesson.title);
          formData.append('content_type', lesson.content_type);
          formData.append('order', lesson.order);
          
          if (lesson.duration_minutes) {
            formData.append('duration_minutes', lesson.duration_minutes);
          }

          // Handle file upload or URL
          if (lesson.uploadType === 'file' && lesson.file) {
            // Upload file first
            const fileFormData = new FormData();
            fileFormData.append('file', lesson.file);

            const fileResponse = await fetch('/Course/path/upload/', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: fileFormData
            });

            if (fileResponse.ok) {
              const fileData = await fileResponse.json();
              formData.append('content_url_or_text', fileData.file_url || fileData.url);
            } else {
              throw new Error('Failed to upload file');
            }
          } else if (lesson.uploadType === 'url') {
            formData.append('content_url_or_text', lesson.content_url_or_text);
          }

          // Create lesson
          const lessonResponse = await fetch('/Course/lessons/create/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });

          if (!lessonResponse.ok) {
            throw new Error('Failed to create lesson');
          }
        }
      }

      setSuccessMessage('✓ Course content saved successfully!');
      
      // Reset form after successful submission
      setTimeout(() => {
        setModules([
          {
            id: 1,
            title: '',
            order: 1,
            lessons: []
          }
        ]);
        if (onBack) {
          onBack();
        }
      }, 2000);

    } catch (error) {
      console.error('Error saving content:', error);
      setErrorMessage('Failed to save content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 transition-colors bg-white rounded-lg shadow-sm hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          )}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Add Course Content</h1>
            <p className="mt-2 text-gray-600">{courseDetails?.title || 'Build your course curriculum'}</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 mb-6 text-green-700 bg-green-100 border border-green-400 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-400 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Main Form */}
        <div className="overflow-hidden bg-white shadow-lg rounded-xl">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Info Box */}
            <div className="p-4 mb-8 border-l-4 border-blue-600 rounded-lg bg-blue-50">
              <h3 className="mb-2 font-semibold text-blue-900">💡 Tips for great course content:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Create modules for each week or topic of your course</li>
                <li>• Add videos, documents, or assignments to each module</li>
                <li>• Include video duration and document descriptions</li>
                <li>• Organize content in a logical, easy-to-follow order</li>
              </ul>
            </div>

            {/* Modules Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Course Modules</h2>
                <button
                  type="button"
                  onClick={addModule}
                  className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <Plus size={18} />
                  Add Module
                </button>
              </div>

              <div className="space-y-6">
                {modules.map((module, moduleIndex) => (
                  <div key={module.id} className="p-6 transition-colors border-2 border-gray-200 bg-gray-50 rounded-xl hover:border-blue-400">
                    {/* Module Title */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center justify-center text-3xl font-bold text-blue-600 bg-blue-100 rounded-lg w-14 h-14">
                        {String(moduleIndex + 1).padStart(2, '0')}
                      </div>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                        placeholder={`Week ${moduleIndex + 1} - Enter module title (e.g., "Week 1: Introduction")`}
                        required
                        className="flex-1 px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      {modules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeModule(module.id)}
                          className="p-2 text-red-600 transition rounded-lg hover:bg-red-50"
                          title="Delete module"
                        >
                          <Trash2 size={22} />
                        </button>
                      )}
                    </div>

                    {/* Lessons in Module */}
                    <div className="pl-6 ml-2 space-y-4 border-l-2 border-gray-300">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const ContentIcon = lesson.content_type === 'video' ? Video : FileText;
                        
                        return (
                          <div key={lesson.id} className="p-5 transition-shadow bg-white border border-gray-200 rounded-lg hover:shadow-md">
                            <div className="flex items-start gap-4">
                              <div className="p-2 mt-1 bg-gray-100 rounded-lg">
                                <ContentIcon size={20} className={lesson.content_type === 'video' ? 'text-red-500' : 'text-blue-500'} />
                              </div>
                              
                              <div className="flex-1 space-y-4">
                                {/* Lesson Title and Duration */}
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                  <div className="md:col-span-2">
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                                      placeholder={`${lesson.content_type === 'video' ? 'Video' : 'Document'} title`}
                                      required
                                      className="w-full px-3 py-2 font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  
                                  <input
                                    type="number"
                                    value={lesson.duration_minutes}
                                    onChange={(e) => updateLesson(module.id, lesson.id, 'duration_minutes', e.target.value)}
                                    placeholder="Duration (minutes)"
                                    min="0"
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>

                                {/* Upload Type Toggle */}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateLesson(module.id, lesson.id, 'uploadType', 'url')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                                      lesson.uploadType === 'url'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    <LinkIcon size={16} />
                                    URL/Link
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateLesson(module.id, lesson.id, 'uploadType', 'file')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                                      lesson.uploadType === 'file'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    <Upload size={16} />
                                    Upload File
                                  </button>
                                </div>

                                {/* URL Input or File Upload */}
                                {lesson.uploadType === 'url' ? (
                                  <div>
                                    <label className="block mb-1 text-xs font-semibold text-gray-700">Content URL</label>
                                    <input
                                      type="text"
                                      value={lesson.content_url_or_text}
                                      onChange={(e) => updateLesson(module.id, lesson.id, 'content_url_or_text', e.target.value)}
                                      placeholder={
                                        lesson.content_type === 'video' 
                                          ? 'Video URL (YouTube, Vimeo, etc.) - e.g., https://youtube.com/watch?v=...' 
                                          : 'Document URL (PDF, Google Docs, etc.) - e.g., https://docs.google.com/...'
                                      }
                                      required
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-700">Upload File</label>
                                    <input
                                      type="file"
                                      accept={lesson.content_type === 'video' ? 'video/*' : '.pdf,.doc,.docx,.txt,.ppt,.pptx'}
                                      onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          handleFileUpload(module.id, lesson.id, file);
                                        }
                                      }}
                                      required
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {lesson.file && (
                                      <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                                        <p className="text-xs font-medium text-green-700">
                                          ✓ Selected: {lesson.file.name}
                                        </p>
                                        <p className="text-xs text-green-600">
                                          Size: {(lesson.file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => removeLesson(module.id, lesson.id)}
                                className="flex-shrink-0 p-2 text-red-600 transition rounded-lg hover:bg-red-50"
                                title="Delete lesson"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Lesson Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => addLesson(module.id, 'video')}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 transition border-2 border-red-600 rounded-lg hover:bg-red-50"
                        >
                          <Video size={16} />
                          Add Video
                        </button>
                        <button
                          type="button"
                          onClick={() => addLesson(module.id, 'document')}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 transition border-2 border-blue-600 rounded-lg hover:bg-blue-50"
                        >
                          <FileText size={16} />
                          Add Document
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 font-semibold text-gray-700 transition border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition rounded-lg shadow-md bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 hover:shadow-lg"
              >
                <Save size={20} />
                {loading ? 'Saving...' : 'Save Course Content'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddWeeklyContent;