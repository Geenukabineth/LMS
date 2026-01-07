// components/GradingScreen.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { User, FileText, Check, X, Save } from "lucide-react";
import api from "../api/axios";

const GradingScreen = () => {
  const { assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    api.get(`/teacher/submissions/?assignment_id=${assignmentId}`)
       .then(res => setSubmissions(res.data));
  }, [assignmentId]);

  const handleGradeSubmit = async () => {
    if (!selectedSub) return;
    try {
      await api.patch(`/teacher/grade/assignment/${selectedSub.id}/`, {
        grade: grade,
        feedback: feedback
      });
      alert("Graded Successfully");
      // Update local list
      setSubmissions(prev => prev.map(s => s.id === selectedSub.id ? {...s, grade, feedback} : s));
      setSelectedSub(null);
    } catch (err) {
      alert("Error saving grade");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar List */}
      <div className="w-1/3 overflow-y-auto bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Submissions ({submissions.length})</h2>
        </div>
        <div>
          {submissions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => { setSelectedSub(sub); setGrade(sub.grade || ""); setFeedback(sub.feedback || ""); }}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedSub?.id === sub.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 text-gray-600 bg-gray-200 rounded-full">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{sub.student_name}</h4>
                    <p className="text-xs text-gray-500">{new Date(sub.submitted_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {sub.grade ? (
                  <span className="px-2 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full">
                    {sub.grade} pts
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-full">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grading Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedSub ? (
          <div className="max-w-2xl mx-auto">
            <div className="p-6 mb-6 bg-white border shadow-sm rounded-xl">
              <h3 className="mb-4 text-xl font-bold text-gray-800">Student Submission</h3>
              
              <div className="p-4 mb-6 border border-gray-200 border-dashed rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-500" />
                  <span className="font-medium text-gray-700">Submitted File:</span>
                  <a href={selectedSub.file} target="_blank" className="text-blue-600 underline hover:text-blue-800">
                    Download / View Attachment
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-bold text-gray-700">Grade (Points)</label>
                  <input
                    type="number"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 85"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-bold text-gray-700">Teacher Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter feedback for the student..."
                  />
                </div>
                <button
                  onClick={handleGradeSubmit}
                  className="flex items-center justify-center w-full gap-2 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <Save size={18} /> Save Grade & Feedback
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText size={64} className="mb-4 opacity-50" />
            <p className="text-xl">Select a student from the list to begin grading</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradingScreen;