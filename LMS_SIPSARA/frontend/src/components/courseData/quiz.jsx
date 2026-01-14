import React, { useEffect, useState } from "react";
import {
  Trash2, FileText, HelpCircle, Upload, Plus, X,
} from "lucide-react";
import { courseService } from "@/config/course.config";

const AssignmentQuizPanel = ({ courseId, defaultTab = "assignment", editData = null, onSuccess }) => {
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
    title: "", 
    description: "", 
    timeLimit: 60, 
    attempts: 1, 
    dueDate: "",
    shuffleQuestions: false, 
    questions: [],
  });

  // --- Current Question Builder State ---
  const [currentQuestion, setCurrentQuestion] = useState(initQuestionState());

  function initQuestionState() {
    return { 
      type: "multiple_choice", // Options: multiple_choice, image_mcq, matching
      question: "", 
      points: 1, 
      options: ["", "", "", ""], 
      pairs: [{ left: "", right: "" }], // For Matching
      correctAnswer: "", 
      explanation: "",
      image: null 
    };
  }

  // --- 1. Load Modules ---
  const fetchModules = () => {
    if (!courseId) return;
    courseService.getCourseModules(courseId)
      .then((data) => {
        const mods = Array.isArray(data?.modules) ? data.modules : [];
        setModules(mods);
        // Pre-select first module if creating new
        if (mods.length > 0 && !selectedModuleId && !editData) {
            setSelectedModuleId(String(mods[0].id));
        }
      })
      .catch((e) => console.error(e));
  };

  useEffect(() => { fetchModules(); }, [courseId]);

  // --- 2. Populate Data for Editing ---
  useEffect(() => {
    if (editData) {
      const isQuiz = defaultTab === 'quiz';
      setActiveTab(defaultTab);

      // Pre-select module if available
      if (editData.lesson_id || editData.lesson) {
          // You might need to fetch the lesson to find module ID, 
          // or assume it's set if your editData includes module info.
      }

      if (isQuiz) {
        setQuiz({
          title: editData.title || "",
          description: editData.description || "",
          timeLimit: editData.time_limit || 60,
          attempts: editData.attempts || 1,
          // Format ISO date to datetime-local input string
          dueDate: editData.due_date ? new Date(editData.due_date).toISOString().slice(0, 16) : "",
          shuffleQuestions: editData.shuffle_questions || false,
          questions: [] 
        });

        // Fetch Questions
        courseService.getQuizQuestions(editData.id).then(data => {
            const questions = Array.isArray(data) ? data : data.results || [];
            
            // ✅ Map backend snake_case to frontend camelCase
            const formattedQuestions = questions.map(q => ({
               ...q,
               correctAnswer: q.correct_answer, // Fix for "correct answer not showing"
               pairs: q.type === 'matching' ? q.options : [], 
               options: q.type !== 'matching' ? q.options : [],
               _tempId: q.id 
            }));
            setQuiz(prev => ({ ...prev, questions: formattedQuestions }));
          }).catch(err => console.error("Failed to load questions", err));

      } else {
        // Populate Assignment
        setAssignment({
          title: editData.title || "",
          description: editData.description || "",
          dueDate: editData.due_date ? new Date(editData.due_date).toISOString().slice(0, 16) : "",
          points: editData.points || 100,
          file: null 
        });
      }
    }
  }, [editData, defaultTab]);


  // --- Logic for Matching/Drag-Drop ---
  const handlePairChange = (index, field, value) => {
    const newPairs = [...currentQuestion.pairs];
    newPairs[index][field] = value;
    setCurrentQuestion({ ...currentQuestion, pairs: newPairs });
  };

  const addPair = () => {
    setCurrentQuestion(prev => ({ ...prev, pairs: [...prev.pairs, { left: "", right: "" }] }));
  };

  const removePair = (index) => {
    const newPairs = currentQuestion.pairs.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, pairs: newPairs });
  };

  // --- Logic for MCQ Options ---
  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  // --- Add Question to Local List ---
  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
        alert("Please enter a question text.");
        return;
    }

    // Validation
    if (currentQuestion.type === 'matching') {
        if(currentQuestion.pairs.some(p => !p.left || !p.right)) {
            alert("Please fill out all matching pairs.");
            return;
        }
    } else {
        if (!currentQuestion.correctAnswer) {
            alert("Please select a correct answer.");
            return;
        }
    }

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, _tempId: Date.now() }]
    }));
    setCurrentQuestion(initQuestionState());
  };

  const removeQuestion = async (id) => {
     // If real ID, we might want to ask confirmation or delete from DB immediately
     // For now, removing from UI list
    setQuiz(prev => ({ ...prev, questions: prev.questions.filter(q => q._tempId !== id) }));
  };

  // --- SAVE / UPDATE LOGIC ---
  const saveContent = async () => {
    if (!editData && !selectedModuleId) return setStatus({ type: "error", msg: "Please select a module first." });

    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      if (activeTab === "assignment") {
         // ... Assignment Save Logic (Same as before) ...
         const assignFD = new FormData();
         if(!editData) {
             const lessonFD = new FormData();
             lessonFD.append("module", selectedModuleId);
             lessonFD.append("title", assignment.title);
             lessonFD.append("content_type", "assignment");
             const lessonRes = await courseService.createLesson(lessonFD);
             assignFD.append("lesson", lessonRes.id);
         }
         assignFD.append("title", assignment.title);
         assignFD.append("description", assignment.description);
         assignFD.append("points", assignment.points);
         if (assignment.dueDate) assignFD.append("due_date", assignment.dueDate);
         if (assignment.file) assignFD.append("file", assignment.file);

         if(editData) await courseService.putAssignment(editData.id, assignFD);
         else await courseService.createAssignment(assignFD);

      } else {
         // === QUIZ SAVE LOGIC ===
         let quizId = editData?.id;

         const quizPayload = {
            title: quiz.title,
            description: quiz.description,
            time_limit: quiz.timeLimit,
            attempts: quiz.attempts,
            due_date: quiz.dueDate || null,
            shuffle_questions: quiz.shuffleQuestions
         };

         if (editData) {
             await courseService.putQuiz(quizId, quizPayload);
         } else {
             const lessonFD = new FormData();
             lessonFD.append("module", selectedModuleId);
             lessonFD.append("title", quiz.title);
             lessonFD.append("content_type", "quiz");
             const lessonRes = await courseService.createLesson(lessonFD);
             
             quizPayload.lesson = lessonRes.id;
             const quizRes = await courseService.createQuiz(quizPayload);
             quizId = quizRes.id;
         }

         // Save Questions (Loop)
         for (const q of quiz.questions) {
             const qFD = new FormData();
             qFD.append("quiz", quizId);
             qFD.append("type", q.type);
             qFD.append("question", q.question);
             qFD.append("points", q.points);
             qFD.append("explanation", q.explanation || "");

             // ✅ STRINGIFY JSON DATA for FormData
             if (q.type === 'matching') {
                 qFD.append("options", JSON.stringify(q.pairs));
                 qFD.append("correct_answer", "matching"); // Dummy value required by model
             } else {
                 qFD.append("options", JSON.stringify(q.options));
                 qFD.append("correct_answer", q.correctAnswer || "");
             }

             if (q.image instanceof File) {
                 qFD.append("image", q.image);
             }

             // Check if it's a NEW question (temp ID) or existing
             if (String(q._tempId).length > 10) { 
                 await courseService.createQuizQuestion(qFD);
             } else {
                 // For existing questions, usually use PUT. 
                 // If your backend supports partial update with multipart, use PUT here.
                 // Otherwise, delete old and create new is a lazy strategy, but PUT is better.
                 await courseService.putQuizQuestion(q._tempId, qFD);
             }
         }
      }

      setStatus({ type: "success", msg: "Saved successfully!" });
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error(error);
      setStatus({ type: "error", msg: "Failed to save." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl p-6 mx-auto bg-gray-50">
      <div className={`grid grid-cols-1 gap-6 ${editData ? '' : 'lg:grid-cols-3'}`}>
        
        {/* Main Form Area */}
        <div className={`bg-white rounded-lg shadow-lg ${editData ? 'col-span-1' : 'lg:col-span-2'}`}>
            <div className="p-6 text-white bg-blue-600 rounded-t-lg">
                <h1 className="text-2xl font-bold">{editData ? "Edit Assessment" : "Create Assessment"}</h1>
            </div>
            
            {/* Module Select (Only for new) */}
            {!editData && (
                <div className="p-6 border-b">
                    {status.msg && <div className={`p-3 mb-4 rounded ${status.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>{status.msg}</div>}
                    <select value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} className="w-full p-2 border rounded">
                        <option value="">-- Select Module --</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b">
                <button 
                    disabled={!!editData}
                    onClick={() => setActiveTab("assignment")} 
                    className={`flex-1 py-4 font-semibold ${activeTab === 'assignment' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'}`}
                >
                    Assignment
                </button>
                <button 
                    disabled={!!editData}
                    onClick={() => setActiveTab("quiz")} 
                    className={`flex-1 py-4 font-semibold ${activeTab === 'quiz' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'}`}
                >
                    Quiz
                </button>
            </div>

            <div className="p-8">
                {activeTab === "assignment" ? (
                    <div className="space-y-4">
                        <input type="text" placeholder="Title" className="w-full p-2 border rounded" value={assignment.title} onChange={e => setAssignment({...assignment, title: e.target.value})} />
                        <textarea placeholder="Instructions..." className="w-full h-24 p-2 border rounded" value={assignment.description} onChange={e => setAssignment({...assignment, description: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs text-gray-500">Due Date</label><input type="datetime-local" className="w-full p-2 border rounded" value={assignment.dueDate} onChange={e => setAssignment({...assignment, dueDate: e.target.value})} /></div>
                            <div><label className="text-xs text-gray-500">Points</label><input type="number" className="w-full p-2 border rounded" value={assignment.points} onChange={e => setAssignment({...assignment, points: e.target.value})} /></div>
                        </div>
                        <div className="p-4 border rounded bg-gray-50">
                             <label className="block mb-2 text-sm font-semibold">Attachment</label>
                             <input type="file" onChange={e => setAssignment({...assignment, file: e.target.files[0]})} />
                             {editData?.file && <p className="mt-2 text-xs text-blue-600">Current file: <a href={editData.file} target="_blank" rel="noreferrer">View File</a></p>}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* 1. Quiz Settings */}
                        <div className="p-4 border border-blue-100 rounded bg-blue-50">
                            <h3 className="mb-3 font-bold text-blue-800">1. Quiz Settings</h3>
                            <input type="text" placeholder="Quiz Title" className="w-full p-2 mb-2 border rounded" value={quiz.title} onChange={e => setQuiz({...quiz, title: e.target.value})} />
                            <textarea placeholder="Description" className="w-full p-2 mb-2 border rounded" value={quiz.description} onChange={e => setQuiz({...quiz, description: e.target.value})} />
                            <div className="grid grid-cols-3 gap-2">
                                <div><label className="text-xs text-gray-600">Duration (mins)</label><input type="number" className="w-full p-2 border rounded" value={quiz.timeLimit} onChange={e => setQuiz({...quiz, timeLimit: e.target.value})} /></div>
                                <div><label className="text-xs text-gray-600">Attempts</label><input type="number" className="w-full p-2 border rounded" value={quiz.attempts} onChange={e => setQuiz({...quiz, attempts: e.target.value})} /></div>
                                <div><label className="text-xs text-gray-600">Close Date</label><input type="datetime-local" className="w-full p-2 border rounded" value={quiz.dueDate} onChange={e => setQuiz({...quiz, dueDate: e.target.value})} /></div>
                            </div>
                        </div>

                        {/* 2. Question Builder */}
                        <div className="p-5 bg-white border rounded shadow-sm">
                            <h3 className="mb-4 text-lg font-bold text-gray-800">2. Add Question</h3>
                            
                            <div className="flex gap-4 mb-4">
                                <div className="w-1/3">
                                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Type</label>
                                    <select 
                                        className="w-full p-2 border rounded"
                                        value={currentQuestion.type}
                                        onChange={(e) => setCurrentQuestion({...initQuestionState(), type: e.target.value})}
                                    >
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="image_mcq">Image Based MCQ</option>
                                        <option value="matching">Drag & Drop (Matching)</option>
                                    </select>
                                </div>
                                <div className="w-1/4">
                                     <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Points</label>
                                     <input type="number" className="w-full p-2 border rounded" value={currentQuestion.points} onChange={e => setCurrentQuestion({...currentQuestion, points: e.target.value})} />
                                </div>
                            </div>

                            <div className="mb-4">
                                <textarea placeholder="Question text..." className="w-full p-2 border rounded" value={currentQuestion.question} onChange={e => setCurrentQuestion({...currentQuestion, question: e.target.value})} />
                                {(currentQuestion.type === 'image_mcq') && (
                                    <div className="mt-2">
                                        <label className="flex items-center gap-2 p-2 text-sm text-blue-600 border border-blue-200 border-dashed rounded cursor-pointer hover:bg-blue-50 w-fit">
                                            <Upload size={16}/> {currentQuestion.image ? "Change Image" : "Upload Image"}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setCurrentQuestion({...currentQuestion, image: e.target.files[0]})} />
                                        </label>
                                        {currentQuestion.image && <span className="ml-2 text-xs text-gray-500">{currentQuestion.image.name}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 mb-4 border rounded bg-gray-50">
                                {currentQuestion.type === 'matching' ? (
                                    <div>
                                        <label className="block mb-2 text-xs font-bold text-gray-500 uppercase">Matching Pairs</label>
                                        {currentQuestion.pairs.map((pair, idx) => (
                                            <div key={idx} className="flex items-center gap-2 mb-2">
                                                <span className="text-gray-400">{idx + 1}.</span>
                                                <input type="text" placeholder="Left" className="flex-1 p-2 bg-white border rounded" value={pair.left} onChange={(e) => handlePairChange(idx, 'left', e.target.value)} />
                                                <span className="text-gray-400">➔</span>
                                                <input type="text" placeholder="Right" className="flex-1 p-2 bg-white border rounded" value={pair.right} onChange={(e) => handlePairChange(idx, 'right', e.target.value)} />
                                                {idx > 0 && <button onClick={() => removePair(idx)} className="text-red-500"><X size={16}/></button>}
                                            </div>
                                        ))}
                                        <button onClick={addPair} className="flex items-center gap-1 mt-2 text-sm font-semibold text-blue-600 hover:underline"><Plus size={14}/> Add Pair</button>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block mb-2 text-xs font-bold text-gray-500 uppercase">Options (Select correct)</label>
                                        {currentQuestion.options.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-2 mb-2">
                                                <input type="radio" name="correct" checked={currentQuestion.correctAnswer === opt && opt !== ""} onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: opt})} disabled={!opt} />
                                                <input type="text" placeholder={`Option ${idx + 1}`} className="flex-1 p-2 bg-white border rounded" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={addQuestion} className="w-full py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700">+ Add Question</button>
                        </div>

                        {/* 3. Preview */}
                        <div className="space-y-2">
                           {quiz.questions.length > 0 && <label className="text-sm font-bold text-gray-600">Questions ({quiz.questions.length})</label>}
                           {quiz.questions.map((q, i) => (
                               <div key={i} className="flex items-start justify-between p-3 bg-white border rounded shadow-sm">
                                   <div>
                                       <div className="flex items-center gap-2">
                                           <span className="font-bold text-gray-700">Q{i+1}: {q.question}</span>
                                           <span className="px-2 py-0.5 text-xs text-white bg-blue-400 rounded-full">{q.type === 'matching' ? 'Matching' : 'MCQ'}</span>
                                       </div>
                                       <div className="mt-1 ml-4 text-sm text-gray-500">
                                            {q.type === 'matching' ? (
                                                <div className="grid grid-cols-2 gap-2 mt-1">
                                                    {q.pairs?.map((p, pid) => (
                                                        <div key={pid} className="p-1 text-xs border rounded bg-gray-50">{p.left} ➔ {p.right}</div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span>Correct: <span className="font-medium text-green-600">{q.correctAnswer || q.correct_answer || "Not selected"}</span></span>
                                            )}
                                       </div>
                                   </div>
                                   <button onClick={() => removeQuestion(q._tempId)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                               </div>
                           ))}
                        </div>
                    </div>
                )}
                <button onClick={saveContent} disabled={loading} className="w-full py-3 mt-6 text-lg font-bold text-white bg-blue-600 rounded hover:bg-blue-700">
                    {loading ? "Saving..." : (editData ? "Update Assessment" : "Create Assessment")}
                </button>
            </div>
        </div>

        {/* Right: Existing List (Only if creating new) */}
        {!editData && (
            <div className="bg-white rounded-lg shadow-lg h-fit">
                <div className="p-4 border-b bg-gray-50"><h2 className="font-bold">Existing Content</h2></div>
                <div className="p-4 text-sm text-gray-500">
                    Select a module to view existing assignments and quizzes.
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentQuizPanel;