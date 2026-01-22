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
  Eye,
  Send,
  Save,
  Lock // ✅ Added Lock icon
} from "lucide-react";

import { courseService } from "@/config/course.config"; 

// -----------------------------
// Helpers
// -----------------------------
const riskBadge = (risk) => {
  if (risk === "High") return "bg-red-50 text-red-700 border-red-200";
  if (risk === "Review") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-green-50 text-green-700 border-green-200";
};

const Pill = ({ className = "", children }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${className}`}>
    {children}
  </span>
);

const Button = ({ variant = "default", className = "", children, ...props }) => {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-white hover:bg-gray-50 border-gray-200 text-gray-800",
    primary: "bg-orange-600 hover:bg-orange-700 border-orange-600 text-white shadow-sm",
    danger: "bg-red-600 hover:bg-red-700 border-red-600 text-white shadow-sm",
    success: "bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-sm",
    ghost: "bg-transparent hover:bg-gray-50 border-transparent text-gray-700",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

function formatDT(iso) {
  if (!iso) return "N/A";
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

// Highlight segments in text
function renderHighlightedText(text, segments = []) {
  if (!text || text.startsWith("Text content not stored")) {
    return <span className="italic text-gray-400">{text || "No text available"}</span>;
  }
  
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
      parts.push({ key: `n-${idx}`, type: "normal", value: text.slice(cursor, seg.start) });
    }
    parts.push({ key: `h-${idx}`, type: "highlight", value: text.slice(seg.start, seg.end) });
    cursor = seg.end;
  });
  if (cursor < text.length) {
    parts.push({ key: `tail`, type: "normal", value: text.slice(cursor) });
  }

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p) =>
        p.type === "highlight" ? (
          <mark key={p.key} className="bg-yellow-200/70 px-0.5 rounded-sm">
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
  const [risk, setRisk] = useState("All"); 
  const [type, setType] = useState("All"); 
  const [sort, setSort] = useState("Newest"); 
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await courseService.getPlagiarismReports();
      if (Array.isArray(data)) {
        setReports(data);
      } else if (data && Array.isArray(data.results)) {
        setReports(data.results);
      } else {
        console.warn("Unexpected API response format:", data);
        setReports([]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setToast({ kind: "error", text: "Failed to load reports" });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    
    let list = [...reports];

    if (risk !== "All") list = list.filter((r) => r.riskLevel === risk);
    if (type !== "All") list = list.filter((r) => r.assessmentType === type);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        return (
          (r.courseTitle || "").toLowerCase().includes(q) ||
          (r.courseCode || "").toLowerCase().includes(q) ||
          (r.assessmentTitle || "").toLowerCase().includes(q) ||
          (r.student?.name || "").toLowerCase().includes(q) ||
          (r.student?.id || "").toLowerCase().includes(q) ||
          (r.status || "Open").toLowerCase().includes(q)
        );
      });
    }

    if (sort === "Newest") {
      list.sort((a, b) => new Date(b.flaggedAt) - new Date(a.flaggedAt));
    } else if (sort === "HighestScore") {
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sort === "Course") {
      list.sort((a, b) => (a.courseCode || "").localeCompare(b.courseCode || ""));
    }
    return list;
  }, [reports, query, risk, type, sort]);

  const stats = useMemo(() => {
    if (!Array.isArray(reports)) return { total: 0, high: 0, review: 0, open: 0 };

    const total = reports.length;
    const high = reports.filter((r) => r.riskLevel === "High").length;
    const review = reports.filter((r) => r.riskLevel === "Review").length;
    const open = reports.filter((r) => (r.status || "Open") === "Open").length;
    return { total, high, review, open };
  }, [reports]);

  const openReport = (r) => setSelected(r);

  // -----------------------------
  // Action Logic
  // -----------------------------
  const updateAction = async (action, payload = {}) => {
    if (!selected) return;
    const reportId = selected.id;

    try {
      // 1. Perform the Plagiarism Action
      await courseService.updatePlagiarismReportAction(reportId, { action, ...payload });
      
      let successMessage = "Action saved";
      
      // 2. Handle Grading if provided
      if (payload.grade !== undefined) {
         successMessage = "Report dismissed & grade saved.";
      }

      // 3. Handle Notifications (Visual confirmation)
      if (action === "clarify") {
          successMessage = "Notification sent to student.";
      }
      if (action === "misconduct") {
          successMessage = "Marked as 0. Notification sent to student.";
      }

      // 4. Update Local State
      const updateLogic = (prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: action === "dismiss" ? "Dismissed" : action === "misconduct" ? "Misconduct" : r.status,
                score: action === "misconduct" ? 0 : r.score, // Update local display
                grade: payload.grade !== undefined ? payload.grade : r.grade,
                instructorAction: { action, payload, at: new Date().toISOString() },
              }
            : r
        );
      };

      setReports(updateLogic);
      setSelected((prev) => (prev ? { ...prev, ...updateLogic([prev])[0] } : null));

      setToast({ kind: "success", text: successMessage });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      console.error(e);
      setToast({ kind: "error", text: "Failed to save action" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed z-50 top-4 right-4">
          <div className={`px-4 py-3 rounded-xl border shadow-sm bg-white ${toast.kind === "success" ? "border-green-200" : "border-red-200"}`}>
            <div className="flex items-center gap-2">
              {toast.kind === "success" ? <CheckCircle2 className="text-green-600" size={18} /> : <AlertTriangle className="text-red-600" size={18} />}
              <span className="text-sm text-gray-800">{toast.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="flex flex-col gap-4 p-6 mb-6 text-white rounded-lg shadow-md bg-gradient-to-r from-orange-600 to-red-500 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white-900">
              <AlertTriangle className="text-white-600" />
              Integrity Reports
            </h1>
            <p className="mt-1 text-sm text-white-500">Plagiarism / cheating alerts with evidence and instructor actions</p>
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
              <select className="w-full px-3 py-2 text-sm bg-white border rounded-xl" value={risk} onChange={(e) => setRisk(e.target.value)}>
                <option>All</option>
                <option>High</option>
                <option>Review</option>
                <option>Low</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select className="w-full px-3 py-2 text-sm bg-white border rounded-xl" value={type} onChange={(e) => setType(e.target.value)}>
                <option>All</option>
                <option>Assignment</option>
                <option>Quiz</option>
                <option>Exam</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select className="w-full px-3 py-2 text-sm bg-white border rounded-xl" value={sort} onChange={(e) => setSort(e.target.value)}>
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
            <div className="p-10 text-center text-gray-500">No reports match your filters.</div>
          )}

          <div className="divide-y">
            {filtered.map((r) => (
              <button key={r.id} onClick={() => openReport(r)} className="w-full px-5 py-4 text-left transition hover:bg-gray-50" type="button">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill className={riskBadge(r.riskLevel)}>
                        <AlertTriangle size={14} />
                        {r.riskLevel} • {r.score}%
                      </Pill>

                      {/* Grade Pill (Shown if graded) */}
                      {r.grade !== null && r.grade !== undefined && (
                        <Pill className="font-bold text-blue-700 border-blue-200 bg-blue-50">
                          <CheckCircle2 size={14} />
                          Grade: {r.grade}
                        </Pill>
                      )}

                      <Pill className="text-gray-700 border-gray-200 bg-gray-50">{r.assessmentType}</Pill>
                      <Pill className="text-orange-700 border-orange-200 bg-orange-50">{r.courseCode}</Pill>
                      
                      {/* Status Pill with proper coloring */}
                      <Pill className={`border ${
                        r.status === 'Dismissed' ? 'bg-green-100 text-green-700 border-green-200' :
                        r.status === 'Misconduct' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {r.status || "Open"}
                      </Pill>
                    </div>

                    <div className="mt-2 font-semibold text-gray-900 truncate">{r.assessmentTitle}</div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <User size={14} />
                        {r.student?.name || "Unknown"} ({r.student?.id || "N/A"})
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
          onDismiss={(grade) => updateAction("dismiss", { grade })}
          onClarify={(message) => updateAction("clarify", { message })}
          onMisconduct={(notes) => updateAction("misconduct", { notes, grade: 0 })}
        />
      )}
    </div>
  );
}

// -----------------------------
// Drawer (Report Detail)
// -----------------------------
function ReportDrawer({ report, onClose, onDismiss, onClarify, onMisconduct }) {
  const [tab, setTab] = useState("Evidence"); 
  const [activeAction, setActiveAction] = useState(null); 

  // Action States
  const [gradeInput, setGradeInput] = useState("");
  const [clarifyMsg, setClarifyMsg] = useState("Hi, please explain your sources and provide drafts/notes for this submission.");
  const [misconductNotes, setMisconductNotes] = useState("High confidence plagiarism based on similarity evidence. Grade set to 0.");

  const internalTop = report.evidence?.internalMatches?.[0];
  const externalTop = report.evidence?.externalSources?.[0];
  
  // Helpers for evidence comparison
  const externalSources = report.evidence?.externalSources || [];
  const internalMatches = report.evidence?.internalMatches || [];

  // ✅ Determine if the report is finalized/locked
  const isLocked = 
    report.status === "Dismissed" || 
    report.status === "Misconduct" || 
    (report.grade !== null && report.grade !== undefined);

  const handleDismissSubmit = () => {
    if(!gradeInput) return alert("Please enter a grade to proceed.");
    onDismiss(gradeInput);
    setActiveAction(null);
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} role="button" tabIndex={-1} />
      <div className="absolute right-0 top-0 h-full w-full md:w-[780px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-5 bg-white border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Pill className={riskBadge(report.riskLevel)}>
                  <AlertTriangle size={14} />
                  {report.riskLevel} • {report.score}%
                </Pill>
                <Pill className="text-gray-700 border-gray-200 bg-gray-50">{report.assessmentType}</Pill>
                <Pill className="text-orange-700 border-orange-200 bg-orange-50">{report.courseCode}</Pill>
                {/* Status Pill */}
                <Pill className={`border ${isLocked ? (report.status === "Misconduct" ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200") : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                   {report.status || "Open"}
                </Pill>
              </div>
              <h2 className="mt-2 text-lg font-bold text-gray-900 truncate">{report.assessmentTitle}</h2>
              <p className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <User size={14} />
                  {report.student?.name} ({report.student?.id})
                </span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} />
                  Submitted {formatDT(report.submittedAt)}
                </span>
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}><X size={18} /></Button>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {["Evidence", "TextCompare", "Actions"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${tab === t ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoCard
                  icon={ShieldCheck}
                  title="Top Internal Match"
                  subtitle={internalTop ? `${internalTop.matchStudentId} • ${internalTop.similarityPercent}%` : "None"}
                  body={internalTop ? `${internalTop.overlapWords} words across ${internalTop.segments} segments` : "No specific internal match details stored."}
                />
                <InfoCard
                  icon={Globe}
                  title="Top External Source"
                  subtitle={externalTop ? `${externalTop.domain} • ${externalTop.similarityPercent}%` : "None"}
                  body={externalTop ? externalTop.url : "External scanning disabled or no matches found."}
                />
              </div>
              
              <Section title="Submission metadata">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <MetaRow icon={Clock} label="Submitted" value={formatDT(report.metadata?.submitAt)} />
                  <MetaRow icon={Laptop} label="Device" value={report.metadata?.deviceId || "—"} />
                  <MetaRow icon={Globe} label="IP Address" value={report.metadata?.ip || "—"} />
                </div>
              </Section>
            </div>
          )}

          {/* ✅ UPDATED TEXT COMPARE TAB */}
          {tab === "TextCompare" && (
            <div className="space-y-6">
              <Section title="Student Submission (Extracted)">
                <div className="p-4 overflow-y-auto text-sm text-gray-800 bg-white border rounded-2xl max-h-60">
                  {renderHighlightedText(report.text?.studentText, report.text?.studentHighlights)}
                </div>
              </Section>

              {/* 1. Show Main Match Text (Usually Internal or URL) */}
              <Section title="Primary Match Context">
                <div className="p-4 text-sm text-gray-800 bg-white border rounded-2xl">
                   {renderHighlightedText(report.text?.matchText, report.text?.matchHighlights)}
                </div>
              </Section>

              {/* 2. Show Web Evidence Excerpts (Detailed Breakdown) */}
              {externalSources.length > 0 && (
                <Section title="Web Evidence Matches">
                  <div className="space-y-3">
                    {externalSources.map((source, idx) => (
                      <div key={idx} className="p-4 border border-orange-100 bg-orange-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                           <a href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                             <LinkIcon size={14} /> {source.domain}
                           </a>
                           <span className="px-2 py-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-lg">
                             {source.similarityPercent}% Similarity
                           </span>
                        </div>
                        <div className="pl-3 text-sm italic text-gray-700 border-l-4 border-orange-300">
                          {source.excerpts && source.excerpts.length > 0 ? (
                            source.excerpts.map((excerpt, i) => (
                              <p key={i} className="mb-1">"...{excerpt}..."</p>
                            ))
                          ) : (
                            <span className="text-gray-400">No specific text excerpt available.</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* 3. Show Internal Evidence (Previous Assignments) */}
              {internalMatches.length > 0 && (
                 <Section title="Internal Database Matches">
                    <div className="space-y-3">
                       {internalMatches.map((match, idx) => (
                          <div key={idx} className="p-4 border border-purple-100 bg-purple-50 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-purple-800">
                                  Student ID: {match.matchStudentId}
                                </span>
                                <span className="px-2 py-1 text-xs font-bold text-purple-700 bg-purple-100 rounded-lg">
                                  {match.similarityPercent}% Similarity
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {match.overlapWords} matching words found.
                              </p>
                          </div>
                       ))}
                    </div>
                 </Section>
              )}
            </div>
          )}

          {tab === "Actions" && (
            <div className="space-y-4">
              <Section title="Instructor Actions">
                
                {/* ✅ LOCK LOGIC STARTS HERE */}
                {isLocked ? (
                  <div className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl ${report.status === 'Misconduct' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className={`p-4 rounded-full mb-4 ${report.status === 'Misconduct' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      <Lock size={32} />
                    </div>
                    <h3 className={`text-xl font-bold ${report.status === 'Misconduct' ? 'text-red-900' : 'text-green-900'}`}>
                      Report Resolved
                    </h3>
                    <p className="mt-1 text-gray-600">
                      This case has been closed as <b>{report.status}</b>.
                    </p>
                    
                    <div className="flex items-center gap-4 mt-6">
                        <div className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border shadow-sm rounded-xl">
                            Final Grade: <span className="text-lg font-bold text-black">{report.grade}</span> / 100
                        </div>
                        {report.instructorAction?.at && (
                             <div className="text-sm text-gray-500">
                                Action taken on {new Date(report.instructorAction.at).toLocaleDateString()}
                             </div>
                        )}
                    </div>
                  </div>
                ) : (
                  // ✅ EXISTING ACTION BUTTONS (Only shown if NOT locked)
                  <div className="p-4 space-y-4 bg-white border rounded-2xl">
                    <div className="flex flex-wrap gap-2">
                      <Button 
                          variant={activeAction === 'dismiss' ? "success" : "default"} 
                          onClick={() => setActiveAction('dismiss')}
                          className={activeAction === 'dismiss' ? "ring-2 ring-offset-1 ring-green-600" : ""}
                      >
                          <ShieldX size={16} /> Dismiss & Grade
                      </Button>
                      <Button 
                          variant={activeAction === 'clarify' ? "primary" : "default"} 
                          onClick={() => setActiveAction('clarify')}
                          className={activeAction === 'clarify' ? "ring-2 ring-offset-1 ring-orange-600" : ""}
                      >
                          <MessageSquare size={16} /> Request Clarification
                      </Button>
                      <Button 
                          variant={activeAction === 'misconduct' ? "danger" : "default"} 
                          onClick={() => setActiveAction('misconduct')}
                          className={activeAction === 'misconduct' ? "ring-2 ring-offset-1 ring-red-600" : ""}
                      >
                          <Gavel size={16} /> Mark Misconduct (Grade 0)
                      </Button>
                    </div>

                    {/* DISMISS PANEL */}
                    {activeAction === 'dismiss' && (
                        <div className="p-4 mt-4 border border-green-200 rounded-xl bg-green-50 animate-in fade-in slide-in-from-top-2">
                            <h4 className="flex items-center gap-2 mb-3 font-semibold text-green-800">
                                <CheckCircle2 size={18} /> Grade & Dismiss Flag
                            </h4>
                            
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                                  <span className="text-sm font-medium text-gray-700">Student Submission</span>
                                  <a 
                                      href={report.file || report.file_url || "#"} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                                  >
                                      <Eye size={16} /> View Document
                                  </a>
                              </div>

                              <div>
                                  <label className="block mb-1 text-xs font-medium text-gray-500">Assign Grade (0-100)</label>
                                  <input 
                                      type="number" 
                                      max={100}
                                      className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                      placeholder="Enter marks..."
                                      value={gradeInput}
                                      onChange={e => setGradeInput(e.target.value)}
                                  />
                              </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <Button variant="success" onClick={handleDismissSubmit}>
                                    <Save size={16} /> Save Grade & Dismiss
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* CLARIFY PANEL */}
                    {activeAction === 'clarify' && (
                        <div className="p-4 mt-4 border border-orange-200 rounded-xl bg-orange-50 animate-in fade-in slide-in-from-top-2">
                            <h4 className="flex items-center gap-2 mb-3 font-semibold text-orange-800">
                                <MessageSquare size={18} /> Send Notification to Student
                            </h4>
                            <p className="mb-2 text-xs text-orange-700">This will send a notification to <b>{report.student?.name}</b> requesting clarification.</p>
                            <textarea 
                                className="w-full p-3 border border-orange-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                rows={3}
                                value={clarifyMsg}
                                onChange={e => setClarifyMsg(e.target.value)}
                            />
                            <div className="flex justify-end mt-4">
                                <Button variant="primary" onClick={() => onClarify(clarifyMsg)}>
                                    <Send size={16} /> Send Notification
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* MISCONDUCT PANEL */}
                    {activeAction === 'misconduct' && (
                        <div className="p-4 mt-4 border border-red-200 rounded-xl bg-red-50 animate-in fade-in slide-in-from-top-2">
                            <h4 className="flex items-center gap-2 mb-3 font-semibold text-red-800">
                                <AlertTriangle size={18} /> Confirm Academic Misconduct
                            </h4>
                            
                            <div className="flex gap-3 p-3 mb-3 bg-white border border-red-100 rounded-lg">
                                <div className="p-2 bg-red-100 rounded-full h-fit"><Ban size={16} className="text-red-600"/></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Action Consequences:</p>
                                    <ul className="pl-4 mt-1 text-sm text-gray-600 list-disc">
                                        <li>Grade will automatically be set to <b className="text-red-600">0</b>.</li>
                                        <li>Student will receive a <b>notification</b> about this decision.</li>
                                        <li>The report status will be marked as "Misconduct".</li>
                                    </ul>
                                </div>
                            </div>

                            <label className="block mb-1 text-xs font-medium text-gray-500">Instructor Note (Visible to Student)</label>
                            <textarea 
                                className="w-full p-3 border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                                rows={2}
                                value={misconductNotes}
                                onChange={e => setMisconductNotes(e.target.value)}
                            />
                            <div className="flex justify-end mt-4">
                                <Button variant="danger" onClick={() => onMisconduct(misconductNotes)}>
                                    <Gavel size={16} /> Confirm Misconduct (Grade 0)
                                </Button>
                            </div>
                        </div>
                    )}

                  </div>
                )}
                {/* ✅ LOCK LOGIC ENDS HERE */}
                
              </Section>
            </div>
          )}
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
        <div className="p-3 text-gray-700 rounded-xl bg-gray-50"><Icon size={20} /></div>
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
        <div className="p-3 text-gray-700 rounded-xl bg-gray-50"><Icon size={18} /></div>
      </div>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white border rounded-2xl">
      <div className="p-2 text-gray-700 rounded-xl bg-gray-50"><Icon size={18} /></div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-semibold text-gray-900 mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
}