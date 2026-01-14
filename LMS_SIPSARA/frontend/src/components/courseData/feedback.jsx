import React, { useEffect, useMemo, useState } from "react";
import { courseService } from "@/config/course.config";

const TeacherFeedbackPanel = () => {
  const [activeTab, setActiveTab] = useState("complaints"); // complaints | feedback
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [search, setSearch] = useState("");

  // Teacher courses
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // Data
  const [complaintsList, setComplaintsList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);

  // Reply modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "complaint" | "feedback"
  const [selectedItem, setSelectedItem] = useState(null);
  const [reply, setReply] = useState("");
  const [statusValue, setStatusValue] = useState("open");

  const normalizeList = (resData) => {
    if (Array.isArray(resData)) return resData;
    return resData?.results || resData?.data?.results || [];
  };

  // 1) Load teacher courses first (so we always have a courseId)
  const loadTeacherCourses = async () => {
    setLoadingCourses(true);
    try {
      // In your course.config.js: getCoursesteacher() -> Course/courses/teacher/list/
      const list = await courseService.getCoursesteacher();
      const safe = Array.isArray(list) ? list : [];
      setCourses(safe);

      // Auto-select first course
      if (safe.length > 0) {
        const firstId = safe[0]?.id;
        if (firstId) setSelectedCourseId(String(firstId));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to load teacher courses.");
    } finally {
      setLoadingCourses(false);
    }
  };

  // 2) Load complaints + feedback for the selected course
  const loadCourseData = async (courseId) => {
    if (!courseId) return;
    setLoadingData(true);
    try {
      const [cRes, fRes] = await Promise.all([
        courseService.getTeacherComplaints(courseId), // /Course/student/enrolled-courses/<id>/complaints/
        courseService.getTeacherFeedback(courseId), // /Course/student/enrolled-courses/<id>/feedback/
      ]);

      setComplaintsList(normalizeList(cRes?.data));
      setFeedbackList(normalizeList(fRes?.data));
    } catch (e) {
      console.error(e);
      alert("Failed to load complaints/feedback for this course.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadTeacherCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCourseId) loadCourseData(selectedCourseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  const filteredComplaints = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return complaintsList;
    return complaintsList.filter((x) => {
      return (
        String(x.title || "").toLowerCase().includes(s) ||
        String(x.description || "").toLowerCase().includes(s) ||
        String(x.student_name || "").toLowerCase().includes(s) ||
        String(x.status || "").toLowerCase().includes(s)
      );
    });
  }, [complaintsList, search]);

  const filteredFeedback = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return feedbackList;
    return feedbackList.filter((x) => {
      return (
        String(x.title || "").toLowerCase().includes(s) ||
        String(x.student_name || "").toLowerCase().includes(s)
      );
    });
  }, [feedbackList, search]);

  const openReplyModal = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setReply(item?.reply || "");
    setStatusValue(item?.status || "open");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setSelectedItem(null);
    setReply("");
    setStatusValue("open");
  };

  // Teacher reply/update complaint (uses /Course/complaints/<id>/)
  const submitComplaintReply = async () => {
    if (!selectedItem?.id) return;
    if (!selectedCourseId) return;

    try {
      await courseService.updateTeacherComplaint(selectedCourseId, selectedItem.id, {
        reply,
        status: statusValue, // example: "open" | "closed" (match your backend values)
      });

      closeModal();
      await loadCourseData(selectedCourseId);
    } catch (e) {
      console.error(e);
      alert("Failed to update complaint.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          background: "linear-gradient(90deg,#4f46e5,#9333ea)",
          color: "white",
          padding: 18,
          borderRadius: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800 }}>
          Teacher/Admin Feedback & Complaints
        </div>
        <div style={{ opacity: 0.9, marginTop: 4 }}>CRUD + Reply</div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveTab("feedback")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: activeTab === "feedback" ? "#4f46e5" : "#f5f5f5",
            color: activeTab === "feedback" ? "white" : "#111",
            cursor: "pointer",
          }}
        >
          Feedback
        </button>
        <button
          onClick={() => setActiveTab("complaints")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: activeTab === "complaints" ? "#4f46e5" : "#f5f5f5",
            color: activeTab === "complaints" ? "white" : "#111",
            cursor: "pointer",
          }}
        >
          Complaints
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            disabled={loadingCourses || courses.length === 0}
            style={{
              height: 36,
              borderRadius: 8,
              border: "1px solid #ddd",
              padding: "0 10px",
              minWidth: 260,
            }}
          >
            {courses.length === 0 ? (
              <option value="">
                {loadingCourses ? "Loading courses..." : "No teacher courses found"}
              </option>
            ) : (
              courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title || `Course #${c.id}`}
                </option>
              ))
            )}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              height: 36,
              borderRadius: 8,
              border: "1px solid #ddd",
              padding: "0 10px",
              width: 260,
            }}
          />

          <button
            onClick={() => loadCourseData(selectedCourseId)}
            disabled={!selectedCourseId || loadingData}
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid #111827",
              background: "#111827",
              color: "white",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 14,
          background: "white",
          minHeight: 140,
        }}
      >
        {loadingData ? (
          <div>Loading...</div>
        ) : activeTab === "complaints" ? (
          filteredComplaints.length === 0 ? (
            <div>No complaints.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredComplaints.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 800 }}>{c.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      Status: <b>{c.status}</b> | Priority: <b>{c.priority}</b>
                    </div>
                  </div>

                  <div style={{ marginTop: 6, opacity: 0.9 }}>{c.description}</div>

                  <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
                    Student: <b>{c.student_name}</b> ({c.student_email})
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Reply:</div>
                    <div style={{ opacity: 0.9 }}>{c.reply || "No reply yet"}</div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={() => openReplyModal("complaint", c)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #4f46e5",
                        background: "#4f46e5",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Reply / Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredFeedback.length === 0 ? (
            <div>No feedback.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredFeedback.map((f) => (
                <div
                  key={f.qa_id || f.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{f.title}</div>
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
                    {f.student_name ? `Student: ${f.student_name}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
            zIndex: 9999,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width: 640,
              maxWidth: "100%",
              background: "white",
              borderRadius: 12,
              padding: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
              {modalType === "complaint" ? "Reply to Complaint" : "Reply"}
            </div>

            {modalType === "complaint" && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>Status</label>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    height: 38,
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    padding: "0 10px",
                    marginTop: 6,
                  }}
                >
                  <option value="open">open</option>
                  <option value="closed">closed</option>
                  <option value="in_progress">in_progress</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>Reply</label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={5}
                style={{
                  display: "block",
                  width: "100%",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  padding: 10,
                  marginTop: 6,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "#f5f5f5",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              {modalType === "complaint" && (
                <button
                  onClick={submitComplaintReply}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #4f46e5",
                    background: "#4f46e5",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherFeedbackPanel;
