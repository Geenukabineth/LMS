// components/student/ExamScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Loader, 
  PlayCircle, 
  Save, 
  CheckCircle, 
  XCircle, 
  BarChart2,
  Lock // ✅ Imported Lock icon
} from "lucide-react";
import { courseService } from "@/config/course.config";

export default function ExamScreen() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  // shared states
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // flow state
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null); // Stores result after submission

  // attempt states
  const [answers, setAnswers] = useState({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // timeLeft: number seconds OR null
  const [timeLeft, setTimeLeft] = useState(null);

  // ---------------------------
  // Load quiz details
  // ---------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await courseService.getQuizDetail(quizId);
        setQuiz(data);

        if (data?.time_limit) setTimeLeft(data.time_limit * 60);
        else setTimeLeft(null);
      } catch (e) {
        setErr("Failed to load exam details.");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) load();
    else {
      setLoading(false);
      setErr("Invalid URL: quizId missing.");
    }
  }, [quizId]);

  // ---------------------------
  // Normalize questions safely
  // ---------------------------
  const questions = useMemo(() => {
    const q = quiz?.questions;
    if (Array.isArray(q)) return q;
    if (Array.isArray(q?.results)) return q.results;
    return [];
  }, [quiz]);

  const totalQuestions = questions.length;
  const currentQ = questions[currentQIndex];

  // ---------------------------
  // Timer logic
  // ---------------------------
  useEffect(() => {
    if (!started || result) return; // Stop timer if result is shown
    if (timeLeft === null) return;
    if (submitting) return;

    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }

    // auto-submit only when time_limit exists
    if (quiz?.time_limit && timeLeft === 0) {
      submitQuiz(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, timeLeft, quiz, submitting, result]);

  // ---------------------------
  // Helpers
  // ---------------------------
  const formatTime = (s) => {
    if (typeof s !== "number") return "";
    const mm = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const safeOptions = (q) => {
    const raw = q?.options;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const selectOption = (questionId, optionValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        question: questionId,
        selected_option: optionValue,
        text_answer: prev?.[questionId]?.text_answer ?? null,
      },
    }));
  };

  const setEssay = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        question: questionId,
        selected_option: null,
        text_answer: text,
      },
    }));
  };

  const submitQuiz = async (isAuto = false) => {
    if (submitting || !quiz) return;
    setSubmitting(true);

    try {
      const formattedAnswers = Object.values(answers).map((a) => ({
        question: a.question,
        selected_option: a.selected_option ?? null,
        text_answer: a.text_answer ?? null,
      }));

      const response = await courseService.submitQuizAttempt({
        quiz: quiz.id,
        answers: formattedAnswers,
      });

      // Instead of navigating away, set the result to show the Result Screen
      setResult(response || {}); 
      if (isAuto) alert("Time is up! Exam submitted automatically.");

    } catch (e) {
      console.error(e);
      // Check if it's the specific attempts exceeded error from backend
      if (e.response?.data?.code === 'attempts_exceeded') {
        alert("Submission Failed: You have exceeded the maximum number of attempts.");
        navigate(`/student/courses/${courseId}`);
      } else {
        alert("Submission Failed. Please try again.");
      }
      setSubmitting(false); 
    }
  };

  // ---------------------------
  // (0) LOADING / ERROR
  // ---------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 font-medium text-gray-500">Loading Exam...</p>
      </div>
    );
  }

  if (err || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="w-full max-w-md p-8 text-center bg-white border border-red-100 shadow-sm rounded-2xl">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
          <p className="mt-4 text-lg font-medium text-gray-800">{err || "Exam not available."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 mt-6 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------
  // (3) RESULTS SCREEN 
  // ---------------------------
  if (result) {
    const score = result.score ?? 0;
    // Fallback logic if backend doesn't send total/passed
    const total = 100; 
    const passed = result.passed ?? (score >= 50); 
    const percentage = Math.round(score) || 0;

    return (
      <div className="min-h-screen px-4 py-10 bg-gray-50">
        <div className="max-w-2xl mx-auto overflow-hidden bg-white border shadow-lg rounded-2xl">
          <div className={`${passed ? 'bg-green-600' : 'bg-red-500'} p-8 text-center text-white`}>
            {passed ? <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-90" /> : <XCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />}
            <h1 className="text-3xl font-bold">{passed ? "Excellent Work!" : "Keep Practicing"}</h1>
            <p className="mt-2 opacity-90">You have completed {quiz.title}</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="mb-1 text-sm text-gray-500">Score</div>
                <div className="text-2xl font-bold text-blue-700">{score}</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="mb-1 text-sm text-gray-500">Percentage</div>
                <div className="text-2xl font-bold text-purple-700">{percentage}%</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="mb-1 text-sm text-gray-500">Status</div>
                <div className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {passed ? "Passed" : "Failed"}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/student/courses/${courseId}`)}
                className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------
  // (1) START SCREEN (With Lock Logic)
  // ---------------------------
  if (!started) {
    // ✅ Extract backend lock status
    const userStatus = quiz.user_status || {};
    const isLocked = userStatus.is_locked;
    const attemptsUsed = userStatus.attempts_used || 0;
    const attemptsTotal = userStatus.attempts_allowed || quiz.attempts || 1;
    const attemptsRemaining = userStatus.attempts_remaining ?? (attemptsTotal - attemptsUsed);

    // ✅ LOCK SCREEN
    if (isLocked) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
          <div className="w-full max-w-md p-8 text-center bg-white border border-gray-200 shadow-lg rounded-2xl">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full">
              <Lock className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">Quiz Locked</h1>
            <p className="mt-2 text-gray-500">
              You have used all available attempts for this assessment.
            </p>

            <div className="p-4 mt-6 bg-gray-50 rounded-xl">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">Attempts Used:</span>
                <span className="font-bold text-gray-900">{attemptsUsed} / {attemptsTotal}</span>
              </div>
              {/* Progress bar for attempts */}
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/student/courses/${courseId}`)}
              className="w-full py-3 mt-8 font-bold text-white transition-colors bg-gray-800 rounded-xl hover:bg-gray-900"
            >
              Back to Course
            </button>
          </div>
        </div>
      );
    }

    // ✅ NORMAL START SCREEN (Unlocked)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-2xl overflow-hidden bg-white border shadow-lg rounded-2xl">
          <div className="h-4 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          
          <div className="p-8">
            <button
              onClick={() => navigate(`/student/courses/${courseId}`)}
              className="flex items-center mb-6 text-sm font-medium text-gray-500 transition-colors hover:text-blue-600"
            >
              <ChevronLeft size={16} className="mr-1" /> Back to Course
            </button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{quiz.title}</h1>
                <p className="flex items-center gap-2 mt-2 text-gray-500">
                   <BarChart2 size={16} /> Final Assessment
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              {/* Time Limit Block */}
              <div className="flex items-center gap-4 p-5 border border-blue-100 bg-blue-50 rounded-xl">
                <div className="p-3 text-blue-600 bg-white rounded-lg shadow-sm">
                   <Clock size={24} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Time Limit</div>
                  <div className="text-lg font-bold text-gray-900">
                    {quiz.time_limit ? `${quiz.time_limit} mins` : "No limit"}
                  </div>
                </div>
              </div>

              {/* Attempts Remaining Block */}
              <div className="flex items-center gap-4 p-5 border border-purple-100 bg-purple-50 rounded-xl">
                <div className="p-3 text-purple-600 bg-white rounded-lg shadow-sm">
                   <AlertCircle size={24} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Attempts Left</div>
                  <div className="text-lg font-bold text-gray-900">
                    {attemptsRemaining} / {attemptsTotal}
                  </div>
                </div>
              </div>
            </div>

            {quiz.description && (
              <div className="p-6 mt-8 border border-gray-100 bg-gray-50 rounded-xl">
                <div className="mb-2 font-semibold text-gray-900">Instructions</div>
                <div className="leading-relaxed text-gray-600 whitespace-pre-wrap">{quiz.description}</div>
              </div>
            )}

            <button
              onClick={() => setStarted(true)}
              className="mt-8 w-full group relative flex items-center justify-center gap-3 px-8 py-4 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <PlayCircle size={20} className="transition-transform group-hover:scale-110" />
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------
  // (2) ATTEMPT UI (Taking the Quiz)
  // ---------------------------
  
  // Progress Bar Calculation
  const progressPercent = ((currentQIndex + 1) / totalQuestions) * 100;

  if (!totalQuestions || !currentQ) {
    return <div className="p-10 text-center">Error: Question data missing.</div>;
  }

  const options = safeOptions(currentQ);
  const isLast = currentQIndex === totalQuestions - 1;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex flex-col">
               <h2 className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{quiz.title}</h2>
               <span className="text-xs text-gray-500">Q{currentQIndex + 1} of {totalQuestions}</span>
            </div>

            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm shadow-sm border ${
                  timeLeft < 60 ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                <Clock size={16} />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-100">
          <div 
            className="h-full transition-all duration-500 ease-out bg-blue-600" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl p-4 pb-24 mx-auto sm:p-6">
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
          
          {/* Question Text */}
          <div className="p-6 border-b border-gray-100 sm:p-8 bg-gray-50/50">
             <h3 className="text-xl font-semibold leading-snug text-gray-800 sm:text-2xl">
               {currentQ.question}
             </h3>
             {currentQ.image && (
                <div className="mt-6">
                  <img
                    src={currentQ.image}
                    alt="Question Ref"
                    className="max-h-[400px] w-auto object-contain rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              )}
          </div>

          {/* Answer Area */}
          <div className="p-6 sm:p-8">
            {currentQ.type === "essay" ? (
              <textarea
                className="w-full p-4 text-lg text-gray-700 transition-all border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={8}
                value={answers[currentQ.id]?.text_answer || ""}
                onChange={(e) => setEssay(currentQ.id, e.target.value)}
                placeholder="Type your answer here..."
              />
            ) : options.length > 0 ? (
              <div className="grid gap-3">
                {options.map((opt, idx) => {
                  const value = opt ?? "";
                  const isSelected = answers[currentQ.id]?.selected_option === value;
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => selectOption(currentQ.id, value)}
                      className={`
                        relative flex items-center p-4 cursor-pointer rounded-xl border-2 transition-all duration-200
                        ${isSelected 
                          ? "border-blue-500 bg-blue-50/50 shadow-md transform scale-[1.01]" 
                          : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                        }
                      `}
                    >
                      <div className={`
                        w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"}
                      `}>
                         {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                      <span className={`text-lg ${isSelected ? "font-medium text-blue-900" : "text-gray-700"}`}>
                        {value || `Option ${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
               <p className="italic text-gray-500">No options available for this question.</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            disabled={currentQIndex === 0}
            onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
            className="flex items-center gap-2 px-6 py-3 font-medium text-gray-600 transition-colors rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} /> Prev
          </button>

          {isLast ? (
            <button
              onClick={() => submitQuiz(false)}
              disabled={submitting}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                ${submitting ? "bg-gray-400 cursor-wait" : "bg-green-600 hover:bg-green-700 hover:shadow-green-200 hover:-translate-y-0.5"}
              `}
            >
              {submitting ? (
                <> <Loader size={20} className="animate-spin" /> Processing... </>
              ) : (
                <> Finish Assessment <Save size={20} /> </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQIndex((i) => Math.min(totalQuestions - 1, i + 1))}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-0.5 transition-all"
            >
              Next Question <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}