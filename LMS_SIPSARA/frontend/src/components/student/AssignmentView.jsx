// components/AssignmentView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, UploadCloud, Calendar, AlertCircle, Loader, 
  Award, Clock, FileText, Download, Lock, CheckCircle 
} from 'lucide-react';
import { courseService } from "@/config/course.config";

const AssignmentView = () => {
  const params = useParams();
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
        
        // 1. SMART LOOKUP: Try finding by LESSON ID first
        const listResponse = await courseService.getAssignments(id);
        
        if (Array.isArray(listResponse) && listResponse.length > 0) {
            setAssignment(listResponse[0]);
        } else {
            // 2. FALLBACK: Try finding by ASSIGNMENT ID
            const detailResponse = await courseService.getAssignmentDetail(id);
            setAssignment(detailResponse);
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

  // ---------------------------
  // LOADING / ERROR STATES
  // ---------------------------
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

  // ---------------------------
  // 🔒 LOCK LOGIC
  // ---------------------------
  const userStatus = assignment.user_status || {};
  const isLocked = userStatus.is_locked; // Comes from backend serializer
  const isSubmitted = userStatus.is_submitted;
  const isPastDue = userStatus.is_past_due;

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md p-8 text-center bg-white border border-gray-200 shadow-lg rounded-2xl">
          
          {/* Dynamic Icon based on reason */}
          <div className={`flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full ${isSubmitted ? 'bg-green-100' : 'bg-red-100'}`}>
            {isSubmitted ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
                <Lock className="w-10 h-10 text-red-600" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">
            {isSubmitted ? "Assignment Submitted" : "Assignment Locked"}
          </h1>
          
          <p className="mt-2 text-gray-500">
            {isSubmitted 
                ? "You have already completed this assignment." 
                : "The due date for this assignment has passed."}
          </p>

          <div className="p-4 mt-6 text-left bg-gray-50 rounded-xl">
             <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">Assignment:</span>
                <span className="font-medium text-gray-900">{assignment.title}</span>
             </div>
             
             {isSubmitted && (
                <>
                <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-600">Submitted on:</span>
                    <span className="font-medium text-gray-900">
                        {userStatus.submitted_at ? new Date(userStatus.submitted_at).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
                {userStatus.grade !== null && (
                    <div className="flex justify-between pt-2 mt-2 text-sm border-t">
                        <span className="font-bold text-gray-700">Grade:</span>
                        <span className="font-bold text-blue-600">{userStatus.grade} / {assignment.points || 100}</span>
                    </div>
                )}
                </>
             )}

             {isPastDue && !isSubmitted && (
                 <div className="flex justify-between text-sm text-red-600">
                    <span>Due Date:</span>
                    <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                 </div>
             )}
          </div>

          <button
            onClick={() => navigate(-1)} // Or navigate to specific course path
            className="w-full py-3 mt-8 font-bold text-white transition-colors bg-gray-800 rounded-xl hover:bg-gray-900"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------
  // STANDARD VIEW (Unlocked)
  // ---------------------------
  return (
    <div className="max-w-4xl p-6 mx-auto mt-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
        {/* Back Button */}
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center mb-8 text-sm font-medium text-gray-500 transition hover:text-blue-600 group"
        >
            <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1"/> 
            Back to Course
        </button>

        {/* Header: Title & Meta Info */}
        <div className="pb-6 mb-8 border-b border-gray-100">
            <h1 className="mb-4 text-3xl font-bold text-gray-900">{assignment.title}</h1>
            
            <div className="flex flex-wrap gap-3">
                {/* Due Date */}
                {assignment.due_date && (
                    <div className="flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-red-50 text-red-700 border border-red-100">
                        <Calendar className="w-4 h-4 mr-2"/> 
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </div>
                )}
                
                {/* Points */}
                <div className="flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    <Award className="w-4 h-4 mr-2"/>
                    {assignment.points ? `${assignment.points} Points` : 'No Points'}
                </div>

                {/* Assigned Date */}
                <div className="flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    <Clock className="w-4 h-4 mr-2"/>
                    Assigned: {new Date(assignment.created_at || new Date()).toLocaleDateString()}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* LEFT COLUMN: Details & File */}
            <div className="lg:col-span-2">
                {/* Description */}
                <div className="mb-8">
                    <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Instructions</h3>
                    <div className="p-6 leading-relaxed text-gray-700 whitespace-pre-wrap border border-gray-100 rounded-xl bg-gray-50/50">
                        {assignment.description || "No specific instructions provided for this assignment."}
                    </div>
                </div>

                {/* Teacher's Attachment (If exists) */}
                {assignment.file && (
                    <div className="mb-8">
                        <h3 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Resources</h3>
                        <a 
                            href={assignment.file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-4 transition-all bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md hover:border-blue-400 group"
                        >
                            <div className="p-3 mr-4 text-blue-600 transition-colors rounded-lg bg-blue-50 group-hover:bg-blue-100">
                                <FileText size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">Download Assignment Material</h4>
                                <p className="text-sm text-gray-500">Click to view attached file</p>
                            </div>
                            <Download className="text-gray-400 transition-colors group-hover:text-blue-600" size={20}/>
                        </a>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Submission Box */}
            <div className="lg:col-span-1">
                <div className="sticky top-6">
                    <div className="p-6 text-center transition-all bg-white border-2 border-gray-200 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50/30">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-blue-600 bg-blue-100 rounded-full">
                            <UploadCloud className="w-6 h-6"/>
                        </div>
                        <h3 className="mb-1 text-lg font-bold text-gray-900">Your Submission</h3>
                        <p className="mb-6 text-xs text-gray-500">Upload PDF, DOCX, or ZIP</p>
                        
                        <input 
                            type="file" 
                            onChange={(e) => setFile(e.target.files[0])} 
                            className="block w-full mb-4 text-sm text-gray-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" 
                        />
                        
                        <button 
                            onClick={handleSubmit} 
                            disabled={!file || submitting}
                            className={`w-full py-2.5 px-4 font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center ${
                                !file || submitting 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                            }`}
                        >
                            {submitting ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin"/> Uploading...
                                </>
                            ) : (
                                "Submit Assignment"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AssignmentView;