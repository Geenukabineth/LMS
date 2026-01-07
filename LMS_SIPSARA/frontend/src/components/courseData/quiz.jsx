// components/quiz.jsx
import React, { useEffect, useState } from "react";
import {
  Plus, Trash2, Save, FileText, HelpCircle,
} from "lucide-react";
import { courseService } from "@/config/course.config"; // ✅ Imported Service

const AssignmentQuizPanel = ({ courseId, defaultTab = "assignment" }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  // --- Assignment State ---
  const [assignment, setAssignment] = useState({
    title: "", description: "", dueDate: "", points: 100, file: null,
  });

  // --- Quiz State ---
  const [quiz, setQuiz] = useState({
    title: "", description: "", timeLimit: 60, attempts: 1, shuffleQuestions: false, questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState(initQuestionState());

  function initQuestionState() {
    return { type: "multiple_choice", question: "", points: 1, options: ["", ""], correctAnswer: "", explanation: "" };
  }

  // --- Load Modules ---
  useEffect(() => {
    if (!courseId) return;
    courseService.getCourseModules(courseId)
      .then((data) => {
        const mods = Array.isArray(data?.modules) ? data.modules : [];
        setModules(mods);
        if (mods.length > 0) setSelectedModuleId(String(mods[0].id));
      })
      .catch((e) => console.error(e));
  }, [courseId]);

  // --- Helper Functions ---
  const addQuestion = () => {
    if (!currentQuestion.question.trim()) return;
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, _tempId: Date.now() }]
    }));
    setCurrentQuestion(initQuestionState());
  };

  const removeQuestion = (id) => {
    setQuiz(prev => ({ ...prev, questions: prev.questions.filter(q => q._tempId !== id) }));
  };

  // --- SAVE LOGIC ---
  const saveContent = async () => {
    if (!selectedModuleId) return setStatus({ type: "error", msg: "Please select a module first." });

    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      // Step 1: Create Lesson via Service
      const lessonFD = new FormData();
      lessonFD.append("module", selectedModuleId);
      lessonFD.append("title", activeTab === "assignment" ? assignment.title : quiz.title);
      lessonFD.append("content_type", activeTab);
      
      // ✅ Use courseService
      const lessonResponse = await courseService.createLesson(lessonFD);
      const lessonId = lessonResponse.id;

      if (activeTab === "assignment") {
        // Step 2 (Assignment): Create via Service
        const assignFD = new FormData();
        assignFD.append("lesson", lessonId);
        assignFD.append("title", assignment.title);
        assignFD.append("description", assignment.description);
        assignFD.append("points", assignment.points);
        if (assignment.dueDate) assignFD.append("due_date", assignment.dueDate);
        if (assignment.file) assignFD.append("file", assignment.file);

        // ✅ Use courseService
        await courseService.createAssignment(assignFD);
      
      } else {
        // Step 2 (Quiz): Create via Service
        const quizData = {
          lesson: lessonId,
          title: quiz.title,
          description: quiz.description,
          time_limit: quiz.timeLimit,
          attempts: quiz.attempts,
          shuffle_questions: quiz.shuffleQuestions
        };

        // ✅ Use courseService
        const quizResponse = await courseService.createQuiz(quizData);
        const quizId = quizResponse.id;

        // Step 3 (Questions): Loop and create via Service
        for (const q of quiz.questions) {
          await courseService.createQuizQuestion({
            quiz: quizId,
            type: q.type,
            question: q.question,
            points: q.points,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation
          });
        }
      }

      setStatus({ type: "success", msg: `${activeTab === 'quiz' ? 'Quiz' : 'Assignment'} created successfully!` });
      setAssignment({ title: "", description: "", dueDate: "", points: 100, file: null });
      setQuiz({ title: "", description: "", timeLimit: 60, attempts: 1, shuffleQuestions: false, questions: [] });

    } catch (error) {
      console.error(error);
      setStatus({ type: "error", msg: "Failed to save." });
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (Your existing JSX UI remains exactly the same)
    <div className="max-w-5xl p-6 mx-auto bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Simplified Header for brevity in this snippet */}
        <div className="p-6 text-white bg-blue-600 rounded-t-lg">
          <h1 className="text-2xl font-bold">Create Assessment</h1>
        </div>
        
        {/* Module Selector */}
        <div className="p-6 border-b">
           {status.msg && <div className={`p-3 mb-4 rounded ${status.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>{status.msg}</div>}
           <select value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} className="w-full p-2 border rounded">
            {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b">
          <button onClick={() => setActiveTab("assignment")} className={`flex-1 py-4 ${activeTab === 'assignment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Assignment</button>
          <button onClick={() => setActiveTab("quiz")} className={`flex-1 py-4 ${activeTab === 'quiz' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Quiz</button>
        </div>

        {/* Forms Container */}
        <div className="p-8">
            {activeTab === "assignment" ? (
                /* Assignment Form Inputs */
                <div className="space-y-4">
                    <input type="text" placeholder="Title" className="w-full p-2 border rounded" value={assignment.title} onChange={e => setAssignment({...assignment, title: e.target.value})} />
                    <textarea placeholder="Description" className="w-full p-2 border rounded" value={assignment.description} onChange={e => setAssignment({...assignment, description: e.target.value})} />
                    <input type="datetime-local" className="w-full p-2 border rounded" value={assignment.dueDate} onChange={e => setAssignment({...assignment, dueDate: e.target.value})} />
                    <input type="number" placeholder="Points" className="w-full p-2 border rounded" value={assignment.points} onChange={e => setAssignment({...assignment, points: e.target.value})} />
                    <input type="file" onChange={e => setAssignment({...assignment, file: e.target.files[0]})} />
                </div>
            ) : (
                /* Quiz Form Inputs */
                <div className="space-y-4">
                    <input type="text" placeholder="Title" className="w-full p-2 border rounded" value={quiz.title} onChange={e => setQuiz({...quiz, title: e.target.value})} />
                    <div className="p-4 border rounded">
                        <h3 className="mb-2 font-bold">Add Question</h3>
                        <textarea placeholder="Question" className="w-full p-2 mb-2 border rounded" value={currentQuestion.question} onChange={e => setCurrentQuestion({...currentQuestion, question: e.target.value})} />
                        <button onClick={addQuestion} className="px-4 py-2 text-white bg-green-500 rounded">Add Question</button>
                    </div>
                    {/* List Preview */}
                    {quiz.questions.map((q, i) => <div key={i} className="flex justify-between p-2 bg-gray-100"><span>Q{i+1}: {q.question}</span> <button onClick={() => removeQuestion(q._tempId)}><Trash2 size={16}/></button></div>)}
                </div>
            )}
            
            <button onClick={saveContent} disabled={loading} className="w-full py-3 mt-6 text-white bg-blue-600 rounded">
                {loading ? "Saving..." : "Save Assessment"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentQuizPanel;