import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { courseService } from '@/config/course.config'; // ✅ Use Service
import {
  ArrowLeft,
  Play,
  FileText,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Loader,
  Video,
  File,
  Menu
} from 'lucide-react';

const CourseDetailView = () => {
  const navigate = useNavigate();
  const { courseId: paramCourseId, id } = useParams();
  const location = useLocation();
  
  // Resolve courseId from various sources
  const enrollment = location.state?.enrollment;
  const courseId = paramCourseId || id || enrollment?.id || enrollment?.course?.id;

  // State
  const [courseDetail, setCourseDetail] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // UI State
  const [expandedModules, setExpandedModules] = useState({}); 
  const [currentLesson, setCurrentLesson] = useState(null); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setError("Course ID missing.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // ✅ Use courseService instead of direct fetch
        const [detailData, modulesData, progressData] = await Promise.all([
          courseService.getStudentCourseDetail(courseId),
          courseService.getStudentCourseModules(courseId).catch(() => []),
          courseService.getStudentCourseProgress(courseId).catch(() => null)
        ]);

        setCourseDetail(detailData);
        
        // Normalize Modules Data
        const mods = Array.isArray(modulesData) ? modulesData : (modulesData.results || []);
        setModules(mods);

        // Set Progress
        if (progressData) {
            setProgress(progressData.progress_percentage || 0);
        }

        // Auto-select first lesson if available and none selected
        if (mods.length > 0 && mods[0].lessons?.length > 0) {
           setCurrentLesson(mods[0].lessons[0]);
           setExpandedModules({ [mods[0].id || 0]: true }); // Open first module
        }
      } catch (err) {
        console.error("Failed to load course data:", err);
        setError("Failed to load course content. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleLessonSelect = (lesson) => {
    if (!lesson) return;
    setCurrentLesson(lesson);
    setMobileMenuOpen(false); // Close mobile menu on selection
  };

  const handleStartAssessment = () => {
    if (!currentLesson?.id) {
        alert("Error: Lesson ID not found");
        return;
    }

    const type = currentLesson.content_type?.toLowerCase();
    
    // Navigate to specific assessment routes
    if (type === "quiz") {
      navigate(`/student/course/${courseId}/quiz/${currentLesson.id}`);
    } else if (type === "assignment") {
      navigate(`/student/course/${courseId}/assignment/${currentLesson.id}`);
    }
  };

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-gray-900"><Loader className="w-10 h-10 text-blue-500 animate-spin" /></div>;
  if (error) return <div className="p-8 text-center text-red-600 bg-gray-50">Error: {error}</div>;

  const courseData = courseDetail?.course || courseDetail || {};
  const courseTitle = courseData.title || "Untitled Course";
  
  return (
    <div className="flex flex-col h-screen bg-white">
      
      {/* 1. TOP NAVBAR (Dark Theme) */}
      <div className="flex items-center justify-between h-16 px-4 bg-gray-900 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-gray-700 hidden sm:block"></div>
          <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md md:text-lg">
            {courseTitle}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Progress Bar */}
           <div className="items-center hidden gap-3 md:flex">
             <div className="flex flex-col items-end">
               <span className="text-xs text-gray-400">Your Progress</span>
               <span className="text-xs font-bold text-green-400">{Math.round(progress)}% Completed</span> 
             </div>
             <div className="w-32 h-2 bg-gray-700 rounded-full">
               <div 
                 className="h-full transition-all duration-500 bg-green-500 rounded-full" 
                 style={{ width: `${progress}%` }}
               ></div>
             </div>
           </div>
           
           {/* Mobile Menu Toggle */}
           <button 
             className="text-gray-300 md:hidden"
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
           >
             <Menu />
           </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDE: Player / Content */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
           
           {/* PLAYER WINDOW (Black Background) */}
           <div className="relative flex items-center justify-center w-full bg-black shadow-lg aspect-video">
              {currentLesson ? (
                <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center text-white">
                   
                   {/* CONTENT TYPE: VIDEO */}
                   {currentLesson.content_type === 'video' && (
                     <>
                        <Play className="w-20 h-20 mb-6 text-blue-500 opacity-90" />
                        <h2 className="mb-2 text-2xl font-bold">{currentLesson.title}</h2>
                        <p className="text-gray-400">Video Player Placeholder</p>
                     </>
                   )}

                   {/* CONTENT TYPE: ASSIGNMENT */}
                   {currentLesson.content_type === 'assignment' && (
                     <>
                        <FileText className="w-16 h-16 mb-6 text-orange-500" />
                        <h2 className="mb-2 text-2xl font-bold">{currentLesson.title}</h2>
                        <p className="mb-6 text-gray-400">Assignment Task</p>
                        <button 
                          onClick={handleStartAssessment}
                          className="px-6 py-3 font-bold transition-transform transform bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105"
                        >
                          View Assignment Details
                        </button>
                     </>
                   )}

                    {/* CONTENT TYPE: QUIZ */}
                    {currentLesson.content_type === 'quiz' && (
                     <>
                        <HelpCircle className="w-16 h-16 mb-6 text-purple-500" />
                        <h2 className="mb-2 text-2xl font-bold">{currentLesson.title}</h2>
                        <p className="mb-6 text-gray-400">Timed Quiz Assessment</p>
                        <button 
                          onClick={handleStartAssessment}
                          className="px-6 py-3 font-bold transition-transform transform bg-purple-600 rounded-lg hover:bg-purple-700 hover:scale-105"
                        >
                          Start Quiz Attempt
                        </button>
                     </>
                   )}

                   {/* CONTENT TYPE: DOCUMENT */}
                   {currentLesson.content_type === 'document' && (
                     <>
                        <File className="w-16 h-16 mb-6 text-green-500" />
                        <h2 className="mb-2 text-2xl font-bold">{currentLesson.title}</h2>
                        <p className="mb-6 text-gray-400">Reading Material</p>
                        {currentLesson.document || currentLesson.content_url_or_text ? (
                            <a 
                                href={currentLesson.document || currentLesson.content_url_or_text} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-6 py-3 font-bold bg-green-600 rounded-lg hover:bg-green-700"
                            >
                                Download / Open Document
                            </a>
                        ) : (
                            <p className="text-red-400">No document attached.</p>
                        )}
                     </>
                   )}

                </div>
              ) : (
                <div className="text-gray-500">Select a lesson from the sidebar</div>
              )}
           </div>

           {/* DETAILS TABS (Below Player) */}
           <div className="max-w-4xl px-4 py-8 mx-auto md:px-8">
              <div className="flex gap-1 p-1 mb-6 border border-gray-200 rounded-lg bg-gray-50 w-fit">
                 {['overview', 'resources', 'reviews'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === tab 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                 ))}
              </div>

              {activeTab === 'overview' && (
                <div className="animate-fade-in">
                   <h2 className="mb-4 text-2xl font-bold text-gray-900">About this course</h2>
                   <div className="mb-8 prose text-gray-700 max-w-none">
                     {courseData.description || "No description provided for this course."}
                   </div>
                   
                   <div className="p-6 border border-gray-200 bg-gray-50 rounded-xl">
                      <h3 className="mb-4 text-sm font-bold text-gray-400 uppercase">Instructor</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 text-xl font-bold text-white bg-blue-600 rounded-full shadow-lg">
                          {courseData.teacher_name?.[0]?.toUpperCase() || "T"}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{courseData.teacher_name || "Instructor"}</p>
                          <p className="text-sm text-blue-600">Course Author</p>
                        </div>
                      </div>
                   </div>
                </div>
              )}
              
              {activeTab === 'resources' && (
                  <div className="py-10 text-center text-gray-500">
                      <File className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                      No additional resources uploaded.
                  </div>
              )}

              {activeTab === 'reviews' && (
                  <div className="py-10 text-center text-gray-500">
                      No reviews yet.
                  </div>
              )}
           </div>
        </div>

        {/* RIGHT SIDE: CURRICULUM SIDEBAR (Accordion) */}
        <div className={`
            fixed inset-y-0 right-0 z-50 w-80 bg-gray-50 border-l border-gray-200 transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:block
            ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
           <div className="flex flex-col h-full">
               <div className="p-5 bg-white border-b">
                  <h2 className="text-lg font-bold text-gray-900">Course Content</h2>
                  <p className="mt-1 text-xs text-gray-500">{modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} lessons total</p>
               </div>
               
               <div className="flex-1 overflow-y-auto">
                  {modules.length === 0 ? (
                    <div className="p-8 text-sm text-center text-gray-400">
                        No content available.
                    </div>
                  ) : (
                    modules.map((module, mIndex) => (
                      <div key={module.id || mIndex} className="bg-white border-b border-gray-200">
                        {/* Module Header */}
                        <button 
                          onClick={() => toggleModule(module.id || mIndex)}
                          className="flex items-center justify-between w-full p-4 text-left transition-colors hover:bg-gray-50 group"
                        >
                          <div>
                            <h3 className="text-sm font-bold text-gray-800 transition-colors group-hover:text-blue-600">
                                {module.title || `Module ${mIndex + 1}`}
                            </h3>
                            <span className="text-xs text-gray-400">
                                {module.lessons?.length || 0} lessons
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedModules[module.id || mIndex] ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Lessons List */}
                        {expandedModules[module.id || mIndex] && (
                          <div className="border-t border-gray-100 bg-gray-50">
                            {module.lessons?.map((lesson, lIndex) => {
                               const isActive = currentLesson?.id === lesson.id;
                               
                               // Determine Icon
                               let LessonIcon = Video;
                               let iconColor = "text-gray-400";
                               
                               if (lesson.content_type === 'quiz') { LessonIcon = HelpCircle; iconColor = "text-purple-500"; }
                               else if (lesson.content_type === 'assignment') { LessonIcon = FileText; iconColor = "text-orange-500"; }
                               else if (lesson.content_type === 'document') { LessonIcon = File; iconColor = "text-green-500"; }

                               return (
                                 <button 
                                   key={lesson.id || lIndex}
                                   onClick={() => handleLessonSelect(lesson)}
                                   className={`w-full flex items-start gap-3 p-3 pl-6 text-left hover:bg-white transition-all border-l-[3px] ${
                                       isActive 
                                       ? 'bg-white border-l-blue-600 shadow-sm' 
                                       : 'border-l-transparent'
                                   }`}
                                 >
                                    <div className="mt-0.5">
                                        <LessonIcon size={16} className={isActive ? "text-blue-600" : iconColor} />
                                    </div>
                                    <div className="flex-1">
                                       <p className={`text-sm ${isActive ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
                                         {lesson.title}
                                       </p>
                                       <div className="flex items-center gap-2 mt-1">
                                            {lesson.content_type === 'video' && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Play size={8}/> 10 min</span>}
                                            <span className="text-[10px] text-gray-400 capitalize">{lesson.content_type}</span>
                                       </div>
                                    </div>
                                    {lesson.completed && <CheckCircle2 size={14} className="mt-1 text-green-500" />}
                                 </button>
                               );
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  )}
               </div>
           </div>
        </div>
        
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
            <div 
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
            ></div>
        )}

      </div>
    </div>
  );
};

export default CourseDetailView;