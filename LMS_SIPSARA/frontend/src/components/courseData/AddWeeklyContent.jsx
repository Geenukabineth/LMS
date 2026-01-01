// AddWeeklyContent.jsx (FULL - FIXED)
// ✅ Lessons now SAVE to backend
// ✅ Document upload supported (multipart/form-data)
// ✅ Works with your DRF LessonCreateAPIView which uses MultiPartParser/FormParser
// ✅ NO Redux

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Save,
  Trash2,
  ArrowLeft,
  Video,
  FileText,
  AlertCircle,
  ChevronDown,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import { courseService } from "@/config/course.config";

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
};

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="p-4 bg-white border shadow-sm rounded-2xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="p-3 text-gray-700 rounded-xl bg-gray-50">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const Pill = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${className}`}
  >
    {children}
  </span>
);

const ToggleChip = ({ active, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition ${
      active
        ? "bg-gray-900 text-white border-gray-900"
        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const AddWeeklyContent = ({ courseId, onBack }) => {
  const [modules, setModules] = useState([
    { id: `tmp-${Date.now()}`, title: "", order: 1, lessons: [], _isNew: true },
  ]);

  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [expanded, setExpanded] = useState({});
  const [weekFilter, setWeekFilter] = useState("all");
  const [nextWeekHint, setNextWeekHint] = useState(1);

  useEffect(() => {
    if (courseId) fetchCourseDetails();
    // eslint-disable-next-line
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const data = await courseService.getCourseModules(courseId);
      setCourseDetails(data?.course || null);

      if (Array.isArray(data?.modules) && data.modules.length > 0) {
        const formatted = data.modules.map((m, index) => ({
          id: m.id, // numeric
          title: m.title || "",
          order: m.order ?? index + 1,
          lessons: Array.isArray(m.lessons)
            ? m.lessons.map((l, i) => ({
                id: l.id, // numeric
                title: l.title || "",
                content_type: l.content_type || "document",
                order: l.order ?? i + 1,
                content_url_or_text: l.content_url_or_text || "",
                duration_minutes: l.duration_minutes ?? "",
                // UI-only week (backend model doesn't have it)
                week: 1,
                uploadType: "url", // "url" | "file"
                file: null,
                _isNew: false,
              }))
            : [],
          _isNew: false,
        }));

        setModules(formatted);

        const firstId = formatted?.[0]?.id;
        if (firstId) setExpanded({ [firstId]: true });
      } else {
        const tmpId = `tmp-${Date.now()}`;
        setModules([
          { id: tmpId, title: "", order: 1, lessons: [], _isNew: true },
        ]);
        setExpanded({ [tmpId]: true });
      }
    } catch (err) {
      console.error(err);
      setCourseDetails(null);
      setModules([
        { id: `tmp-${Date.now()}`, title: "", order: 1, lessons: [], _isNew: true },
      ]);
    }
  };

  const totalModules = modules.length;
  const totalLessons = useMemo(
    () => modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0),
    [modules]
  );

  const maxWeek = useMemo(() => {
    let max = 1;
    modules.forEach((m) => {
      (m.lessons || []).forEach((l) => {
        if (Number.isFinite(l.week)) max = Math.max(max, l.week);
      });
    });
    return max;
  }, [modules]);

  useEffect(() => setNextWeekHint(maxWeek + 1), [maxWeek]);

  const addModule = () => {
    const id = `tmp-${Date.now()}`;
    setModules((prev) => [
      ...prev,
      { id, title: "", order: prev.length + 1, lessons: [], _isNew: true },
    ]);
    setExpanded((prev) => ({ ...prev, [id]: true }));
  };

  const updateModuleTitle = (id, title) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title } : m))
    );
  };

  const toggleExpand = (moduleId) => {
    setExpanded((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
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
          .map((m, idx) => ({ ...m, order: idx + 1 }))
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

  // ---- Lessons ----
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
              content_type: type,
              order: nextOrder,
              content_url_or_text: "",
              duration_minutes: "",
              week: weekDefault, // UI-only
              uploadType: "url", // default
              file: null,
              _isNew: true,
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
    // UI remove only
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: (m.lessons || []).filter((l) => l.id !== lessonId) }
          : m
      )
    );

    // If it's an existing lesson (numeric id), also delete on server
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

  const validate = () => {
    for (const m of modules) {
      if (!m.title?.trim()) return "Module title is required";

      // Validate only new lessons
      for (const l of m.lessons || []) {
        if (!l._isNew) continue;

        if (!l.title?.trim()) return "Lesson title is required";

        if (l.uploadType === "file") {
          if (!l.file) return "Please upload a document file for the lesson";
        } else {
          if (!l.content_url_or_text) return "Lesson URL required";
        }
      }
    }
    return null;
  };

  const buildLessonFormData = (realModuleId, lesson) => {
    const fd = new FormData();
    fd.append("module", String(realModuleId)); // backend expects "module"
    fd.append("title", lesson.title || "");
    fd.append("content_type", lesson.content_type || "document");
    fd.append("order", String(lesson.order || 1));

    if (lesson.duration_minutes !== "" && lesson.duration_minutes != null) {
      fd.append("duration_minutes", String(lesson.duration_minutes));
    } else {
      fd.append("duration_minutes", "");
    }

    // If file upload
    if (lesson.uploadType === "file" && lesson.file) {
      fd.append("file", lesson.file);
      fd.append("content_url_or_text", "");
    } else {
      fd.append("content_url_or_text", lesson.content_url_or_text || "");
    }

    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const err = validate();
    if (err) return setErrorMessage(err);

    setLoading(true);

    try {
      // 1) Create/update modules, map local ids -> real numeric ids
      const moduleIdMap = new Map();

      for (const module of modules) {
        if (!module._isNew && typeof module.id === "number") {
          await courseService.putCourseModules(module.id, {
            module_id: module.id,
            title: module.title,
            order: module.order,
          });
          moduleIdMap.set(module.id, module.id);
        } else {
          const created = await courseService.postCourseModules({
            course_id: courseId,
            title: module.title,
            order: module.order,
          });

          const realId =
            created?.id ??
            created?.module?.id ??
            created?.data?.id ??
            created?.data?.module?.id;

          if (!realId) throw new Error("Module created but module id not returned");

          moduleIdMap.set(module.id, realId);
        }
      }

      // 2) Create new lessons (multipart/form-data)
      for (const module of modules) {
        const realModuleId = moduleIdMap.get(module.id);
        if (!realModuleId) continue;

        const newLessons = (module.lessons || []).filter((l) => l._isNew);

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

  // Week filter options (UI-only)
  const weeksOptions = useMemo(() => {
    const set = new Set([1]);
    modules.forEach((m) => (m.lessons || []).forEach((l) => set.add(l.week || 1)));
    return Array.from(set).sort((a, b) => a - b);
  }, [modules]);

  const groupLessonsByWeek = (lessons = []) => {
    const map = new Map();
    lessons.forEach((l) => {
      const w = Number(l.week) || 1;
      if (weekFilter !== "all" && w !== Number(weekFilter)) return;
      if (!map.has(w)) map.set(w, []);
      map.get(w).push(l);
    });
    const entries = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    return entries.map(([week, items]) => ({
      week,
      items: items.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="flex items-center justify-between max-w-6xl gap-4 px-6 py-4 mx-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl hover:bg-gray-50"
            type="button"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div className="items-center hidden gap-2 text-sm text-gray-500 md:flex">
            <span>Course</span>
            <span>›</span>
            <span className="font-semibold text-gray-900">Content</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl px-6 py-6 mx-auto">
        {/* Header */}
        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                Course Content
              </h1>
              <p className="mt-1 text-gray-600">
                {courseDetails?.title ||
                  "Build your course module-by-module and week-by-week."}
              </p>

              <div className="mt-4 space-y-2">
                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 text-red-700 border border-red-200 rounded-xl bg-red-50">
                    <AlertCircle size={18} className="mt-0.5" />
                    <div className="text-sm">{errorMessage}</div>
                  </div>
                )}
                {successMessage && (
                  <div className="p-3 text-sm text-green-700 border border-green-200 rounded-xl bg-green-50">
                    {successMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Week filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Week</label>
              <select
                className="px-3 py-2 bg-white border rounded-xl"
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value)}
              >
                <option value="all">All</option>
                {weeksOptions.map((w) => (
                  <option key={w} value={String(w)}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
            <StatCard title="Modules" value={totalModules} icon={FileText} />
            <StatCard title="Lessons" value={totalLessons} icon={Video} />
            <StatCard
              title="Weeks"
              value={Math.max(maxWeek, weeksOptions.length)}
              icon={ChevronDown}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Top actions */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-600">
              Tip: Use the Week dropdown to focus lessons week-by-week.
            </div>

            <button
              type="button"
              onClick={addModule}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-xl hover:bg-gray-50"
            >
              <Plus size={18} /> Add Module
            </button>
          </div>

          {/* Modules */}
          <div className="space-y-4">
            {modules.map((m, idx) => {
              const isOpen = !!expanded[m.id];
              const grouped = groupLessonsByWeek(m.lessons || []);

              return (
                <div
                  key={m.id}
                  className="overflow-hidden bg-white border shadow-sm rounded-2xl"
                >
                  {/* Module header */}
                  <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start w-full gap-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(m.id)}
                        className="p-2 mt-1 border rounded-xl hover:bg-gray-50"
                        aria-label="Toggle module"
                      >
                        <ChevronDown
                          size={18}
                          className={`transition ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="text-gray-700 border-gray-200 bg-gray-50">
                            Module {idx + 1}
                          </Pill>
                          <Pill className="text-indigo-700 border-indigo-200 bg-indigo-50">
                            Order {m.order}
                          </Pill>
                          {m._isNew ? (
                            <Pill className="bg-amber-50 text-amber-700 border-amber-200">
                              New
                            </Pill>
                          ) : (
                            <Pill className="text-green-700 border-green-200 bg-green-50">
                              Existing
                            </Pill>
                          )}
                        </div>

                        <input
                          className="w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder={`Module ${idx + 1} title`}
                          value={m.title}
                          onChange={(e) => updateModuleTitle(m.id, e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeModule(m.id)}
                        className="p-3 text-red-600 border rounded-xl hover:bg-red-50 disabled:opacity-50"
                        disabled={loading}
                        title="Delete module"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Module body */}
                  {isOpen && (
                    <div className="p-5 border-t bg-gray-50">
                      {/* Lesson actions */}
                      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-gray-600">
                          Add lessons and assign them to a Week.
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => addLesson(m.id, "video")}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-xl hover:bg-gray-50"
                          >
                            <Video size={16} /> Add Video
                          </button>

                          <button
                            type="button"
                            onClick={() => addLesson(m.id, "document")}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-xl hover:bg-gray-50"
                          >
                            <FileText size={16} /> Add Document
                          </button>
                        </div>
                      </div>

                      {grouped.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 bg-white border rounded-xl">
                          No lessons (or none in selected week).
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {grouped.map(({ week, items }) => (
                            <div
                              key={week}
                              className="overflow-hidden bg-white border rounded-2xl"
                            >
                              <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
                                <div className="font-semibold text-gray-900">
                                  Week {week}
                                </div>
                                <Pill className="text-gray-700 border-gray-200 bg-gray-50">
                                  {items.length} lesson{items.length > 1 ? "s" : ""}
                                </Pill>
                              </div>

                              <div className="p-4 space-y-3">
                                {items.map((l) => {
                                  const meta =
                                    lessonTypeMeta[l.content_type] || lessonTypeMeta.document;
                                  const Icon = meta.icon;

                                  return (
                                    <div
                                      key={l.id}
                                      className="p-4 transition bg-white border rounded-2xl hover:shadow-sm"
                                    >
                                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="flex-1">
                                          {/* Badges */}
                                          <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <Pill className={meta.badge}>
                                              <Icon size={14} />
                                              {meta.label}
                                            </Pill>
                                            <Pill className="text-gray-700 border-gray-200 bg-gray-50">
                                              Lesson {l.order ?? "-"}
                                            </Pill>
                                            {l._isNew ? (
                                              <Pill className="bg-amber-50 text-amber-700 border-amber-200">
                                                New
                                              </Pill>
                                            ) : null}
                                          </div>

                                          {/* Fields */}
                                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <div className="md:col-span-2">
                                              <label className="text-xs text-gray-500">
                                                Lesson title
                                              </label>
                                              <input
                                                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                placeholder="Lesson title"
                                                value={l.title}
                                                onChange={(e) =>
                                                  updateLesson(m.id, l.id, "title", e.target.value)
                                                }
                                              />
                                            </div>

                                            <div>
                                              <label className="text-xs text-gray-500">
                                                Week (UI only)
                                              </label>
                                              <input
                                                type="number"
                                                min={1}
                                                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                value={l.week || 1}
                                                onChange={(e) =>
                                                  updateLesson(
                                                    m.id,
                                                    l.id,
                                                    "week",
                                                    Number(e.target.value || 1)
                                                  )
                                                }
                                              />
                                            </div>

                                            {/* Upload switch */}
                                            <div className="md:col-span-3">
                                              <label className="text-xs text-gray-500">
                                                Content
                                              </label>
                                              <div className="flex flex-wrap gap-2 mt-2">
                                                <ToggleChip
                                                  active={l.uploadType === "url"}
                                                  icon={LinkIcon}
                                                  label="URL"
                                                  onClick={() => {
                                                    updateLesson(m.id, l.id, "uploadType", "url");
                                                    updateLesson(m.id, l.id, "file", null);
                                                  }}
                                                />
                                                <ToggleChip
                                                  active={l.uploadType === "file"}
                                                  icon={Upload}
                                                  label="Upload Document"
                                                  onClick={() => {
                                                    updateLesson(m.id, l.id, "uploadType", "file");
                                                    updateLesson(m.id, l.id, "content_url_or_text", "");
                                                  }}
                                                />
                                              </div>

                                              {/* URL input */}
                                              {l.uploadType === "url" ? (
                                                <input
                                                  className="w-full px-3 py-2 mt-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                  placeholder="https://... or text"
                                                  value={l.content_url_or_text}
                                                  onChange={(e) =>
                                                    updateLesson(
                                                      m.id,
                                                      l.id,
                                                      "content_url_or_text",
                                                      e.target.value
                                                    )
                                                  }
                                                />
                                              ) : (
                                                <div className="mt-3">
                                                  <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                                    className="w-full px-3 py-2 bg-white border rounded-xl"
                                                    onChange={(e) =>
                                                      onLessonFilePick(
                                                        m.id,
                                                        l.id,
                                                        e.target.files?.[0] || null
                                                      )
                                                    }
                                                  />
                                                  {l.file ? (
                                                    <p className="mt-2 text-xs text-gray-600">
                                                      Selected:{" "}
                                                      <span className="font-semibold">
                                                        {l.file.name}
                                                      </span>
                                                    </p>
                                                  ) : (
                                                    <p className="mt-2 text-xs text-gray-500">
                                                      Upload a PDF/DOC/DOCX/PPT file.
                                                    </p>
                                                  )}
                                                </div>
                                              )}
                                            </div>

                                            <div>
                                              <label className="text-xs text-gray-500">
                                                Duration (min)
                                              </label>
                                              <input
                                                type="number"
                                                min={0}
                                                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                placeholder="e.g. 15"
                                                value={l.duration_minutes}
                                                onChange={(e) =>
                                                  updateLesson(
                                                    m.id,
                                                    l.id,
                                                    "duration_minutes",
                                                    e.target.value
                                                  )
                                                }
                                              />
                                            </div>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => removeLesson(m.id, l.id)}
                                          className="inline-flex items-center self-start justify-center gap-2 px-3 py-2 text-red-600 border rounded-xl hover:bg-red-50"
                                        >
                                          <Trash2 size={16} /> Remove
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 text-xs text-gray-500">
                        Quick tip: Next suggested week is{" "}
                        <span className="font-semibold">Week {nextWeekHint}</span>.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spacer for sticky footer */}
          <div className="h-20" />
        </form>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex items-center justify-between max-w-6xl gap-3 px-6 py-4 mx-auto">
          <div className="text-sm text-gray-600">
            {loading
              ? "Saving changes..."
              : "Click Save to persist modules + lessons (URL or uploaded document)."}
          </div>

          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-white bg-green-600 rounded-2xl hover:bg-green-700 disabled:opacity-60"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWeeklyContent;
