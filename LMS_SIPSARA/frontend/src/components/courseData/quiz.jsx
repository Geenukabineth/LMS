// quiz.jsx (FULL FIXED)
// AssignmentQuizPanel
// ✅ Select Module
// ✅ Save Assignment/Quiz as Lesson inside that Module
// ✅ Uses multipart/form-data (FormData) for DRF MultiPartParser/FormParser
// ✅ NO Redux

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Calendar,
  FileText,
  HelpCircle,
  Clock,
  AlertCircle,
  Layers,
  Upload,
} from "lucide-react";
import { courseService } from "@/config/course.config";

/**
 * Props:
 * - courseId: number|string (required for saving)
 * - defaultTab: "assignment" | "quiz"
 */
const AssignmentQuizPanel = ({ courseId, defaultTab = "assignment" }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // modules list for dropdown
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // ----------------------------
  // Assignment state
  // ----------------------------
  const [assignment, setAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
    points: "",
    instructions: "",
    rubric: "",
    attachment: null, // single file upload (optional)
  });

  // ----------------------------
  // Quiz state
  // ----------------------------
  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    timeLimit: "",
    attempts: 1,
    shuffleQuestions: false,
    showResults: "after_submission",
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    type: "multiple_choice",
    question: "",
    points: 1,
    options: ["", ""],
    correctAnswer: "",
    explanation: "",
  });

  // Question types
  const questionTypes = useMemo(
    () => [
      { value: "multiple_choice", label: "Multiple Choice" },
      { value: "true_false", label: "True/False" },
      { value: "short_answer", label: "Short Answer" },
      { value: "essay", label: "Essay" },
      { value: "fill_blank", label: "Fill in the Blank" },
    ],
    []
  );

  // ----------------------------
  // Load modules for this course
  // ----------------------------
  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        setErr("");
        setOk("");
        setLoading(true);
        const data = await courseService.getCourseModules(courseId); // returns {course, modules}
        const mods = Array.isArray(data?.modules) ? data.modules : [];
        setModules(mods);

        // default select first module
        if (mods.length > 0) setSelectedModuleId(String(mods[0].id));
        else setSelectedModuleId("");
      } catch (e) {
        console.error(e);
        setModules([]);
        setSelectedModuleId("");
        setErr("Failed to load modules for this course.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  // ----------------------------
  // Helpers
  // ----------------------------
  const addOption = () => {
    setCurrentQuestion((prev) => ({ ...prev, options: [...prev.options, ""] }));
  };

  const removeOption = (index) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const updateOption = (index, value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) return;

    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, id: Date.now() }],
    }));

    setCurrentQuestion({
      type: "multiple_choice",
      question: "",
      points: 1,
      options: ["", ""],
      correctAnswer: "",
      explanation: "",
    });
  };

  const removeQuestion = (id) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const validateBase = () => {
    if (!courseId) return "Missing courseId";
    if (!selectedModuleId) return "Please select a module";
    return null;
  };

  const moduleLessonOrder = useMemo(() => {
    const m = modules.find((x) => String(x.id) === String(selectedModuleId));
    const count = m?.lessons?.length || 0;
    return count + 1;
  }, [modules, selectedModuleId]);

  // Build FormData for creating a lesson
  const buildLessonFD = ({ title, content_type, jsonPayload, file }) => {
    const fd = new FormData();
    fd.append("module", String(selectedModuleId));
    fd.append("title", title);
    fd.append("content_type", content_type);
    fd.append("order", String(moduleLessonOrder));

    // If file present: backend expects request.FILES['file'] (multipart)
    if (file) {
      fd.append("file", file);
    } else {
      fd.append("content_url_or_text", JSON.stringify(jsonPayload));
    }

    return fd;
  };

  // ----------------------------
  // SAVE: Assignment as Lesson(content_type="assignment")
  // ----------------------------
  const saveAssignment = async () => {
    const baseErr = validateBase();
    if (baseErr) return setErr(baseErr);

    if (!assignment.title.trim()) return setErr("Assignment title is required");

    try {
      setErr("");
      setOk("");
      setLoading(true);

      // store assignment data as JSON in content_url_or_text
      const payload = {
        kind: "assignment",
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        points: assignment.points,
        instructions: assignment.instructions,
        rubric: assignment.rubric,
      };

      const fd = buildLessonFD({
        title: assignment.title,
        content_type: "assignment",
        jsonPayload: payload,
        file: assignment.attachment || null,
      });

      await courseService.postCourseLessons(fd);

      setOk("✓ Assignment saved under selected module as a Lesson");
      // refresh modules so lesson count/order updates
      const data = await courseService.getCourseModules(courseId);
      setModules(Array.isArray(data?.modules) ? data.modules : []);

      // reset form
      setAssignment({
        title: "",
        description: "",
        dueDate: "",
        points: "",
        instructions: "",
        rubric: "",
        attachment: null,
      });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to save assignment");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // SAVE: Quiz as Lesson(content_type="quiz")
  // ----------------------------
  const saveQuiz = async () => {
    const baseErr = validateBase();
    if (baseErr) return setErr(baseErr);

    if (!quiz.title.trim()) return setErr("Quiz title is required");
    if (quiz.questions.length === 0) return setErr("Add at least 1 question");

    try {
      setErr("");
      setOk("");
      setLoading(true);

      const payload = {
        kind: "quiz",
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        attempts: quiz.attempts,
        shuffleQuestions: quiz.shuffleQuestions,
        showResults: quiz.showResults,
        questions: quiz.questions.map((q) => ({
          type: q.type,
          question: q.question,
          points: q.points,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      };

      const fd = buildLessonFD({
        title: quiz.title,
        content_type: "quiz",
        jsonPayload: payload,
        file: null,
      });

      await courseService.postCourseLessons(fd);

      setOk("✓ Quiz saved under selected module as a Lesson");
      const data = await courseService.getCourseModules(courseId);
      setModules(Array.isArray(data?.modules) ? data.modules : []);

      // reset quiz
      setQuiz({
        title: "",
        description: "",
        timeLimit: "",
        attempts: 1,
        shuffleQuestions: false,
        showResults: "after_submission",
        questions: [],
      });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to save quiz");
    } finally {
      setLoading(false);
    }
  };

  const previewContent = () => {
    setErr("");
    setOk("");
    if (activeTab === "assignment") {
      console.log("Preview assignment:", { courseId, moduleId: selectedModuleId, ...assignment });
      alert("Assignment preview (check console)");
    } else {
      console.log("Preview quiz:", { courseId, moduleId: selectedModuleId, ...quiz });
      alert("Quiz preview (check console)");
    }
  };

  return (
    <div className="max-w-6xl min-h-screen p-6 mx-auto bg-gray-50">
      <div className="overflow-hidden bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 text-white bg-gradient-to-r from-blue-600 to-purple-600">
          <h1 className="mb-2 text-3xl font-bold">Content Creation Panel</h1>
          <p className="text-blue-100">
            Create assignments and quizzes for your students
            {courseId ? ` • Course ID: ${courseId}` : ""}
          </p>
        </div>

        {/* Module selector (IMPORTANT) */}
        <div className="px-6 pt-5">
          {err && (
            <div className="flex items-start gap-2 p-3 mb-4 text-red-700 border border-red-200 rounded-xl bg-red-50">
              <AlertCircle size={18} className="mt-0.5" />
              <div className="text-sm">{err}</div>
            </div>
          )}
          {ok && (
            <div className="p-3 mb-4 text-sm text-green-700 border border-green-200 rounded-xl bg-green-50">
              {ok}
            </div>
          )}

          <label className="block mb-2 text-sm font-medium text-gray-700">
            <Layers className="inline-block w-4 h-4 mr-1" />
            Select Module (required)
          </label>
          <select
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {modules.length === 0 ? (
              <option value="">No modules found (create modules first)</option>
            ) : (
              modules.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.title} (ID: {m.id})
                </option>
              ))
            )}
          </select>

          <p className="mb-4 text-xs text-gray-500">
            This will save the assignment/quiz as a <b>Lesson</b> inside the selected module.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-transparent-200">
          <nav className="flex px-6 py-3 space-x-4">
            <button
              onClick={() => setActiveTab("assignment")}
              className={`flex items-center px-5 py-2 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "assignment"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
              }`}
              type="button"
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              Assignment
            </button>

            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center px-5 py-2 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "quiz"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
              }`}
              type="button"
            >
              <HelpCircle className="inline-block w-4 h-4 mr-2" />
              Quiz
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "assignment" ? (
            /* Assignment Form */
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={assignment.title}
                    onChange={(e) =>
                      setAssignment((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assignment title"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    <Calendar className="inline-block w-4 h-4 mr-1" />
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={assignment.dueDate}
                    onChange={(e) =>
                      setAssignment((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Points
                  </label>
                  <input
                    type="number"
                    value={assignment.points}
                    onChange={(e) =>
                      setAssignment((prev) => ({ ...prev, points: e.target.value }))
                    }
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    <Upload className="inline-block w-4 h-4 mr-1" />
                    Attachment (optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) =>
                      setAssignment((prev) => ({
                        ...prev,
                        attachment: e.target.files?.[0] || null,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
                  />
                  {assignment.attachment && (
                    <p className="mt-1 text-xs text-gray-600">
                      Selected: <b>{assignment.attachment.name}</b>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={assignment.description}
                  onChange={(e) =>
                    setAssignment((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the assignment"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Instructions
                </label>
                <textarea
                  value={assignment.instructions}
                  onChange={(e) =>
                    setAssignment((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed instructions for students"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Rubric (Optional)
                </label>
                <textarea
                  value={assignment.rubric}
                  onChange={(e) =>
                    setAssignment((prev) => ({ ...prev, rubric: e.target.value }))
                  }
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Grading criteria and rubric"
                />
              </div>
            </div>
          ) : (
            /* Quiz Form */
            <div className="space-y-6">
              {/* Quiz Settings */}
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="mb-4 text-lg font-semibold">Quiz Settings</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Quiz Title *
                    </label>
                    <input
                      type="text"
                      value={quiz.title}
                      onChange={(e) =>
                        setQuiz((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter quiz title"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      <Clock className="inline-block w-4 h-4 mr-1" />
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={quiz.timeLimit}
                      onChange={(e) =>
                        setQuiz((prev) => ({ ...prev, timeLimit: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="60"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={quiz.description}
                    onChange={(e) =>
                      setQuiz((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Quiz description and instructions"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quiz.shuffleQuestions}
                      onChange={(e) =>
                        setQuiz((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))
                      }
                      className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Shuffle Questions</span>
                  </label>
                </div>
              </div>

              {/* Question Builder */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="mb-4 text-lg font-semibold">Add Question</h3>

                <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Question Type
                    </label>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {questionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Points
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          points: Number(e.target.value || 1),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Question *
                  </label>
                  <textarea
                    value={currentQuestion.question}
                    onChange={(e) =>
                      setCurrentQuestion((prev) => ({ ...prev, question: e.target.value }))
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your question here"
                  />
                </div>

                {/* Type-specific */}
                {currentQuestion.type === "multiple_choice" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Answer Options
                      </label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
                      >
                        <Plus className="inline-block w-4 h-4 mr-1" />
                        Add Option
                      </button>
                    </div>

                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === index.toString()}
                          onChange={() =>
                            setCurrentQuestion((prev) => ({
                              ...prev,
                              correctAnswer: index.toString(),
                            }))
                          }
                          className="text-blue-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                        {currentQuestion.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.type === "true_false" && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Correct Answer
                    </label>
                    <div className="space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="trueFalse"
                          value="true"
                          checked={currentQuestion.correctAnswer === "true"}
                          onChange={(e) =>
                            setCurrentQuestion((prev) => ({
                              ...prev,
                              correctAnswer: e.target.value,
                            }))
                          }
                          className="text-blue-600"
                        />
                        <span className="ml-2">True</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="trueFalse"
                          value="false"
                          checked={currentQuestion.correctAnswer === "false"}
                          onChange={(e) =>
                            setCurrentQuestion((prev) => ({
                              ...prev,
                              correctAnswer: e.target.value,
                            }))
                          }
                          className="text-blue-600"
                        />
                        <span className="ml-2">False</span>
                      </label>
                    </div>
                  </div>
                )}

                {(currentQuestion.type === "short_answer" ||
                  currentQuestion.type === "fill_blank") && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Sample Answer/Keywords
                    </label>
                    <input
                      type="text"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          correctAnswer: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter sample answer or keywords"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Explanation (Optional)
                  </label>
                  <textarea
                    value={currentQuestion.explanation}
                    onChange={(e) =>
                      setCurrentQuestion((prev) => ({
                        ...prev,
                        explanation: e.target.value,
                      }))
                    }
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explanation for the correct answer"
                  />
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 mt-4 text-white bg-green-500 rounded-md hover:bg-green-600"
                >
                  <Plus className="inline-block w-4 h-4 mr-2" />
                  Add Question
                </button>
              </div>

              {/* Questions List */}
              {quiz.questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Questions ({quiz.questions.length})
                  </h3>
                  {quiz.questions.map((q, index) => (
                    <div key={q.id} className="p-4 rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2 space-x-2">
                            <span className="text-sm font-medium text-gray-500">
                              Q{index + 1} •{" "}
                              {questionTypes.find((t) => t.value === q.type)?.label} •{" "}
                              {q.points} pts
                            </span>
                          </div>
                          <p className="mb-2 text-gray-800">{q.question}</p>

                          {q.type === "multiple_choice" && (
                            <ul className="space-y-1 text-sm text-gray-600">
                              {q.options.map((opt, i) => (
                                <li
                                  key={i}
                                  className={
                                    i.toString() === q.correctAnswer
                                      ? "font-semibold text-green-600"
                                      : ""
                                  }
                                >
                                  {String.fromCharCode(65 + i)}. {opt}
                                </li>
                              ))}
                            </ul>
                          )}

                          {q.type === "true_false" && (
                            <p className="text-sm font-semibold text-green-600">
                              Correct Answer: {q.correctAnswer === "true" ? "True" : "False"}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={previewContent}
              className="flex items-center px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600"
              disabled={loading}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>

            <button
              type="button"
              onClick={activeTab === "assignment" ? saveAssignment : saveQuiz}
              className="flex items-center px-6 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-60"
              disabled={loading || modules.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : `Save ${activeTab === "assignment" ? "Assignment" : "Quiz"}`}
            </button>
          </div>

          {modules.length === 0 && (
            <p className="mt-4 text-sm text-amber-700">
              Create at least one module first. Then you can add quizzes/assignments into that module.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentQuizPanel;
