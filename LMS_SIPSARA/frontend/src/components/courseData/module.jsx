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
} from "lucide-react";
import AddWeeklyContent from "@/components/courseData/AddWeeklyContent";
import AssignmentQuizPanel from "@/components/courseData/quiz"; // ✅ adjust path if different
import { courseService } from "@/config/course.config";

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
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(propCourseId || null);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  const [expandedModules, setExpandedModules] = useState({});
  const [showAddContent, setShowAddContent] = useState(false);
  const [editModuleId, setEditModuleId] = useState(null);

  const [courseDetails, setCourseDetails] = useState(null);
  const [error, setError] = useState(null);

  const [showStats] = useState(true);

  // ✅ new
  const [activeSection, setActiveSection] = useState("modules"); // modules | assessments
  const [showCreator, setShowCreator] = useState(false);
  const [creatorTab, setCreatorTab] = useState("assignment"); // assignment | quiz

  // -----------------------------------
  // ✅ Load teacher courses on mount
  // -----------------------------------
  useEffect(() => {
    fetchTeacherCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTeacherCourses = async () => {
    setCoursesLoading(true);
    setError(null);

    try {
      const data = await courseService.getCoursesteacher();
      const courses = Array.isArray(data)
        ? data
        : data?.courses || data?.results || [];

      setTeacherCourses(courses);

      // If propCourseId exists → use it
      if (propCourseId) {
        setSelectedCourseId(propCourseId);
        await fetchCourseFullDetails(propCourseId);
        return;
      }

      // Otherwise choose first course
      if (courses.length > 0) {
        const firstCourseId = courses[0]?.id; // ✅ always use id
        setSelectedCourseId(firstCourseId);
        await fetchCourseFullDetails(firstCourseId);
      } else {
        setSelectedCourseId(null);
        setModules([]);
        setCourseDetails(null);
      }
    } catch (err) {
      console.error(err);
      setError("Error loading courses");
      setSelectedCourseId(null);
      setModules([]);
      setCourseDetails(null);
    } finally {
      setCoursesLoading(false);
    }
  };

  // -----------------------------------
  // ✅ Fetch modules + course details
  // expects backend response:
  // { course: {...}, modules: [...] }
  // -----------------------------------
  const fetchCourseFullDetails = async (courseId) => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await courseService.getCourseModules(courseId);

      const course = data?.course || null;
      const modulesArr = Array.isArray(data?.modules) ? data.modules : [];

      setCourseDetails(course);
      setModules(modulesArr);
      setExpandedModules({});
    } catch (err) {
      console.error(err);
      setError("Failed to load course details");
      setCourseDetails(null);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (courseId) => {
    setSelectedCourseId(courseId);
    setActiveSection("modules");
    setShowCreator(false);
    await fetchCourseFullDetails(courseId);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleEditModule = (module) => {
    setEditModuleId(module?.id || null);
    setShowAddContent(true);
  };

  const handleBackFromAddContent = async () => {
    setShowAddContent(false);
    setEditModuleId(null);
    if (selectedCourseId) {
      await fetchCourseFullDetails(selectedCourseId);
    }
  };

  const getLessonIcon = (type) => {
    const props = { size: 18, className: "flex-shrink-0" };
    switch (type) {
      case "video":
        return <Video {...props} className="text-red-500" />;
      case "quiz":
        return <BarChart3 {...props} className="text-purple-500" />;
      case "assignment":
        return <Zap {...props} className="text-orange-500" />;
      default:
        return <FileText {...props} className="text-blue-500" />;
    }
  };

  const LessonCard = ({ lesson }) => (
    <div className="flex gap-4 p-4 bg-white border rounded-lg hover:shadow">
      {getLessonIcon(lesson.content_type)}
      <div>
        <h4 className="font-semibold">{lesson.title}</h4>
        <p className="text-sm text-gray-500">{lesson.content_type}</p>
        {lesson.duration_minutes && (
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} /> {lesson.duration_minutes} min
          </p>
        )}
      </div>
    </div>
  );

  const ModuleCard = ({ module, index }) => (
    <div className="bg-white rounded shadow">
      <div className="flex justify-between p-4">
        <button
          onClick={() => toggleModule(module.id)}
          className="flex items-center gap-4"
          type="button"
        >
          <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded">
            {index + 1}
          </div>
          <div>
            <h3 className="font-semibold">{module.title}</h3>
            <p className="text-sm text-gray-500">
              {module.lessons?.length || 0} lessons
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => handleEditModule(module)}>
            <Edit2 size={18} />
          </button>
          <ChevronDown
            size={20}
            className={`transition ${
              expandedModules[module.id] ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {expandedModules[module.id] && (
        <div className="p-4 space-y-3 border-t bg-gray-50">
          {module.lessons?.length ? (
            module.lessons.map((l) => (
              <LessonCard key={l.id || l.lesson_id} lesson={l} />
            ))
          ) : (
            <p className="text-center text-gray-500">No lessons</p>
          )}
        </div>
      )}
    </div>
  );

  // -----------------------------------
  // ✅ Add Weekly Content screen
  // -----------------------------------
  if (showAddContent) {
    return (
      <AddWeeklyContent
        courseId={selectedCourseId}
        moduleId={editModuleId}
        onBack={handleBackFromAddContent}
      />
    );
  }

  // -----------------------------------
  // ✅ Error UI
  // -----------------------------------
  if (error && !coursesLoading) {
    return (
      <div className="p-6 text-center text-red-600">
        <AlertCircle className="mx-auto mb-2" />
        {error}
      </div>
    );
  }

  // -----------------------------------
  // ✅ Creator screen (Assignment / Quiz) using your quiz.jsx UI
  // -----------------------------------
  if (showCreator) {
    return (
      <div className="p-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            onClick={() => setShowCreator(false)}
          >
            ← Back to Course
          </button>

          <div className="flex gap-2">
            <SectionButton
              active={creatorTab === "assignment"}
              icon={ClipboardList}
              label="Assignment"
              onClick={() => setCreatorTab("assignment")}
            />
            <SectionButton
              active={creatorTab === "quiz"}
              icon={HelpCircle}
              label="Quiz"
              onClick={() => setCreatorTab("quiz")}
            />
          </div>
        </div>

        <AssignmentQuizPanel courseId={selectedCourseId} defaultTab={creatorTab} />
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <h1 className="mb-6 text-3xl font-bold">
        {propCourseTitle || "My Courses"}
      </h1>

      {/* Courses list */}
      <div className="p-4 mb-6 bg-white rounded shadow">
        {coursesLoading ? (
          <p>Loading courses...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {teacherCourses.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCourseChange(c.id)}
                className={`p-3 border rounded ${
                  selectedCourseId === c.id ? "bg-blue-50 border-blue-500" : ""
                }`}
                type="button"
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top switch */}
      {selectedCourseId && (
        <div className="flex flex-wrap gap-2 mb-6">
          <SectionButton
            active={activeSection === "modules"}
            icon={BookOpen}
            label="Modules & Lessons"
            onClick={() => setActiveSection("modules")}
          />
          <SectionButton
            active={activeSection === "assessments"}
            icon={ClipboardList}
            label="Assignments & Quizzes"
            onClick={() => setActiveSection("assessments")}
          />
        </div>
      )}

      {/* Modules section */}
      {selectedCourseId && !loading && activeSection === "modules" && (
        <>
          {courseDetails && showStats && (
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
              <div className="flex items-center gap-2 p-4 bg-white rounded shadow">
                <BookOpen /> {courseDetails.level || "All Levels"}
              </div>
              <div className="flex items-center gap-2 p-4 bg-white rounded shadow">
                <Play /> {modules.length} Modules
              </div>
              <div className="flex items-center gap-2 p-4 bg-white rounded shadow">
                <FileText /> {courseDetails.language || "English"}
              </div>
            </div>
          )}

          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">Course Modules</h2>
            <button
              onClick={() => {
                setEditModuleId(null);
                setShowAddContent(true);
              }}
              className="flex gap-2 px-4 py-2 text-white bg-blue-600 rounded"
              type="button"
            >
              <Plus size={18} /> Add Content
            </button>
          </div>

          <div className="space-y-4">
            {modules.length ? (
              modules.map((m, i) => (
                <ModuleCard key={m.id} module={m} index={i} />
              ))
            ) : (
              <p className="text-center text-gray-500">No modules yet</p>
            )}
          </div>
        </>
      )}

      {/* Assignments + Quizzes section */}
      {selectedCourseId && activeSection === "assessments" && (
        <div className="space-y-6">
          <div className="p-5 bg-white border rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Assignments & Quizzes</h2>
                <p className="text-sm text-gray-500">
                  Create graded activities for this course (no Redux).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreatorTab("assignment");
                  setShowCreator(true);
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                + Create
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-2">
              <QuickAction
                icon={ClipboardList}
                title="Create Assignment"
                desc="Add instructions, due date, points, rubric."
                onClick={() => {
                  setCreatorTab("assignment");
                  setShowCreator(true);
                }}
              />
              <QuickAction
                icon={HelpCircle}
                title="Create Quiz"
                desc="Build questions (MCQ, T/F, short answer, etc.)."
                onClick={() => {
                  setCreatorTab("quiz");
                  setShowCreator(true);
                }}
              />
            </div>
          </div>

          {/* Optional placeholder lists */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="p-5 bg-white border rounded-xl">
              <h3 className="mb-2 font-semibold">Assignments</h3>
              <p className="text-sm text-gray-500">
                (Hook your API list here if available)
              </p>
            </div>
            <div className="p-5 bg-white border rounded-xl">
              <h3 className="mb-2 font-semibold">Quizzes</h3>
              <p className="text-sm text-gray-500">
                (Hook your API list here if available)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Module;
