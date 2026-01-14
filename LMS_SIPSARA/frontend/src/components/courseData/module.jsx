import React, { useState, useEffect } from "react";
import {
  Plus,
  Play,
  FileText,
  Clock,
  BarChart3,
  BookOpen,
  AlertCircle,
  ChevronDown,
  Video,
  Zap,
  Edit2,
  ClipboardList,
  HelpCircle,
  Trash2,
} from "lucide-react";
import AddWeeklyContent from "@/components/courseData/AddWeeklyContent";
import AssignmentQuizPanel from "@/components/courseData/quiz"; 
import { courseService } from "@/config/course.config";

// ... existing SectionButton and QuickAction components ...
const SectionButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
      active
        ? "bg-blue-600 text-white border-blue-600 shadow"
        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
    }`}
  >
    <Icon size={18} />
    <span className="font-semibold">{label}</span>
  </button>
);

const QuickAction = ({ icon: Icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="p-4 text-left transition bg-white border rounded-xl hover:shadow"
  >
    <div className="flex items-start gap-3">
      <div className="p-2 text-blue-600 rounded-lg bg-blue-50">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  </button>
);

const Module = ({ courseId: propCourseId, courseTitle: propCourseTitle }) => {
  // State
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(propCourseId || null);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Assessments State
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  const [expandedModules, setExpandedModules] = useState({});
  const [showAddContent, setShowAddContent] = useState(false);
  const [editModuleId, setEditModuleId] = useState(null);

  const [courseDetails, setCourseDetails] = useState(null);
  const [error, setError] = useState(null);

  const [activeSection, setActiveSection] = useState("modules"); 
  
  // Creator/Editor Modal State
  const [showCreator, setShowCreator] = useState(false);
  const [creatorTab, setCreatorTab] = useState("assignment"); 
  const [itemToEdit, setItemToEdit] = useState(null); 

  // Initial Load
  useEffect(() => {
    fetchTeacherCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch Logic
  const fetchTeacherCourses = async () => {
    setCoursesLoading(true);
    setError(null);
    try {
      const data = await courseService.getCoursesteacher();
      const courses = Array.isArray(data) ? data : data?.results || [];
      setTeacherCourses(courses);

      if (propCourseId) {
        setSelectedCourseId(propCourseId);
        await fetchCourseFullDetails(propCourseId);
      } else if (courses.length > 0) {
        const firstCourseId = courses[0]?.id;
        setSelectedCourseId(firstCourseId);
        await fetchCourseFullDetails(firstCourseId);
      }
    } catch (err) {
      console.error(err);
      setError("Error loading courses");
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchCourseFullDetails = async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await courseService.getCourseModules(courseId);
      setCourseDetails(data?.course || null);
      setModules(Array.isArray(data?.modules) ? data.modules : []);
      setExpandedModules({});
    } catch (err) {
      console.error(err);
      setError("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Fetch Assessments by Course ID
  const fetchAssessments = async (courseId) => {
    if (!courseId) return;
    setAssessmentsLoading(true);
    try {
      // Pass 'course' as the second argument to trigger the new service logic
      const [assData, quizData] = await Promise.all([
        courseService.getAssignments(courseId, 'course'),
        courseService.getQuizzes(courseId, 'course')
      ]);
      
      setAssignments(Array.isArray(assData) ? assData : assData?.results || []);
      setQuizzes(Array.isArray(quizData) ? quizData : quizData?.results || []);
    } catch (err) {
      console.error("Failed to load assessments", err);
    } finally {
      setAssessmentsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId && activeSection === "assessments") {
      fetchAssessments(selectedCourseId);
    }
  }, [selectedCourseId, activeSection]);

  const handleCourseChange = async (courseId) => {
    setSelectedCourseId(courseId);
    setActiveSection("modules");
    setShowCreator(false);
    await fetchCourseFullDetails(courseId);
  };

  // ✅ Assessment Actions
  const handleEditAssessment = (item, type) => {
    setItemToEdit(item);
    setCreatorTab(type);
    setShowCreator(true);
  };

  const handleDeleteAssessment = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this? This cannot be undone.")) return;
    try {
      if (type === 'assignment') {
        await courseService.deleteAssignment(id);
        // Optimistic UI update
        setAssignments(prev => prev.filter(a => a.id !== id));
      } else {
        await courseService.deleteQuiz(id);
        setQuizzes(prev => prev.filter(q => q.id !== id));
      }
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  const closeCreator = () => {
    setShowCreator(false);
    setItemToEdit(null);
    // Refresh list to show new/updated items
    fetchAssessments(selectedCourseId);
  };

  // Render Helpers
  const getLessonIcon = (type) => {
    const props = { size: 18, className: "flex-shrink-0" };
    switch (type) {
      case "video": return <Video {...props} className="text-red-500" />;
      case "quiz": return <BarChart3 {...props} className="text-purple-500" />;
      case "assignment": return <Zap {...props} className="text-orange-500" />;
      default: return <FileText {...props} className="text-blue-500" />;
    }
  };

  const AssessmentItem = ({ item, type, icon: Icon, colorClass }) => (
    <div className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gray-50 ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-gray-800">{item.title}</h4>
          <div className="flex gap-3 text-xs text-gray-500">
             {/* Show related Lesson/Module */}
             {item.lesson && (
                <span className="px-2 py-0.5 bg-gray-100 rounded">
                  Lesson ID: {item.lesson}
                </span>
             )}
             {item.due_date && (
                <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
             )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => handleEditAssessment(item, type)}
          className="p-2 text-gray-500 rounded hover:text-blue-600 hover:bg-blue-50"
          title="Edit"
          type="button"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => handleDeleteAssessment(item.id, type)}
          className="p-2 text-gray-500 rounded hover:text-red-600 hover:bg-red-50"
          title="Delete"
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  // ... (Keep existing ModuleCard and LessonCard components) ...

  const ModuleCard = ({ module, index }) => (
    <div className="bg-white rounded shadow">
        <div className="flex justify-between p-4">
            <button onClick={() => setExpandedModules(prev => ({...prev, [module.id]: !prev[module.id]}))} className="flex items-center gap-4 text-left">
                <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded">
                    {index + 1}
                </div>
                <div>
                    <h3 className="font-semibold">{module.title}</h3>
                    <p className="text-sm text-gray-500">{module.lessons?.length || 0} lessons</p>
                </div>
            </button>
             <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setEditModuleId(module.id); setShowAddContent(true); }}>
                    <Edit2 size={18} />
                </button>
                <ChevronDown size={20} className={`transition ${expandedModules[module.id] ? "rotate-180" : ""}`} />
            </div>
        </div>
        {expandedModules[module.id] && (
            <div className="p-4 space-y-3 border-t bg-gray-50">
                {module.lessons?.length ? module.lessons.map(l => (
                     <div key={l.id} className="flex gap-4 p-4 bg-white border rounded-lg hover:shadow">
                        {getLessonIcon(l.content_type)}
                        <div>
                            <h4 className="font-semibold">{l.title}</h4>
                            <p className="text-sm text-gray-500">{l.content_type}</p>
                        </div>
                     </div>
                )) : <p className="text-center text-gray-500">No lessons</p>}
            </div>
        )}
    </div>
  );

  // --- Views ---

  if (showAddContent) {
    return (
      <AddWeeklyContent 
        courseId={selectedCourseId} 
        moduleId={editModuleId} 
        onBack={async () => {
            setShowAddContent(false);
            setEditModuleId(null);
            if(selectedCourseId) await fetchCourseFullDetails(selectedCourseId);
        }} 
      />
    );
  }

  // ✅ Creator View (With Edit Support)
  if (showCreator) {
    return (
      <div className="p-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            onClick={closeCreator}
          >
            ← Back to List
          </button>
          <div className="flex gap-2">
             <h2 className="text-xl font-bold">
               {itemToEdit ? `Edit ${creatorTab}` : `Create New ${creatorTab}`}
             </h2>
          </div>
        </div>
        
        {/* NOTE: Ensure your AssignmentQuizPanel handles the 'editData' prop 
           to pre-fill form fields (title, due_date, etc.) 
        */}
        <AssignmentQuizPanel 
          courseId={selectedCourseId} 
          defaultTab={creatorTab} 
          editData={itemToEdit} // <--- Pass the item to edit
          onSuccess={closeCreator} 
        />
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <h1 className="mb-6 text-3xl font-bold">{propCourseTitle || "Course Manager"}</h1>

      {/* Course Selector */}
      <div className="p-4 mb-6 bg-white rounded shadow">
        {coursesLoading ? (
          <p>Loading courses...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teacherCourses.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCourseChange(c.id)}
                className={`px-4 py-2 border rounded-full text-sm font-medium transition ${
                    selectedCourseId === c.id 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                type="button"
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedCourseId && (
        <div className="flex flex-wrap gap-2 mb-6">
          <SectionButton active={activeSection === "modules"} icon={BookOpen} label="Modules & Lessons" onClick={() => setActiveSection("modules")} />
          <SectionButton active={activeSection === "assessments"} icon={ClipboardList} label="Assignments & Quizzes" onClick={() => setActiveSection("assessments")} />
        </div>
      )}

      {/* Modules Section */}
      {selectedCourseId && !loading && activeSection === "modules" && (
        <>
           {courseDetails && (
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
              <div className="flex items-center gap-2 p-4 bg-white rounded shadow"><BookOpen className="text-blue-500"/> {courseDetails.level || "Level N/A"}</div>
              <div className="flex items-center gap-2 p-4 bg-white rounded shadow"><Play className="text-green-500"/> {modules.length} Modules</div>
              <div className="flex items-center gap-2 p-4 bg-white rounded shadow"><FileText className="text-purple-500"/> {courseDetails.language || "Lang N/A"}</div>
            </div>
          )}
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">Course Modules</h2>
            <button onClick={() => { setEditModuleId(null); setShowAddContent(true); }} className="flex gap-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700" type="button">
              <Plus size={18} /> Add Module
            </button>
          </div>
          <div className="space-y-4">
            {modules.length ? modules.map((m, i) => <ModuleCard key={m.id} module={m} index={i} />) : <p className="text-center text-gray-500">No modules yet</p>}
          </div>
        </>
      )}

      {/* ✅ Assignments + Quizzes Section */}
      {selectedCourseId && activeSection === "assessments" && (
        <div className="space-y-6">
          <div className="p-5 bg-white border rounded-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Assessments</h2>
                <p className="text-sm text-gray-500">Manage assignments and quizzes for this course.</p>
              </div>
              <div className="flex gap-2">
                 <button
                    type="button"
                    onClick={() => { setItemToEdit(null); setCreatorTab("assignment"); setShowCreator(true); }}
                    className="px-4 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600"
                  >
                    + New Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => { setItemToEdit(null); setCreatorTab("quiz"); setShowCreator(true); }}
                    className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    + New Quiz
                  </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Assignments List */}
            <div className="p-5 bg-white border rounded-xl">
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                <ClipboardList className="text-orange-500" size={20}/> Assignments
              </h3>
              {assessmentsLoading ? (
                <div className="flex justify-center p-4"><div className="w-6 h-6 border-b-2 border-orange-500 rounded-full animate-spin"></div></div>
              ) : assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.map(item => (
                    <AssessmentItem 
                      key={item.id} 
                      item={item} 
                      type="assignment" 
                      icon={ClipboardList}
                      colorClass="text-orange-600"
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                    <p>No assignments found.</p>
                </div>
              )}
            </div>

            {/* Quizzes List */}
            <div className="p-5 bg-white border rounded-xl">
              <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                <HelpCircle className="text-purple-500" size={20}/> Quizzes
              </h3>
              {assessmentsLoading ? (
                 <div className="flex justify-center p-4"><div className="w-6 h-6 border-b-2 border-purple-500 rounded-full animate-spin"></div></div>
              ) : quizzes.length > 0 ? (
                <div className="space-y-3">
                  {quizzes.map(item => (
                    <AssessmentItem 
                      key={item.id} 
                      item={item} 
                      type="quiz" 
                      icon={HelpCircle}
                      colorClass="text-purple-600"
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                    <p>No quizzes found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Module;