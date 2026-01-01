import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const AssignmentView = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  // Mock Data
  const [assignmentData, setAssignmentData] = useState({
    title: "Project: Build a React Component",
    description: "Create a reusable button component that accepts props for color, size, and onClick behavior. Upload your .jsx file below.",
    due_date: "2024-12-31",
    points: 100,
    status: "pending" // pending, submitted, graded
  });

  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // API call logic would go here
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Course
        </button>

        <div className="grid gap-6">
          
          {/* Assignment Details Card */}
          <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">{assignmentData.title}</h1>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Due: {assignmentData.due_date}</span>
                  <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {assignmentData.points} Points</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${isSubmitted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {isSubmitted ? 'Submitted' : 'Pending'}
              </div>
            </div>
            
            <div className="prose text-gray-700">
              <h3 className="text-lg font-semibold text-gray-900">Instructions</h3>
              <p>{assignmentData.description}</p>
            </div>
          </div>

          {/* Submission Card */}
          <div className="p-8 bg-white border border-gray-200 shadow-sm rounded-xl">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Your Submission</h2>
            
            {isSubmitted ? (
              <div className="py-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Assignment Submitted!</h3>
                <p className="mb-6 text-gray-500">Submitted on {new Date().toLocaleDateString()}</p>
                <button 
                  onClick={() => navigate(-1)}
                  className="px-6 py-2 font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Return to Course
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* File Upload Area */}
                <div className="relative p-8 text-center transition-colors border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50">
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  {file ? (
                    <div>
                      <p className="font-medium text-blue-600">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-gray-700">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PDF, DOCX, ZIP up to 10MB</p>
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Additional Comments</label>
                  <textarea 
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes for your instructor..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!file}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                    file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Submit Assignment
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AssignmentView;  