// components/AssignmentView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Calendar, AlertCircle, Loader } from 'lucide-react';
import { courseService } from "@/config/course.config";

const AssignmentView = () => {
  const params = useParams();
  // This 'id' is likely the LESSON ID (e.g., 325) coming from the URL
  const id = params.assignmentId || params.id || params.pk; 
  const { courseId } = useParams(); 

  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
        setError("Invalid ID provided.");
        setLoading(false);
        return;
    }

    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError("");
        
        // -----------------------------------------------------------
        // 1. SMART LOOKUP: Try finding by LESSON ID first
        // -----------------------------------------------------------
        // This calls: /teacher/assignments/?lesson=325
        const listResponse = await courseService.getAssignments(id);
        
        if (Array.isArray(listResponse) && listResponse.length > 0) {
            // Found it! Use the first assignment from the list
            // This transforms Lesson ID (325) -> Assignment Data (ID: 1)
            setAssignment(listResponse[0]);
        } else {
            // -----------------------------------------------------------
            // 2. FALLBACK: Try finding by ASSIGNMENT ID
            // -----------------------------------------------------------
            // If the list was empty, maybe 'id' was already the Assignment ID?
            // This calls: /teacher/assignments/325/
            try {
                const detailResponse = await courseService.getAssignmentDetail(id);
                setAssignment(detailResponse);
            } catch (detailErr) {
                // If both fail, then it truly doesn't exist
                throw new Error("Assignment not found");
            }
        }
      } catch (err) {
          console.error("Failed to load assignment", err);
          setError("Assignment not found. Please contact your instructor.");
      } finally {
          setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !assignment) return;
    
    setSubmitting(true);
    const formData = new FormData();
    // ✅ CRITICAL: Use the REAL Assignment ID from the fetched object (e.g., 1)
    formData.append("assignment", assignment.id);
    formData.append("file", file);

    try {
      await courseService.submitAssignment(formData);
      alert("Submitted successfully!");
      navigate(`/student/course/${courseId}`); 
    } catch (error) {
      console.error(error);
      alert("Submission failed. Please check your network.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
      <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center p-8 m-4 text-red-600 rounded-lg bg-red-50">
        <AlertCircle className="w-10 h-10 mb-2"/>
        <p className="font-semibold">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline hover:text-blue-800">
            Go Back to Course
        </button>
    </div>
  );

  if (!assignment) return null;

  return (
    <div className="max-w-3xl p-6 mx-auto mt-8 bg-white border border-gray-100 shadow-lg rounded-xl">
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center mb-6 text-gray-500 transition hover:text-blue-600 group"
        >
            <ArrowLeft size={18} className="mr-1 transition-transform group-hover:-translate-x-1"/> 
            Back to Course
        </button>

        <div className="pb-4 mb-6 border-b">
            <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
            {assignment.due_date && (
                <div className="flex items-center mt-2 text-sm font-medium text-gray-500">
                    <Calendar className="inline w-4 h-4 mr-2 text-blue-500"/> 
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                </div>
            )}
        </div>

        <div className="p-6 mb-8 text-gray-700 whitespace-pre-wrap border border-gray-100 rounded-lg bg-gray-50">
            <h3 className="mb-2 text-sm font-bold text-gray-400 uppercase">Instructions</h3>
            {assignment.description || "No instructions provided."}
        </div>
        
        <div className="p-8 text-center transition-all border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-400 group">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 transition-transform bg-white rounded-full shadow-sm group-hover:scale-110">
                <UploadCloud className="w-8 h-8 text-blue-500"/>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Upload Your Work</h3>
            <p className="mb-6 text-sm text-gray-500">Supported formats: PDF, DOCX, ZIP</p>
            
            <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])} 
                className="block w-full max-w-xs mx-auto text-sm text-gray-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" 
            />
            
            <button 
                onClick={handleSubmit} 
                disabled={!file || submitting}
                className={`w-full max-w-xs py-3 mt-8 font-bold rounded-lg transition-all shadow-md ${
                    !file || submitting 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                }`}
            >
                {submitting ? "Uploading..." : "Submit Assignment"}
            </button>
        </div>
    </div>
  );
};

export default AssignmentView;