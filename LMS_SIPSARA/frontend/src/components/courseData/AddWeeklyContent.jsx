

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Video,
  FileText,
  Calendar,
  Clock3,
  Filter,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  ClipboardList,
} from "lucide-react";
import { courseService } from "@/config/course.config";

// --- Lesson type meta (now includes quiz + assignment) ---
const lessonTypeMeta = {
  video: {
    label: "Video",
    icon: Video,
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  document: {
    label: "Document",
    icon: FileText,
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  quiz: {
    label: "Quiz (locked)",
    icon: ClipboardList,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  assignment: {
    label: "Assignment (locked)",
    icon: ClipboardList,
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

const pill = (...classes) => classes.filter(Boolean).join(" ");

const LessonTypePill = ({ type, locked }) => {
  const meta = lessonTypeMeta[type] || lessonTypeMeta.document;
  const Icon = meta.icon;
  return (
    <span
      className={pill(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border",
        meta.badge
      )}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
      {locked && <Lock className="w-3 h-3 opacity-70" />}
    </span>
  );
};

const AddWeeklyContent = ({ courseId, onBack }) => {
  // --- State ---
  const [modules, setModules] = useState([
    {
      id: `tmp-${Date.now()}`,
      title: "",
      order: 1,
      lessons: [],
      _isNew: true,
    },
  ]);

  const [courseDetails, setCourseDetails] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [weekFilter, setWeekFilter] = useState("all");
  const [nextWeekHint, setNextWeekHint] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --- Derived stats ---
  const totalModules = modules.length;
  const totalLessons = useMemo(
    () => modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0),
    [modules]
  );

  const maxWeek = useMemo(() => {
    let max = 1;
    modules.forEach((m) => {
      (m.lessons || []).forEach((l) => {
        if (Number.isFinite(l.week)) {
          max = Math.max(max, l.week);
        }
      });
    });
    return max;
  }, [modules]);

  useEffect(() => setNextWeekHint(maxWeek + 1), [maxWeek]);

  // --- Initial fetch ---
  useEffect(() => {
    if (courseId) fetchCourseDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data = await courseService.getCourseModules(courseId);
      setCourseDetails(data?.course || null);

      if (Array.isArray(data?.modules) && data.modules.length > 0) {
        const formatted = data.modules.map((m, index) => ({
          id: m.id,
          title: m.title || "",
          order: m.order ?? index + 1,
          lessons: Array.isArray(m.lessons)
            ? m.lessons.map((l, i) => {
                const type = l.content_type || "document";
                const locked = type === "quiz" || type === "assignment";
                // const locked = false;

                return {
                  id: l.id,
                  title: l.title || "",
                  content_type: type,
                  order: l.order ?? i + 1,
                  content_url_or_text: l.content_url_or_text || "",
                  duration_minutes: l.duration_minutes ?? "",
                  // UI-only:
                  week: 1, // you can map a real week if your API has it
                  uploadType: "url",
                  file: null,
                  _isNew: false,
                  _locked: locked, // 🔒 important
                };
              })
            : [],
          _isNew: false,
        }));

        setModules(formatted);
        const firstId = formatted[0]?.id;
        if (firstId) setExpanded({ [firstId]: true });
      } else {
        const tmpId = `tmp-${Date.now()}`;
        setModules([
          {
            id: tmpId,
            title: "",
            order: 1,
            lessons: [],
            _isNew: true,
          },
        ]);
        setExpanded({ [tmpId]: true });
      }
    } catch (err) {
      console.error(err);
      setCourseDetails(null);
      setModules([
        {
          id: `tmp-${Date.now()}`,
          title: "",
          order: 1,
          lessons: [],
          _isNew: true,
        },
      ]);
      setErrorMessage("Failed to load course modules");
    } finally {
      setLoading(false);
    }
  };

  // --- Module helpers ---
  const addModule = () => {
    const id = `tmp-${Date.now()}`;
    setModules((prev) => [
      ...prev,
      {
        id,
        title: "",
        order: prev.length + 1,
        lessons: [],
        _isNew: true,
      },
    ]);
    setExpanded((prev) => ({ ...prev, [id]: true }));
  };

  const updateModuleTitle = (id, title) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title } : m))
    );
  };

  const toggleExpand = (moduleId) => {
    setExpanded((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const removeModule = async (id) => {
    setErrorMessage("");
    setSuccessMessage("");

    const module = modules.find((m) => m.id === id);
    if (!module) return;

    if (modules.length === 1) {
      setErrorMessage("You must have at least one module.");
      return;
    }

    try {
      if (!module._isNew && typeof module.id === "number") {
        setLoading(true);
        await courseService.deleteCourseModules(module.id);
      }

      setModules((prev) =>
        prev
          .filter((m) => m.id !== id)
          .map((m, index) => ({ ...m, order: index + 1 }))
      );

      setExpanded((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      setSuccessMessage("✓ Module deleted");
    } catch (e) {
      console.error(e);
      setErrorMessage("Failed to delete module");
    } finally {
      setLoading(false);
    }
  };

  // --- Lesson helpers ---
  const addLesson = (moduleId, type) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;

        const nextOrder = (m.lessons?.length || 0) + 1;
        const moduleMaxWeek = (m.lessons || []).reduce(
          (mx, l) => Math.max(mx, l.week || 1),
          1
        );
        const weekDefault =
          weekFilter !== "all"
            ? Number(weekFilter)
            : m.lessons?.length
            ? moduleMaxWeek
            : nextWeekHint;

        return {
          ...m,
          lessons: [
            ...(m.lessons || []),
            {
              id: `tmp-lesson-${Date.now()}`,
              title: "",
              content_type: type, // "video" or "document"
              order: nextOrder,
              content_url_or_text: "",
              duration_minutes: "",
              week: weekDefault,
              uploadType: "url",
              file: null,
              _isNew: true,
              _locked: false,
            },
          ],
        };
      })
    );
  };

  const updateLesson = (moduleId, lessonId, field, value) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          lessons: (m.lessons || []).map((l) =>
            l.id === lessonId ? { ...l, [field]: value } : l
          ),
        };
      })
    );
  };

  const removeLesson = async (moduleId, lessonId) => {
    // UI remove
    const lesson = modules
      .find((m) => m.id === moduleId)
      ?.lessons?.find((l) => l.id === lessonId);

    if (lesson?._locked) {
      // should never happen if button disabled, but just in case
      setErrorMessage("Locked lessons (quiz/assignment) cannot be deleted.");
      return;
    }

    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: (m.lessons || []).filter((l) => l.id !== lessonId),
            }
          : m
      )
    );

    // If numeric => delete on backend
    const lessonIsNumeric = Number.isInteger(Number(lessonId));
    if (lessonIsNumeric) {
      try {
        await courseService.deleteCourseLessons(Number(lessonId));
        setSuccessMessage("✓ Lesson deleted");
      } catch (e) {
        console.error(e);
        setErrorMessage("Failed to delete lesson on server");
      }
    }
  };

  const onLessonFilePick = (moduleId, lessonId, file) => {
    updateLesson(moduleId, lessonId, "file", file);
    updateLesson(moduleId, lessonId, "uploadType", "file");
    updateLesson(moduleId, lessonId, "content_url_or_text", "");
  };

  // --- Validation + backend helpers ---
  const validate = () => {
    for (const m of modules) {
      if (!m.title?.trim()) return "Module title is required";

      for (const l of m.lessons || []) {
        if (!l._isNew) continue; // existing lessons not validated here
        if (!l.title?.trim()) return "Lesson title is required";

        if (l.uploadType === "file") {
          if (!l.file) return "Please upload a document file for the lesson";
        } else {
          if (!l.content_url_or_text)
            return "Lesson URL required for new lesson";
        }
      }
    }
    return null;
  };

  const buildLessonFormData = (realModuleId, lesson) => {
    const fd = new FormData();
    fd.append("module", String(realModuleId));
    fd.append("title", lesson.title || "");
    fd.append("content_type", lesson.content_type || "document");
    fd.append("order", String(lesson.order || 1));

    if (lesson.duration_minutes !== "" && lesson.duration_minutes != null) {
      fd.append("duration_minutes", String(lesson.duration_minutes));
    } else {
      fd.append("duration_minutes", "");
    }

    if (lesson.uploadType === "file" && lesson.file) {
      fd.append("file", lesson.file);
      fd.append("content_url_or_text", "");
    } else {
      fd.append("content_url_or_text", lesson.content_url_or_text || "");
    }

    return fd;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const err = validate();
    if (err) {
      setErrorMessage(err);
      return;
    }

    setLoading(true);

    try {
      // 1) Create/update modules
      const moduleIdMap = new Map();

      for (const module of modules) {
        if (!module._isNew && typeof module.id === "number") {
          // Update existing
          await courseService.putCourseModules(module.id, {
            title: module.title,
            order: module.order,
            course: courseId,
          });
          moduleIdMap.set(module.id, module.id);
        } else {
          // Create new
          const created = await courseService.postCourseModules({
            title: module.title,
            order: module.order,
            course: courseId,
          });

          const realId = created?.id;
          if (!realId)
            throw new Error("Module created but module id not returned");

          moduleIdMap.set(module.id, realId);
        }
      }

      // 2) Create new lessons (multipart/form-data)
      for (const module of modules) {
        const realModuleId = moduleIdMap.get(module.id);
        if (!realModuleId) continue;

        const newLessons =
          (module.lessons || []).filter((l) => l._isNew) || [];

        for (const lesson of newLessons) {
          const fd = buildLessonFormData(realModuleId, lesson);
          await courseService.postCourseLessons(fd);
        }
      }

      setSuccessMessage("✓ Modules and lessons saved successfully");
      await fetchCourseDetails();
    } catch (e2) {
      console.error(e2);
      setErrorMessage(e2?.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  // --- Render helpers ---
  const weekOptions = Array.from({ length: 12 }).map((_, i) => i + 1);

  const filteredLessons = (lessons) =>
    weekFilter === "all"
      ? lessons
      : (lessons || []).filter((l) => l.week === Number(weekFilter));

  // --- UI ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="flex items-center justify-between max-w-6xl px-6 py-4 mx-auto">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                Weekly Content
              </h1>
              <p className="text-xs text-gray-500 md:text-sm">
                Build modules & lessons for this course. Quiz & assignments are
                locked here.
              </p>
            </div>
          </div>

          {courseDetails && (
            <div className="hidden text-xs text-right md:block">
              <div className="font-semibold text-gray-800">
                {courseDetails.title}
              </div>
              <div className="text-gray-500">
                {courseDetails.code || ""}{" "}
                {courseDetails.batch ? `• ${courseDetails.batch}` : ""}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl px-6 py-6 mx-auto space-y-6">
        {/* Alerts */}
        {(loading || errorMessage || successMessage) && (
          <div className="space-y-2">
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 text-sm text-red-700 border border-red-200 bg-red-50 rounded-xl">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 text-sm text-green-700 border border-green-200 bg-green-50 rounded-xl">
                {successMessage}
              </div>
            )}
            {loading && (
              <div className="text-xs text-gray-500">
                Saving / loading… please wait.
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="p-4 bg-white border shadow-sm rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Modules
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {totalModules}
                </p>
              </div>
              <div className="p-2 bg-gray-50 rounded-xl">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border shadow-sm rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Lessons
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {totalLessons}
                </p>
              </div>
              <div className="p-2 bg-gray-50 rounded-xl">
                <Video className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border shadow-sm rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Next week hint
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  Week {nextWeekHint}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  New lessons will default to this week unless you change it.
                </p>
              </div>
              <div className="p-2 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters + actions */}
        <div className="flex flex-col gap-3 p-4 bg-white border shadow-sm rounded-2xl md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>Week filter</span>
            </div>
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border rounded-xl"
            >
              <option value="all">All weeks</option>
              {weekOptions.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addModule}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-800 bg-white border shadow-sm rounded-2xl hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Add module
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-2xl hover:bg-green-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        {/* Modules + lessons */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {modules.map((module) => {
            const isOpen = expanded[module.id];
            const visibleLessons = filteredLessons(module.lessons || []);

            return (
              <div
                key={module.id}
                className="bg-white border shadow-sm rounded-2xl"
              >
                {/* Module header */}
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(module.id)}
                    className="flex items-center flex-1 gap-3 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-gray-400">
                          Module {module.order}
                        </span>
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) =>
                            updateModuleTitle(module.id, e.target.value)
                          }
                          placeholder="Module title (e.g., Week 1 - Basics)"
                          className="flex-1 min-w-0 px-3 py-1.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {visibleLessons.length} lesson
                        {visibleLessons.length === 1 ? "" : "s"} visible in this
                        view.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeModule(module.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 rounded-xl hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    {/* Lesson actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock3 className="w-4 h-4" />
                        <span>
                          Add video or document lessons to this module. Quiz &
                          assignments are locked here.
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addLesson(module.id, "video")}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100"
                        >
                          <Video className="w-3 h-3" />
                          Add video lesson
                        </button>
                        <button
                          type="button"
                          onClick={() => addLesson(module.id, "document")}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100"
                        >
                          <FileText className="w-3 h-3" />
                          Add document lesson
                        </button>
                      </div>
                    </div>

                    {visibleLessons.length === 0 ? (
                      <div className="p-4 text-xs text-center text-gray-500 bg-white border border-dashed rounded-xl">
                        No lessons yet for this module.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {visibleLessons.map((l) => {
                          const isLocked = l._locked;

                          return (
                            <div
                              key={l.id}
                              className="p-3 bg-white border rounded-xl"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <LessonTypePill
                                      type={l.content_type}
                                      locked={isLocked}
                                    />

                                    {/* Week selector - also locked if quiz/assignment */}
                                    <select
                                      value={l.week}
                                      onChange={(e) =>
                                        updateLesson(
                                          module.id,
                                          l.id,
                                          "week",
                                          Number(e.target.value)
                                        )
                                      }
                                      disabled={isLocked}
                                      className="px-2 py-1 text-xs bg-white border rounded-xl disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                      {weekOptions.map((w) => (
                                        <option key={w} value={w}>
                                          Week {w}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Title */}
                                  {isLocked ? (
                                    <div className="px-3 py-2 text-sm text-gray-600 border bg-gray-50 rounded-xl">
                                      {l.title || "(No title)"}{" "}
                                      <span className="ml-1 text-[11px] text-gray-400">
                                        (locked)
                                      </span>
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      value={l.title}
                                      onChange={(e) =>
                                        updateLesson(
                                          module.id,
                                          l.id,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Lesson title"
                                      className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                  )}

                                  {/* CONTENT SECTION */}
                                  {isLocked ? (
                                    <div className="px-3 py-2 text-xs text-gray-500 border bg-gray-50 rounded-xl">
                                      This {l.content_type} is managed in the
                                      quiz/assignment screen and cannot be
                                      edited here.
                                    </div>
                                  ) : l.content_type === "video" ? (
                                    // editable video
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-gray-600">
                                        Video URL
                                      </label>
                                      <input
                                        type="url"
                                        value={l.content_url_or_text}
                                        onChange={(e) =>
                                          updateLesson(
                                            module.id,
                                            l.id,
                                            "content_url_or_text",
                                            e.target.value
                                          )
                                        }
                                        placeholder="https://youtube.com/..."
                                        className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                      />
                                    </div>
                                  ) : (
                                    // editable document (URL / file toggle)
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                        <span>Document source:</span>
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`doc-src-${module.id}-${l.id}`}
                                            checked={l.uploadType === "url"}
                                            onChange={() => {
                                              updateLesson(
                                                module.id,
                                                l.id,
                                                "uploadType",
                                                "url"
                                              );
                                              updateLesson(
                                                module.id,
                                                l.id,
                                                "file",
                                                null
                                              );
                                            }}
                                          />
                                          URL
                                        </label>
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`doc-src-${module.id}-${l.id}`}
                                            checked={l.uploadType === "file"}
                                            onChange={() =>
                                              updateLesson(
                                                module.id,
                                                l.id,
                                                "uploadType",
                                                "file"
                                              )
                                            }
                                          />
                                          File upload
                                        </label>
                                      </div>

                                      {l.uploadType === "file" ? (
                                        <div className="space-y-1">
                                          <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                            onChange={(e) =>
                                              onLessonFilePick(
                                                module.id,
                                                l.id,
                                                e.target.files?.[0] || null
                                              )
                                            }
                                            className="block w-full text-xs border rounded-xl cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                          />
                                          <p className="text-[11px] text-gray-500">
                                            If you upload a file, the URL field
                                            is not required.
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="space-y-1">
                                          <label className="text-xs font-medium text-gray-600">
                                            Document URL
                                          </label>
                                          <input
                                            type="url"
                                            value={l.content_url_or_text}
                                            onChange={(e) =>
                                              updateLesson(
                                                module.id,
                                                l.id,
                                                "content_url_or_text",
                                                e.target.value
                                              )
                                            }
                                            placeholder="https://drive.google.com/..."
                                            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Duration */}
                                  <div className="grid grid-cols-1 gap-3 mt-2 md:grid-cols-3">
                                    <div>
                                      <label className="text-xs font-medium text-gray-600">
                                        Duration (minutes)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={l.duration_minutes}
                                        onChange={(e) =>
                                          updateLesson(
                                            module.id,
                                            l.id,
                                            "duration_minutes",
                                            e.target.value
                                          )
                                        }
                                        disabled={isLocked}
                                        placeholder="e.g. 45"
                                        className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                                      />
                                    </div>
                                    <div className="flex items-end text-[11px] text-gray-500 md:col-span-2">
                                      <span>
                                        Week {l.week} • order {l.order} in this
                                        module.
                                        {isLocked && " (locked item)"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Remove button – disabled for locked */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    !isLocked &&
                                    removeLesson(module.id, l.id)
                                  }
                                  disabled={isLocked}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-2xl hover:bg-green-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save all changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWeeklyContent;
