import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Save
} from 'lucide-react';

const QuizAttemptView = () => {
  const { quizId } = useParams(); // Get ID from URL
  const navigate = useNavigate();

  // Mock Data - In real app, fetch this using useEffect and quizId
  const [quizData, setQuizData] = useState({
    title: "Module 1 Assessment",
    duration_minutes: 15,
    questions: [
      {
        id: 1,
        question: "What is the primary function of React?",
        options: [
          { id: 'a', text: "Database management" },
          { id: 'b', text: "Building user interfaces" },
          { id: 'c', text: "Server-side routing" },
          { id: 'd', text: "Operating system operations" }
        ],
        correct_option: 'b'
      },
      {
        id: 2,
        question: "Which hook is used for side effects?",
        options: [
          { id: 'a', text: "useState" },
          { id: 'b', text: "useContext" },
          { id: 'c', text: "useEffect" },
          { id: 'd', text: "useReducer" }
        ],
        correct_option: 'c'
      }
    ]
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: optionId }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const totalQuestions = quizData.questions.length;

  const handleOptionSelect = (optionId) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    quizData.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct_option) {
        correctCount++;
      }
    });
    setScore((correctCount / totalQuestions) * 100);
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

        {/* Quiz Card */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
          
          {/* Quiz Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quizData.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
            </div>
            {!isSubmitted && (
              <div className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 rounded-full bg-blue-50">
                <Clock className="w-4 h-4" />
                <span>{quizData.duration_minutes}:00</span>
              </div>
            )}
          </div>

          <div className="p-8">
            {isSubmitted ? (
              // RESULT VIEW
              <div className="py-8 text-center">
                <div className={`mx-auto w-20 h-20 flex items-center justify-center rounded-full mb-4 ${score >= 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {score >= 70 ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Quiz Completed!</h2>
                <p className="mb-6 text-gray-600">You scored {score.toFixed(0)}%</p>
                
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Return to Course
                  </button>
                  <button 
                    onClick={() => {
                      setIsSubmitted(false);
                      setSelectedAnswers({});
                      setCurrentQuestionIndex(0);
                    }}
                    className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Retry Quiz
                  </button>
                </div>
              </div>
            ) : (
              // QUESTION VIEW
              <>
                <h2 className="mb-6 text-lg font-medium leading-relaxed text-gray-900">
                  {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <div 
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                        selectedAnswers[currentQuestion.id] === option.id
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`font-medium ${selectedAnswers[currentQuestion.id] === option.id ? 'text-blue-700' : 'text-gray-700'}`}>
                        {option.text}
                      </span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedAnswers[currentQuestion.id] === option.id
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswers[currentQuestion.id] === option.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer / Navigation */}
                <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-100">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      currentQuestionIndex === 0 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  {currentQuestionIndex === totalQuestions - 1 ? (
                    <button
                      onClick={calculateScore}
                      className="flex items-center gap-2 px-6 py-2 font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" /> Submit Quiz
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                      className="flex items-center gap-2 px-6 py-2 font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptView;