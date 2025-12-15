// StudentAssignments.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Clock, Upload, CheckCircle, AlertCircle, 
  FileText, Calendar, Download 
} from 'lucide-react';

function StudentAssignments() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAssignment, setUploadingAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchCourseAndAssignments();
  }, [slug]);

  const fetchCourseAndAssignments = async () => {
    try {
      // Fetch course details
      const courseResponse = await fetch(`http://localhost:8000/api/courses/${slug}/`);
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData);

        // Fetch assignments for this course
        const assignmentsResponse = await fetch(
          `http://localhost:8000/api/assignments/?course_id=${courseData.course_id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          setAssignments(assignmentsData);
        }
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e, assignmentId) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile({ assignmentId, file });
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    if (!selectedFile || selectedFile.assignmentId !== assignmentId) {
      alert('Please select a file to upload');
      return;
    }

    setUploadingAssignment(assignmentId);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile.file);
      formData.append('assignment_id', assignmentId);

      const response = await fetch('http://localhost:8000/api/assignments/submit/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Assignment submitted successfully!');
        setSelectedFile(null);
        fetchCourseAndAssignments();
      } else {
        alert('Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error submitting assignment');
    } finally {
      setUploadingAssignment(null);
    }
  };

  const getStatusBadge = (assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    
    if (assignment.submitted_at) {
      if (assignment.grade) {
        return (
          <span className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
            <CheckCircle size={16} />
            Graded: {assignment.grade}
          </span>
        );
      }
      return (
        <span className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
          <CheckCircle size={16} />
          Submitted
        </span>
      );
    }
    
    if (now > dueDate) {
      return (
        <span className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full">
          <AlertCircle size={16} />
          Overdue
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full">
        <Clock size={16} />
        Pending
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `${diff} days remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(`/student/course/${slug}`)}
            className="flex items-center gap-2 mb-4 text-indigo-600 hover:text-indigo-700"
          >
            <ChevronLeft size={20} />
            Back to Course
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
          <p className="mt-1 text-gray-600">Assignments</p>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {assignments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-lg shadow-sm">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No assignments available yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => {
              const isSubmitted = assignment.submitted_at;
              const isGraded = assignment.grade;

              return (
                <div key={assignment.id} className="overflow-hidden bg-white rounded-lg shadow-sm">
                  {/* Assignment Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="mb-1 text-xl font-bold text-white">
                          {assignment.title}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-indigo-100">
                          <span className="flex items-center gap-2">
                            <Calendar size={16} />
                            Due: {formatDate(assignment.due_date)}
                          </span>
                          <span className="font-medium text-white">
                            {getDaysRemaining(assignment.due_date)}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(assignment)}
                    </div>
                  </div>

                  {/* Assignment Content */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {assignment.description}
                      </p>
                    </div>

                    {/* Assignment File (if any) */}
                    {assignment.file && (
                      <div className="mb-6">
                        <h3 className="mb-2 font-semibold text-gray-900">Resources</h3>
                        <a
                          href={assignment.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                        >
                          <Download size={16} />
                          Download assignment materials
                        </a>
                      </div>
                    )}

                    {/* Submission Section */}
                    {!isSubmitted ? (
                      <div className="pt-6 border-t">
                        <h3 className="mb-4 font-semibold text-gray-900">Submit Your Work</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <input
                              type="file"
                              onChange={(e) => handleFileSelect(e, assignment.id)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              accept=".pdf,.doc,.docx,.zip"
                            />
                            {selectedFile?.assignmentId === assignment.id && (
                              <p className="mt-2 text-sm text-gray-600">
                                Selected: {selectedFile.file.name}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleSubmitAssignment(assignment.id)}
                            disabled={uploadingAssignment === assignment.id}
                            className={`
                              flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition
                              ${uploadingAssignment === assignment.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }
                            `}
                          >
                            {uploadingAssignment === assignment.id ? (
                              <>
                                <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload size={16} />
                                Submit
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-6 border-t">
                        <h3 className="mb-4 font-semibold text-gray-900">Submission Details</h3>
                        <div className="p-4 rounded-lg bg-green-50">
                          <div className="flex items-center gap-3 mb-3">
                            <CheckCircle size={20} className="text-green-600" />
                            <span className="font-medium text-green-900">
                              Submitted on {formatDate(assignment.submitted_at)}
                            </span>
                          </div>
                          
                          {isGraded && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between py-2 border-t border-green-200">
                                <span className="font-medium text-green-900">Grade:</span>
                                <span className="text-2xl font-bold text-green-700">
                                  {assignment.grade}
                                </span>
                              </div>
                              
                              {assignment.feedback && (
                                <div className="pt-3 border-t border-green-200">
                                  <h4 className="mb-2 font-medium text-green-900">
                                    Teacher Feedback:
                                  </h4>
                                  <p className="text-green-800 whitespace-pre-wrap">
                                    {assignment.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {!isGraded && (
                            <p className="text-sm text-green-800">
                              Your assignment is being reviewed by the teacher.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentAssignments;