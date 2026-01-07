// components/AssessmentStartView.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, AlertCircle, PlayCircle, FileText } from "lucide-react";
// ✅ Import the service you already set up in course.config.js
import { courseService } from "@/config/course.config"; 

const AssessmentStartView = () => {
  const { courseId, type, id } = useParams(); // 'id' here is the LESSON ID (325)
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let result;
        // ✅ FIX: Use the 'get' methods that filter by lesson (defined in your course.config.js)
        if (type === 'quiz') {
           // Calls: /teacher/quizzes/?lesson=325
           result = await courseService.getQuizzes(id);
        } else {
           // Calls: /teacher/assignments/?lesson=325
           result = await courseService.getAssignments(id);
        }

        // ✅ FIX: The API returns a list (array). We need the first item.
        if (Array.isArray(result) && result.length > 0) {
            setData(result[0]); // This object contains the REAL ID (e.g., id: 1)
        } else {
            setError("Assessment content not found for this lesson.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load assessment details.");
      }
    };

    if (id) fetchData();
  }, [type, id]);

  const handleStart = () => {
    if (!data) return;

    // ✅ FIX: Navigate using the REAL ID (data.id = 1), not the Lesson ID
    if (type === 'quiz') {
      // Ensure your routes in App.js match this pattern
      navigate(`/student/course/${courseId}/quiz/${data.id}`); 
    } else {
      // Navigate to the Assignment Submission View
      navigate(`/student/course/${courseId}/assignment/${data.id}`);
    }
  };

  if (error) return (
    <div className="max-w-4xl p-8 mx-auto mt-10 text-center text-red-600 rounded-lg bg-red-50">
      <AlertCircle className="w-10 h-10 mx-auto mb-2"/>
      {error}
    </div>
  );
  
  if (!data) return <div className="p-10 text-center text-gray-500">Loading Assessment Details...</div>;

  return (
    <div className="max-w-4xl p-6 mx-auto mt-10 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-full ${type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
          {type === 'quiz' ? <Clock size={32} /> : <FileText size={32} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{data.title}</h1>
          <p className="text-gray-500">{type === 'quiz' ? 'Timed Assessment' : 'Coursework Task'}</p>
        </div>
      </div>

      <div className="p-6 mb-8 bg-gray-50 rounded-xl">
        <h3 className="mb-2 text-lg font-semibold">Instructions</h3>
        <p className="leading-relaxed text-gray-600 whitespace-pre-line">
            {data.description || "No instructions provided."}
        </p>
        
        {type === 'quiz' && (
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock size={18} />
              <span className="font-medium">{data.time_limit || "No"} Minutes Limit</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <AlertCircle size={18} />
              <span className="font-medium">{data.attempts || 1} Attempts Allowed</span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
      >
        <PlayCircle />
        {type === 'quiz' ? "Start Quiz Now" : "Go to Submission"}
      </button>
    </div>
  );
};

export default AssessmentStartView;