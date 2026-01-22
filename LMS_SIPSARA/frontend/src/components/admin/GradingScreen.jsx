// components/admin/GradingScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, ChevronLeft, AlertCircle, Loader, UserRound } from "lucide-react";
import { courseService } from "@/config/course.config";

// Charts (Recharts)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from "recharts";

const GradingScreen = () => {
  const { courseId: courseIdFromUrl } = useParams(); 
  const navigate = useNavigate();

  // UI
  const [searchTerm, setSearchTerm] = useState("");

  // Data
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [gradebook, setGradebook] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------- Fetch course list once ----------
  useEffect(() => {
    const loadCourseList = async () => {
      try {
        setLoading(true);
        setError(null);

        const list = await courseService.getCoursesteacher();
        const safe = Array.isArray(list) ? list : [];
        setCourses(safe);

        const urlId =
          courseIdFromUrl && courseIdFromUrl !== "undefined" ? String(courseIdFromUrl) : "";
        const urlExists = urlId && safe.some((c) => String(c.id) === urlId);

        const initialId = urlExists ? urlId : safe[0]?.id ? String(safe[0].id) : "";
        setSelectedCourseId(initialId);
      } catch (err) {
        console.error(err);
        setError("Failed to load your courses.");
      } finally {
        setLoading(false);
      }
    };

    loadCourseList();
  }, [courseIdFromUrl]);

  // ---------- Fetch gradebook when course changes ----------
  useEffect(() => {
    const loadGradebook = async (id) => {
      if (!id) {
        setGradebook(null);
        setSelectedStudentId("");
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const data = await courseService.getTeacherGradebook(id);
        setGradebook(data);

        // default student
        const firstStudentId = data?.rows?.[0]?.student?.id ? String(data.rows[0].student.id) : "";
        setSelectedStudentId(firstStudentId);
      } catch (err) {
        console.error(err);
        setError("Failed to load student results.");
      } finally {
        setLoading(false);
      }
    };

    loadGradebook(selectedCourseId);
  }, [selectedCourseId]);

  // ---------- Derived: filtered student list ----------
  const filteredStudents = useMemo(() => {
    if (!gradebook?.rows) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return gradebook.rows;

    return gradebook.rows.filter(
      (row) =>
        row.student.name.toLowerCase().includes(q) ||
        row.student.email.toLowerCase().includes(q)
    );
  }, [gradebook, searchTerm]);

  // Keep selected student valid when filtering changes
  useEffect(() => {
    if (!gradebook?.rows?.length) return;

    const existsInAll = gradebook.rows.some((r) => String(r.student.id) === String(selectedStudentId));
    if (!existsInAll) {
      const first = gradebook.rows[0]?.student?.id ? String(gradebook.rows[0].student.id) : "";
      setSelectedStudentId(first);
      return;
    }

    // If user filtered and selection disappears, pick first filtered
    const existsInFiltered = filteredStudents.some((r) => String(r.student.id) === String(selectedStudentId));
    if (!existsInFiltered && filteredStudents[0]?.student?.id) {
      setSelectedStudentId(String(filteredStudents[0].student.id));
    }
  }, [gradebook, filteredStudents, selectedStudentId]);

  // ---------- Selected student row ----------
  const selectedStudentRow = useMemo(() => {
    if (!gradebook?.rows?.length || !selectedStudentId) return null;
    return gradebook.rows.find((r) => String(r.student.id) === String(selectedStudentId)) || null;
  }, [gradebook, selectedStudentId]);

  // ---------- Per-student analytics ----------
  const studentAnalytics = useMemo(() => {
    const columns = gradebook?.columns || [];
    const row = selectedStudentRow;

    if (!row) {
      return {
        chartData: [],
        overallAvgPct: 0,
        completed: 0,
        missing: columns.length,
        best: null,
        worst: null
      };
    }

    const chartData = columns.map((col) => {
      const max = Number(col.max) || 0;
      const raw = row?.grades?.[col.id];
      const has = raw !== null && raw !== undefined && max > 0;
      const score = has ? Number(raw) : null;
      const pct = has ? (Number(raw) / max) * 100 : null;

      return {
        id: col.id,
        name: col.title?.length > 14 ? `${col.title.slice(0, 14)}…` : col.title,
        fullTitle: col.title,
        type: col.type,
        max,
        score: score === null ? null : Number(score.toFixed(2)),
        pct: pct === null ? null : Number(pct.toFixed(1))
      };
    });

    const graded = chartData.filter((d) => d.pct !== null && Number.isFinite(d.pct));
    const completed = graded.length;
    const missing = columns.length - completed;

    const overallAvgPct = completed ? graded.reduce((a, b) => a + b.pct, 0) / completed : 0;

    const best = completed ? graded.reduce((a, b) => (b.pct > a.pct ? b : a), graded[0]) : null;
    const worst = completed ? graded.reduce((a, b) => (b.pct < a.pct ? b : a), graded[0]) : null;

    return {
      chartData,
      overallAvgPct: Number(overallAvgPct.toFixed(1)),
      completed,
      missing,
      best,
      worst
    };
  }, [gradebook, selectedStudentRow]);

  // ---------- UI helpers ----------
  const KPI = ({ label, value, sub }) => (
    // ✅ ADDED: Colored left border
    <div className="p-5 bg-white border border-l-4 border-gray-200 shadow-sm border-l-orange-500 rounded-xl">
      <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-gray-500">{sub}</p> : null}
    </div>
  );

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload;
    return (
      <div className="p-3 text-sm bg-white border border-gray-200 shadow rounded-xl">
        <p className="font-bold text-gray-900">{p?.fullTitle || "-"}</p>
        <p className="text-gray-600">
          Score:{" "}
          <span className="font-semibold">
            {p?.score === null ? "-" : `${p.score}/${p.max}`}
          </span>
        </p>
        <p className="text-gray-600">
          Percent: <span className="font-semibold text-orange-600">{p?.pct === null ? "-" : `${p.pct}%`}</span>
        </p>
      </div>
    );
  };

  // ---------- Loading / Error ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p>{error}</p>
        <button onClick={() => navigate("/teacher")} className="mt-4 text-orange-600 hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="mx-auto max-w-[95%]">
        {/* Header */}
        <div className="flex flex-col gap-4 p-6 mb-6 text-white rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold uppercase">Student Analytics</h1>
            </div>
          </div>

          {/* Course dropdown */}
          <div className="flex flex-col gap-2 min-w-[280px]">
            <label className="text-xs font-bold tracking-wide uppercase text-white/90">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2 text-sm font-semibold text-gray-900 bg-white border rounded-lg outline-none border-white/30 focus:ring-2 focus:ring-white/60"
            >
              {courses.length === 0 ? (
                <option value="">No courses available</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Search + Student dropdown */}
        {!selectedCourseId ? (
          <div className="p-10 text-center bg-white border border-dashed rounded-xl">
            <p className="text-gray-500">Select a course to load students.</p>
          </div>
        ) : !gradebook ? (
          <div className="p-10 text-center bg-white border border-dashed rounded-xl">
            <p className="text-gray-500">No gradebook data found for this course.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-3">
              {/* ✅ FIXED: Added transform & Color to Icon */}
              <div className="relative lg:col-span-2">
                  
                  <input
                    type="text"
                    placeholder="Search student by name or email..."
                    className="w-full py-3 pl-10 pr-4 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

              <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                <label className="block mb-1 text-xs font-bold tracking-wide text-gray-500 uppercase">
                  Select Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {filteredStudents.length === 0 ? (
                    <option value="">No students match your search</option>
                  ) : (
                    filteredStudents.map((r) => (
                      <option key={r.student.id} value={String(r.student.id)}>
                        {r.student.name} — {r.student.email}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* KPIs (analysis list) */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">
              <KPI
                label="Student"
                value={selectedStudentRow?.student?.name || "-"}
                sub={selectedStudentRow?.student?.email || ""}
              />
              <KPI
                label="Overall Average"
                value={`${studentAnalytics.overallAvgPct}%`}
                sub="Average of completed assessments"
              />
              <KPI
                label="Completed"
                value={`${studentAnalytics.completed}`}
                sub={`Out of ${gradebook.columns.length} assessments`}
              />
              <KPI
                label="Missing"
                value={`${studentAnalytics.missing}`}
                sub="Not graded / not submitted"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Bar chart */}
              <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
                      <UserRound size={18} className="text-orange-500" /> Bar Chart (Score %)
                    </h3>
                    <p className="text-sm text-gray-500">Student performance percentage per assessment</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    Best:{" "}
                    <span className="font-semibold text-green-600">
                      {studentAnalytics.best ? `${studentAnalytics.best.fullTitle} (${studentAnalytics.best.pct}%)` : "-"}
                    </span>
                    <br />
                    Worst:{" "}
                    <span className="font-semibold text-red-600">
                      {studentAnalytics.worst ? `${studentAnalytics.worst.fullTitle} (${studentAnalytics.worst.pct}%)` : "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={studentAnalytics.chartData.filter((d) => d.pct !== null)}
                      margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" interval={0} angle={-10} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<CustomTooltip />} />
                      {/* ✅ ADDED: Orange Fill Color */}
                      <Bar dataKey="pct" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {studentAnalytics.completed === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No graded assessments for this student yet.</p>
                ) : null}
              </div>

              {/* Spider/Radar chart */}
              <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Student Breakdown</h3>
                  <p className="text-sm text-gray-500">Spider chart (radar) for the student</p>
                </div>

                <div className="mt-4 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={studentAnalytics.chartData.filter((d) => d.pct !== null)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      {/* ✅ ADDED: Orange Stroke & Fill */}
                      <Radar 
                        dataKey="pct" 
                        stroke="#ea580c" 
                        fill="#f97316" 
                        fillOpacity={0.5} 
                      />
                      <Legend />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {studentAnalytics.completed === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No graded assessments for this student yet.</p>
                ) : null}
              </div>
            </div>

            {/* Student Breakdown table */}
            <div className="p-6 mt-6 bg-white border border-gray-200 shadow-sm rounded-xl">
              <h4 className="text-sm font-extrabold tracking-wide text-gray-700 uppercase">
                Student Breakdown
              </h4>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  {/* ✅ ADDED: Colored Header */}
                  <thead className="bg-orange-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-bold text-left text-gray-600 uppercase">
                        Assessment
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-center text-gray-600 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-center text-gray-600 uppercase">
                        Score
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-center text-gray-600 uppercase">
                        %
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {studentAnalytics.chartData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-sm text-center text-gray-500">
                          No assessments found.
                        </td>
                      </tr>
                    ) : (
                      studentAnalytics.chartData.map((d) => {
                        const scoreText = d.score === null ? "-" : `${d.score}/${d.max}`;
                        const pctText = d.pct === null ? "-" : `${d.pct}%`;

                        return (
                          <tr key={d.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {d.fullTitle}
                            </td>

                            <td className="px-4 py-4 text-sm text-center text-gray-700">
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${d.type === 'Quiz' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {d.type || "-"}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-sm text-center text-gray-700">
                              {scoreText}
                            </td>

                            <td className="px-4 py-4 text-sm font-bold text-center text-gray-700">
                              {pctText}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GradingScreen;