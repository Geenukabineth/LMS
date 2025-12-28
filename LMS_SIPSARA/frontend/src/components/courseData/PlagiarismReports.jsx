

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  X,
  FileText,
  Link as LinkIcon,
  User,
  Clock,
  Globe,
  Laptop,
  ShieldCheck,
  ShieldX,
  MessageSquare,
  Gavel,
  CheckCircle2,
  Ban,
  Download,
  Copy,
} from "lucide-react";

// -----------------------------
// API PLACEHOLDERS (replace)
// -----------------------------
async function apiListReports() {
  // return fetch("/api/integrity/reports").then(r=>r.json())
  await new Promise((r) => setTimeout(r, 200));
  return MOCK_REPORTS;
}

async function apiUpdateReportAction(reportId, payload) {
  // return fetch(`/api/integrity/reports/${reportId}/action`, { method:"POST", body: JSON.stringify(payload) })
  await new Promise((r) => setTimeout(r, 250));
  return { ok: true };
}

// -----------------------------
// Helpers
// -----------------------------
const riskBadge = (risk) => {
  if (risk === "High")
    return "bg-red-50 text-red-700 border-red-200";
  if (risk === "Review")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-green-50 text-green-700 border-green-200";
};

const Pill = ({ className = "", children }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${className}`}
  >
    {children}
  </span>
);

const Button = ({
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-white hover:bg-gray-50 border-gray-200 text-gray-800",
    primary:
      "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-sm",
    danger:
      "bg-red-600 hover:bg-red-700 border-red-600 text-white shadow-sm",
    success:
      "bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-sm",
    ghost: "bg-transparent hover:bg-gray-50 border-transparent text-gray-700",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

function formatDT(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// highlight segments in text: segments = [{start,end}] (character indices)
function renderHighlightedText(text, segments = []) {
  if (!text) return <span className="text-gray-400">No text available</span>;
  const safeSegs = [...segments]
    .filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end))
    .map((s) => ({ start: clamp(s.start, 0, text.length), end: clamp(s.end, 0, text.length) }))
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);

  if (safeSegs.length === 0) return <span className="whitespace-pre-wrap">{text}</span>;

  const parts = [];
  let cursor = 0;
  safeSegs.forEach((seg, idx) => {
    if (seg.start > cursor) {
      parts.push({
        key: `n-${idx}`,
        type: "normal",
        value: text.slice(cursor, seg.start),
      });
    }
    parts.push({
      key: `h-${idx}`,
      type: "highlight",
      value: text.slice(seg.start, seg.end),
    });
    cursor = seg.end;
  });
  if (cursor < text.length) {
    parts.push({
      key: `tail`,
      type: "normal",
      value: text.slice(cursor),
    });
  }

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p) =>
        p.type === "highlight" ? (
          <mark
            key={p.key}
            className="bg-yellow-200/70 px-0.5 rounded-sm"
          >
            {p.value}
          </mark>
        ) : (
          <span key={p.key}>{p.value}</span>
        )
      )}
    </span>
  );
}

// -----------------------------
// Main Component
// -----------------------------
export default function PlagiarismReports() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All"); // All | High | Review | Low
  const [type, setType] = useState("All"); // All | Assignment | Quiz | Exam
  const [sort, setSort] = useState("Newest"); // Newest | HighestScore | Course
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiListReports();
        setReports(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = [...reports];

    if (risk !== "All") list = list.filter((r) => r.riskLevel === risk);
    if (type !== "All") list = list.filter((r) => r.assessmentType === type);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        return (
          r.courseTitle.toLowerCase().includes(q) ||
          r.courseCode.toLowerCase().includes(q) ||
          r.assessmentTitle.toLowerCase().includes(q) ||
          r.student.name.toLowerCase().includes(q) ||
          r.student.id.toLowerCase().includes(q) ||
          (r.status || "Open").toLowerCase().includes(q)
        );
      });
    }

    if (sort === "Newest") {
      list.sort((a, b) => new Date(b.flaggedAt) - new Date(a.flaggedAt));
    } else if (sort === "HighestScore") {
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sort === "Course") {
      list.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
    }
    return list;
  }, [reports, query, risk, type, sort]);

  const stats = useMemo(() => {
    const total = reports.length;
    const high = reports.filter((r) => r.riskLevel === "High").length;
    const review = reports.filter((r) => r.riskLevel === "Review").length;
    const open = reports.filter((r) => (r.status || "Open") === "Open").length;
    return { total, high, review, open };
  }, [reports]);

  const openReport = (r) => setSelected(r);

  const updateAction = async (action, payload = {}) => {
    if (!selected) return;
    const reportId = selected.id;

    try {
      await apiUpdateReportAction(reportId, { action, ...payload });
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: action === "dismiss" ? "Dismissed" : action === "misconduct" ? "Misconduct" : r.status,
                instructorAction: { action, payload, at: new Date().toISOString() },
              }
            : r
        )
      );
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              status: action === "dismiss" ? "Dismissed" : action === "misconduct" ? "Misconduct" : prev.status,
              instructorAction: { action, payload, at: new Date().toISOString() },
            }
          : prev
      );
      setToast({ kind: "success", text: "Action saved" });
      setTimeout(() => setToast(null), 2200);
    } catch (e) {
      setToast({ kind: "error", text: "Failed to save action" });
      setTimeout(() => setToast(null), 2200);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed z-50 top-4 right-4">
          <div
            className={`px-4 py-3 rounded-xl border shadow-sm bg-white ${
              toast.kind === "success"
                ? "border-green-200"
                : "border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.kind === "success" ? (
                <CheckCircle2 className="text-green-600" size={18} />
              ) : (
                <AlertTriangle className="text-red-600" size={18} />
              )}
              <span className="text-sm text-gray-800">{toast.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="flex items-start justify-between gap-4 px-6 py-4 mx-auto max-w-7xl">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <AlertTriangle className="text-amber-600" />
              Integrity Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Plagiarism / cheating alerts with evidence and instructor actions
            </p>
          </div>

          <div className="flex gap-2">
            
            <Button
              variant="default"
              onClick={() => {
                // Replace with actual export endpoint
                setToast({ kind: "success", text: "Export triggered (hook API)" });
                setTimeout(() => setToast(null), 1600);
              }}
            >
              <Download size={16} /> Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 mx-auto max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
          <StatCard title="Total Reports" value={stats.total} icon={FileText} />
          <StatCard title="Open" value={stats.open} icon={AlertTriangle} />
          <StatCard title="High Risk" value={stats.high} icon={Ban} />
          <StatCard title="Review" value={stats.review} icon={Filter} />
        </div>

        {/* Controls */}
        <div className="p-4 mb-4 bg-white border shadow-sm rounded-2xl">
          <div className="grid items-center grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-xl">
                <Search size={18} className="text-gray-500" />
                <input
                  className="w-full text-sm outline-none"
                  placeholder="Search by course, assessment, student, status..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <select
                className="w-full px-3 py-2 text-sm bg-white border rounded-xl"
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
              >
                <option>All</option>
                <option>High</option>
                <option>Review</option>
                <option>Low</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                className="w-full px-3 py-2 text-sm bg-white border rounded-xl"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>All</option>
                <option>Assignment</option>
                <option>Quiz</option>
                <option>Exam</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                className="w-full px-3 py-2 text-sm bg-white border rounded-xl"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="Newest">Newest</option>
                <option value="HighestScore">Highest score</option>
                <option value="Course">Course</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="overflow-hidden bg-white border shadow-sm rounded-2xl">
          <div className="px-5 py-3 text-sm text-gray-600 border-b bg-gray-50">
            {loading ? "Loading reports..." : `${filtered.length} report(s)`}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              No reports match your filters.
            </div>
          )}

          <div className="divide-y">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => openReport(r)}
                className="w-full px-5 py-4 text-left transition hover:bg-gray-50"
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill className={riskBadge(r.riskLevel)}>
                        <AlertTriangle size={14} />
                        {r.riskLevel} • {r.score}/100
                      </Pill>

                      <Pill className="text-gray-700 border-gray-200 bg-gray-50">
                        {r.assessmentType}
                      </Pill>

                      <Pill className="text-blue-700 border-blue-200 bg-blue-50">
                        {r.courseCode}
                      </Pill>

                      <Pill className="text-purple-700 border-purple-200 bg-purple-50">
                        {r.status || "Open"}
                      </Pill>
                    </div>

                    <div className="mt-2 font-semibold text-gray-900 truncate">
                      {r.assessmentTitle}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <User size={14} />
                        {r.student.name} ({r.student.id})
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={14} />
                        Flagged {formatDT(r.flaggedAt)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="mt-1 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <ReportDrawer
          report={selected}
          onClose={() => setSelected(null)}
          onDismiss={() => updateAction("dismiss")}
          onClarify={(message) => updateAction("clarify", { message })}
          onMisconduct={(notes) => updateAction("misconduct", { notes })}
          onPenalty={(penalty) => updateAction("penalty", penalty)}
        />
      )}
    </div>
  );
}

// -----------------------------
// Drawer (Report Detail)
// -----------------------------
function ReportDrawer({
  report,
  onClose,
  onDismiss,
  onClarify,
  onMisconduct,
  onPenalty,
}) {
  const [tab, setTab] = useState("Evidence"); // Evidence | TextCompare | Actions
  const [clarifyMsg, setClarifyMsg] = useState(
    "Hi, please explain your sources and provide drafts/notes for this submission."
  );
  const [misconductNotes, setMisconductNotes] = useState(
    "High confidence plagiarism based on similarity evidence. Marked as misconduct."
  );
  const [penalty, setPenalty] = useState({
    grade: "0",
    allowResubmit: false,
    note: "Penalty applied due to academic misconduct.",
  });

  const internalTop = report.evidence.internalMatches?.[0];
  const externalTop = report.evidence.externalSources?.[0];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full md:w-[780px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-5 bg-white border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Pill className={riskBadge(report.riskLevel)}>
                  <AlertTriangle size={14} />
                  {report.riskLevel} • {report.score}/100
                </Pill>

                <Pill className="text-gray-700 border-gray-200 bg-gray-50">
                  {report.assessmentType}
                </Pill>

                <Pill className="text-blue-700 border-blue-200 bg-blue-50">
                  {report.courseCode}
                </Pill>

                <Pill className="text-purple-700 border-purple-200 bg-purple-50">
                  {report.status || "Open"}
                </Pill>
              </div>

              <h2 className="mt-2 text-lg font-bold text-gray-900 truncate">
                {report.assessmentTitle}
              </h2>

              <p className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <User size={14} />
                  {report.student.name} ({report.student.id})
                </span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} />
                  Submitted {formatDT(report.submittedAt)}
                </span>
              </p>
            </div>

            <Button variant="ghost" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {["Evidence", "TextCompare", "Actions"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                  tab === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-auto bg-gray-50">
          {tab === "Evidence" && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoCard
                  icon={ShieldCheck}
                  title="Top Internal Match"
                  subtitle={
                    internalTop
                      ? `${internalTop.matchStudentId} • ${internalTop.similarityPercent}%`
                      : "None"
                  }
                  body={
                    internalTop
                      ? `${internalTop.overlapWords} words across ${internalTop.segments} segments`
                      : "No internal match detected."
                  }
                />

                <InfoCard
                  icon={Globe}
                  title="Top External Source"
                  subtitle={
                    externalTop
                      ? `${externalTop.domain} • ${externalTop.similarityPercent}%`
                      : "None"
                  }
                  body={
                    externalTop
                      ? externalTop.url
                      : "No external source detected (or disabled)."
                  }
                />
              </div>

              {/* Internal Matches */}
              <Section title="Internal matches (other students)">
                {report.evidence.internalMatches?.length ? (
                  <div className="space-y-2">
                    {report.evidence.internalMatches.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white border rounded-2xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-900">
                            Student {m.matchStudentId}
                          </div>
                          <Pill className="bg-amber-50 text-amber-700 border-amber-200">
                            {m.similarityPercent}%
                          </Pill>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          Overlap: {m.overlapWords} words • Segments: {m.segments}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyLine text="No internal matches." />
                )}
              </Section>

              {/* External Sources */}
              <Section title="External sources">
                {report.evidence.externalSources?.length ? (
                  <div className="space-y-2">
                    {report.evidence.externalSources.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white border rounded-2xl"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {s.domain}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                              <LinkIcon size={14} className="text-gray-400" />
                              <span className="truncate">{s.url}</span>
                            </div>
                          </div>

                          <Pill className="bg-amber-50 text-amber-700 border-amber-200">
                            {s.similarityPercent}%
                          </Pill>
                        </div>

                        {s.excerpts?.length ? (
                          <div className="mt-3 space-y-2">
                            {s.excerpts.map((ex, i) => (
                              <div
                                key={i}
                                className="p-3 text-sm text-gray-700 border bg-gray-50 rounded-xl"
                              >
                                “{ex}”
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyLine text="No external sources." />
                )}
              </Section>

              {/* Metadata */}
              <Section title="Submission metadata">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <MetaRow icon={Clock} label="Start" value={formatDT(report.metadata.startAt)} />
                  <MetaRow icon={Clock} label="Submit" value={formatDT(report.metadata.submitAt)} />
                  <MetaRow icon={Laptop} label="Device" value={report.metadata.deviceId || "—"} />
                  <MetaRow icon={Globe} label="IP Address" value={report.metadata.ip || "—"} />
                  <MetaRow icon={User} label="Browser/OS" value={report.metadata.userAgent || "—"} />
                </div>
              </Section>

              {/* Copied blocks */}
              <Section title="Copied blocks">
                <div className="p-4 bg-white border rounded-2xl">
                  <p className="text-sm text-gray-700">
                    Largest continuous match:{" "}
                    <span className="font-semibold">
                      {report.evidence.largestMatchChars} chars
                    </span>{" "}
                    (~{report.evidence.largestMatchApproxWords} words)
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Sections involved: {report.evidence.sectionsInvolved?.join(", ") || "—"}
                  </p>
                </div>
              </Section>
            </div>
          )}

          {tab === "TextCompare" && (
            <div className="space-y-4">
              <Section title="Student submission (highlighted)">
                <div className="p-4 text-sm text-gray-800 bg-white border rounded-2xl">
                  {renderHighlightedText(
                    report.text.studentText,
                    report.text.studentHighlights
                  )}
                </div>
              </Section>

              <Section title="Top match (highlighted)">
                <div className="p-4 text-sm text-gray-800 bg-white border rounded-2xl">
                  {renderHighlightedText(
                    report.text.matchText,
                    report.text.matchHighlights
                  )}
                </div>
              </Section>

              <div className="p-4 bg-white border rounded-2xl">
                <p className="text-sm text-gray-700">
                  Tip: You can copy these sections into your academic integrity
                  records.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="default"
                    onClick={() => navigator.clipboard?.writeText(report.text.studentText)}
                  >
                    <Copy size={16} /> Copy student text
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => navigator.clipboard?.writeText(report.text.matchText)}
                  >
                    <Copy size={16} /> Copy match text
                  </Button>
                </div>
              </div>
            </div>
          )}

          {tab === "Actions" && (
            <div className="space-y-4">
              <Section title="Instructor actions">
                <div className="p-4 space-y-3 bg-white border rounded-2xl">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="success" onClick={onDismiss}>
                      <ShieldX size={16} /> Dismiss flag
                    </Button>

                    <Button
                      variant="primary"
                      onClick={() => onClarify(clarifyMsg)}
                    >
                      <MessageSquare size={16} /> Request clarification
                    </Button>

                    <Button
                      variant="danger"
                      onClick={() => onMisconduct(misconductNotes)}
                    >
                      <Gavel size={16} /> Mark misconduct
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-2 md:grid-cols-2">
                    <div className="p-3 border bg-gray-50 rounded-2xl">
                      <label className="text-xs text-gray-500">
                        Clarification message to student
                      </label>
                      <textarea
                        className="w-full px-3 py-2 mt-2 text-sm bg-white border outline-none rounded-xl"
                        rows={5}
                        value={clarifyMsg}
                        onChange={(e) => setClarifyMsg(e.target.value)}
                      />
                    </div>

                    <div className="p-3 border bg-gray-50 rounded-2xl">
                      <label className="text-xs text-gray-500">
                        Misconduct notes (internal)
                      </label>
                      <textarea
                        className="w-full px-3 py-2 mt-2 text-sm bg-white border outline-none rounded-xl"
                        rows={5}
                        value={misconductNotes}
                        onChange={(e) => setMisconductNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Apply penalty">
                <div className="p-4 space-y-3 bg-white border rounded-2xl">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-xs text-gray-500">Grade</label>
                      <input
                        className="w-full px-3 py-2 mt-2 text-sm border outline-none rounded-xl"
                        value={penalty.grade}
                        onChange={(e) =>
                          setPenalty((p) => ({ ...p, grade: e.target.value }))
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-6 md:mt-0">
                      <input
                        id="resubmit"
                        type="checkbox"
                        checked={penalty.allowResubmit}
                        onChange={(e) =>
                          setPenalty((p) => ({
                            ...p,
                            allowResubmit: e.target.checked,
                          }))
                        }
                      />
                      <label htmlFor="resubmit" className="text-sm text-gray-700">
                        Allow resubmission
                      </label>
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500">Note</label>
                      <textarea
                        className="w-full px-3 py-2 mt-2 text-sm bg-white border outline-none rounded-xl"
                        rows={3}
                        value={penalty.note}
                        onChange={(e) =>
                          setPenalty((p) => ({ ...p, note: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <Button variant="danger" onClick={() => onPenalty(penalty)}>
                    <Ban size={16} /> Save penalty
                  </Button>
                </div>
              </Section>

              <Section title="Status">
                <div className="p-4 text-sm text-gray-700 bg-white border rounded-2xl">
                  <p>
                    Current status:{" "}
                    <span className="font-semibold">{report.status || "Open"}</span>
                  </p>
                  {report.instructorAction?.action ? (
                    <p className="mt-2 text-gray-600">
                      Last action:{" "}
                      <span className="font-semibold">
                        {report.instructorAction.action}
                      </span>{" "}
                      at {formatDT(report.instructorAction.at)}
                    </p>
                  ) : (
                    <p className="mt-2 text-gray-600">No instructor action recorded yet.</p>
                  )}
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-white border-t">
          <div className="text-xs text-gray-500">
            Report ID: <span className="font-mono">{report.id}</span>
          </div>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Small UI blocks
// -----------------------------
function StatCard({ title, value, icon: Icon }) {
  return (
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
}

function Section({ title, children }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-gray-900">{title}</div>
      {children}
    </div>
  );
}

function InfoCard({ icon: Icon, title, subtitle, body }) {
  return (
    <div className="p-4 bg-white border shadow-sm rounded-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 font-semibold text-gray-900 truncate">{subtitle}</p>
          <p className="mt-2 text-sm text-gray-600 break-words">{body}</p>
        </div>
        <div className="p-3 text-gray-700 rounded-xl bg-gray-50">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white border rounded-2xl">
      <div className="p-2 text-gray-700 rounded-xl bg-gray-50">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyLine({ text }) {
  return (
    <div className="p-4 text-sm text-gray-500 bg-white border rounded-2xl">
      {text}
    </div>
  );
}

// -----------------------------
// MOCK DATA (remove in production)
// -----------------------------
const MOCK_REPORTS = [
  {
    id: "rep_1001",
    courseCode: "CS101",
    courseTitle: "Intro to Programming",
    assessmentType: "Assignment",
    assessmentTitle: "Assignment 2: Arrays & Loops",
    student: { id: "STU-0192", name: "Nimal Perera" },
    submittedAt: "2025-12-26T08:40:00.000Z",
    flaggedAt: "2025-12-26T09:02:00.000Z",
    riskLevel: "High",
    score: 86,
    status: "Open",
    evidence: {
      internalMatches: [
        {
          matchStudentId: "STU-0201",
          similarityPercent: 91,
          overlapWords: 612,
          segments: 8,
        },
        {
          matchStudentId: "STU-0177",
          similarityPercent: 73,
          overlapWords: 305,
          segments: 4,
        },
      ],
      externalSources: [
        {
          domain: "exampleblog.com",
          url: "https://exampleblog.com/arrays-loops-solution",
          similarityPercent: 64,
          excerpts: [
            "Use a for-loop to traverse the array and accumulate the sum.",
            "Initialize the counter and update inside the loop.",
          ],
        },
      ],
      largestMatchChars: 1820,
      largestMatchApproxWords: 310,
      sectionsInvolved: ["Solution Part A", "Solution Part C"],
    },
    metadata: {
      startAt: "2025-12-26T07:55:00.000Z",
      submitAt: "2025-12-26T08:40:00.000Z",
      ip: "203.94.12.88",
      deviceId: "dev_aa7f19",
      userAgent: "Chrome 121 / Windows 11",
    },
    text: {
      studentText:
        "In this solution, we traverse the array and accumulate the sum...\n\nWe initialize counter i to 0 and while i < n we add arr[i] to sum...",
      matchText:
        "To solve this, traverse the array and accumulate the sum...\n\nInitialize i = 0 and while i < n add a[i] into sum...",
      studentHighlights: [
        { start: 3, end: 78 },
        { start: 94, end: 160 },
      ],
      matchHighlights: [
        { start: 0, end: 72 },
        { start: 86, end: 154 },
      ],
    },
  },
  {
    id: "rep_1002",
    courseCode: "ENG210",
    courseTitle: "Academic Writing",
    assessmentType: "Assignment",
    assessmentTitle: "Essay Draft 1",
    student: { id: "STU-0314", name: "Bineth G." },
    submittedAt: "2025-12-25T15:10:00.000Z",
    flaggedAt: "2025-12-25T15:25:00.000Z",
    riskLevel: "Review",
    score: 58,
    status: "Open",
    evidence: {
      internalMatches: [],
      externalSources: [
        {
          domain: "wikipedia.org",
          url: "https://en.wikipedia.org/wiki/Some_topic",
          similarityPercent: 45,
          excerpts: ["The concept refers to ...", "It is widely used in ..."],
        },
      ],
      largestMatchChars: 640,
      largestMatchApproxWords: 110,
      sectionsInvolved: ["Background section"],
    },
    metadata: {
      startAt: "2025-12-25T14:20:00.000Z",
      submitAt: "2025-12-25T15:10:00.000Z",
      ip: "112.134.201.10",
      deviceId: "dev_bb02a3",
      userAgent: "Edge / macOS",
    },
    text: {
      studentText:
        "Background: The concept refers to ... (student paraphrase)\n\nThis idea is widely used...",
      matchText:
        "The concept refers to ...\n\nIt is widely used in multiple fields...",
      studentHighlights: [{ start: 12, end: 58 }],
      matchHighlights: [{ start: 0, end: 45 }],
    },
  },
  {
    id: "rep_1003",
    courseCode: "MATH120",
    courseTitle: "Discrete Math",
    assessmentType: "Quiz",
    assessmentTitle: "Quiz 4: Sets",
    student: { id: "STU-0089", name: "Kavindu Silva" },
    submittedAt: "2025-12-24T10:05:00.000Z",
    flaggedAt: "2025-12-24T10:08:00.000Z",
    riskLevel: "Low",
    score: 22,
    status: "Open",
    evidence: {
      internalMatches: [
        {
          matchStudentId: "STU-0091",
          similarityPercent: 34,
          overlapWords: 0,
          segments: 0,
        },
      ],
      externalSources: [],
      largestMatchChars: 0,
      largestMatchApproxWords: 0,
      sectionsInvolved: ["Answer pattern similarity"],
    },
    metadata: {
      startAt: "2025-12-24T10:00:00.000Z",
      submitAt: "2025-12-24T10:05:00.000Z",
      ip: "203.94.12.88",
      deviceId: "dev_aa7f19",
      userAgent: "Chrome / Android",
    },
    text: {
      studentText: "Quiz answers: A, C, B, D, A...",
      matchText: "Comparison answers: A, C, B, D, A...",
      studentHighlights: [{ start: 14, end: 28 }],
      matchHighlights: [{ start: 20, end: 34 }],
    },
  },
];
