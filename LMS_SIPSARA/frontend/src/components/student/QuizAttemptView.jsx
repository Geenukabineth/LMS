// components/QuizAttemptView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, ChevronLeft, Save, AlertCircle, Loader } from 'lucide-react';
import { courseService } from "@/config/course.config";

const QuizAttemptView = () => {
  const params = useParams();
  const navigate = useNavigate();
  
  // ✅ FIX: Robustly get the ID regardless of what the route calls it
  const routeId = params.id || params.quizId || params.lessonId;
  const courseId = params.courseId;

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); 
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuiz = async () => {
        // ✅ FIX: If no ID found, stop loading and show error
        if (!routeId) {
            setError("Invalid URL: No Quiz ID found.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");
            console.log("🔍 Fetching Quiz for ID:", routeId);

            // ----------------------------------------------------
            // STRATEGY 1: Try ID as QUIZ ID (Primary)
            // ----------------------------------------------------
            try {
                const detailRes = await courseService.getQuizDetail(routeId);
                if (detailRes && detailRes.id) {
                    setQuiz(detailRes);
                    if(detailRes.time_limit) setTimeLeft(detailRes.time_limit * 60);
                    setLoading(false);
                    return; // ✅ Success using Quiz ID
                }
            } catch (ignore) {
                console.warn("⚠️ ID is not a direct Quiz ID. Trying Lesson ID fallback...");
            }

            // ----------------------------------------------------
            // STRATEGY 2: Fallback to LESSON ID
            // ----------------------------------------------------
            // If the URL has a Lesson ID (e.g. from sidebar), find the linked quiz
            const listRes = await courseService.getQuizzes(routeId);
            
            if(Array.isArray(listRes) && listRes.length > 0) {
                const fetchedQuiz = listRes[0];
                setQuiz(fetchedQuiz);
                if(fetchedQuiz.time_limit) setTimeLeft(fetchedQuiz.time_limit * 60);
            } else {
                throw new Error("Quiz not found.");
            }

        } catch (err) {
            console.error("❌ Quiz load error:", err);
            setError("Failed to load quiz. It might not exist or connection failed.");
        } finally {
            setLoading(false);
        }
    };
    
    fetchQuiz();
  }, [routeId]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft > 0 && !submitting) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (quiz && timeLeft === 0 && quiz.time_limit && !submitting) {
      submitQuiz(); // Auto-submit
    }
  }, [timeLeft, quiz, submitting]);

  const handleOptionSelect = (questionId, optionValue) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { question: questionId, selected_option: optionValue }
    }));
  };

  const submitQuiz = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);
    
    try {
      const formattedAnswers = Object.values(answers);
      
      // ✅ FIX: Use quiz.id (the real ID from DB), ignoring URL parameter
      await courseService.submitQuizAttempt({
        quiz: quiz.id, 
        answers: formattedAnswers
      });
      
      alert("Quiz Submitted Successfully!");
      navigate(`/student/course/${courseId}`);
    } catch (err) {
      console.error(err);
      alert("Submission Failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 mb-4 text-blue-600 animate-spin" />
        <p className="text-gray-500">Loading Exam...</p>
    </div>
  );
  
  if (error || !quiz) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="w-full max-w-md p-8 text-center bg-white border border-red-200 rounded-lg shadow-sm">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="mb-2 text-xl font-bold text-gray-900">Unable to Load Quiz</h3>
            <p className="mb-6 text-gray-600">{error || "Quiz data unavailable."}</p>
            <button 
                onClick={() => navigate(-1)} 
                className="px-6 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
                Go Back
            </button>
        </div>
    </div>
  );

  const currentQ = quiz.questions[currentQIndex];
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between max-w-3xl px-6 py-4 mx-auto">
            <div>
                <h2 className="text-lg font-bold text-gray-800">{quiz.title}</h2>
                <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Question {currentQIndex + 1} of {quiz.questions.length}
                </span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${
                timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}>
                <Clock size={18} />
                {formatTime(timeLeft)}
            </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-3xl p-8 mx-auto mt-8 bg-white border border-gray-100 shadow-md rounded-xl">
        <h3 className="mb-8 text-xl font-medium leading-relaxed text-gray-900">
            {currentQ.question}
        </h3>
        
        <div className="space-y-3">
            {currentQ.options.map((opt, idx) => (
                <div 
                    key={idx} 
                    onClick={() => handleOptionSelect(currentQ.id, opt)} 
                    className={`group flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                        answers[currentQ.id]?.selected_option === opt 
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm' 
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                >
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                         answers[currentQ.id]?.selected_option === opt 
                         ? 'border-blue-500 bg-blue-500' 
                         : 'border-gray-400 group-hover:border-gray-500'
                    }`}>
                        {answers[currentQ.id]?.selected_option === opt && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        )}
                    </div>
                    <span className="text-gray-700">{opt}</span>
                </div>
            ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-8 mt-8 border-t border-gray-100">
            <button 
                disabled={currentQIndex === 0} 
                onClick={() => setCurrentQIndex(i => i-1)} 
                className="flex items-center px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft size={20} className="mr-1"/> Previous
            </button>
            
            {currentQIndex === quiz.questions.length - 1 ? (
                <button 
                    onClick={submitQuiz} 
                    disabled={submitting} 
                    className="flex items-center px-8 py-2.5 text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-70 transition-all hover:scale-105 active:scale-95"
                >
                    {submitting ? (
                        <span className="flex items-center gap-2">
                            <Loader size={18} className="animate-spin"/> Submitting...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Save size={18} /> Submit Exam
                        </span>
                    )}
                </button>
            ) : (
                <button 
                    onClick={() => setCurrentQIndex(i => i+1)} 
                    className="flex items-center px-8 py-2.5 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                >
                    Next <ChevronRight size={20} className="ml-1" />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptView;