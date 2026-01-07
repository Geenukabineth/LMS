// components/QuizAttemptView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { courseService } from "@/config/course.config";

const QuizAttemptView = () => {
  const { id, courseId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); 
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
        try {
            setLoading(true);
            // 1. Try finding Quiz by LESSON ID (from sidebar)
            const listRes = await courseService.getQuizzes(id);
            if(Array.isArray(listRes) && listRes.length > 0) {
                setQuiz(listRes[0]);
                if(listRes[0].time_limit) setTimeLeft(listRes[0].time_limit * 60);
            } else {
                // 2. Fallback to QUIZ ID
                const detailRes = await courseService.getQuizDetail(id);
                setQuiz(detailRes);
                if(detailRes.time_limit) setTimeLeft(detailRes.time_limit * 60);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to load quiz. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };
    
    if(id) fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (quiz && timeLeft === 0 && quiz.time_limit) {
      submitQuiz();
    }
  }, [timeLeft, quiz]);

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
      
      await courseService.submitQuizAttempt({
        quiz: quiz.id, // Use the real Quiz ID
        answers: formattedAnswers
      });
      
      alert("Quiz Submitted Successfully!");
      navigate(`/student/course/${courseId}`);
    } catch (err) {
      console.error(err);
      alert("Submission Failed.");
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Exam...</div>;
  if (!quiz) return <div className="p-10 text-center text-red-500">Quiz not found</div>;

  const currentQ = quiz.questions[currentQIndex];
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 p-4 bg-white shadow">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
            <h2 className="text-lg font-bold">{quiz.title}</h2>
            <div className={`font-mono font-bold px-3 py-1 rounded ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {formatTime(timeLeft)}
            </div>
        </div>
      </div>

      <div className="max-w-3xl p-8 mx-auto mt-8 bg-white rounded shadow">
        <div className="mb-6">
            <span className="text-sm font-bold text-gray-500 uppercase">Question {currentQIndex + 1} of {quiz.questions.length}</span>
            <h3 className="mt-2 text-xl font-medium">{currentQ.question}</h3>
        </div>
        
        <div className="space-y-3">
            {currentQ.options.map((opt, idx) => (
                <div 
                    key={idx} 
                    onClick={() => handleOptionSelect(currentQ.id, opt)} 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        answers[currentQ.id]?.selected_option === opt 
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                >
                    <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                             answers[currentQ.id]?.selected_option === opt ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                        }`}>
                            {answers[currentQ.id]?.selected_option === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        {opt}
                    </div>
                </div>
            ))}
        </div>

        <div className="flex justify-between pt-6 mt-8 border-t">
            <button 
                disabled={currentQIndex === 0} 
                onClick={() => setCurrentQIndex(i => i-1)} 
                className="flex items-center px-4 py-2 text-gray-600 rounded disabled:opacity-50 hover:bg-gray-100"
            >
                <ChevronLeft size={20} /> Previous
            </button>
            
            {currentQIndex === quiz.questions.length - 1 ? (
                <button 
                    onClick={submitQuiz} 
                    disabled={submitting} 
                    className="flex items-center px-6 py-2 text-white bg-green-600 rounded shadow-md hover:bg-green-700"
                >
                    <Save size={18} className="mr-2"/> Submit Exam
                </button>
            ) : (
                <button 
                    onClick={() => setCurrentQIndex(i => i+1)} 
                    className="flex items-center px-6 py-2 text-white bg-blue-600 rounded shadow-md hover:bg-blue-700"
                >
                    Next <ChevronRight size={20} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptView;