import React, { useState } from 'react';
import { Plus, Trash2, Save, Eye, Calendar, FileText, HelpCircle, Clock } from 'lucide-react';

const AssignmentQuizPanel = () => {
  const [activeTab, setActiveTab] = useState('assignment');
  
  // Assignment state
  const [assignment, setAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: '',
    instructions: '',
    attachments: [],
    rubric: ''
  });

  // Quiz state
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    timeLimit: '',
    attempts: 1,
    shuffleQuestions: false,
    showResults: 'after_submission',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'multiple_choice',
    question: '',
    points: 1,
    options: ['', ''],
    correctAnswer: '',
    explanation: ''
  });

  // Question types
  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'essay', label: 'Essay' },
    { value: 'fill_blank', label: 'Fill in the Blank' }
  ];

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) return;
    
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, id: Date.now() }]
    }));
    
    setCurrentQuestion({
      type: 'multiple_choice',
      question: '',
      points: 1,
      options: ['', ''],
      correctAnswer: '',
      explanation: ''
    });
  };

  const removeQuestion = (id) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const saveAssignment = () => {
    console.log('Saving assignment:', assignment);
    alert('Assignment saved successfully!');
  };

  const saveQuiz = () => {
    console.log('Saving quiz:', quiz);
    alert('Quiz saved successfully!');
  };

  const previewContent = () => {
    if (activeTab === 'assignment') {
      console.log('Previewing assignment:', assignment);
      alert('Assignment preview opened!');
    } else {
      console.log('Previewing quiz:', quiz);
      alert('Quiz preview opened!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">Content Creation Panel</h1>
          <p className="text-blue-100">Create assignments and quizzes for your students</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-transparent-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('assignment')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'assignment'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              Assignment
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'quiz'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
            >
              <HelpCircle className="inline-block w-4 h-4 mr-2" />
              Quiz
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'assignment' ? (
            /* Assignment Form */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={assignment.title}
                    onChange={(e) => setAssignment(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assignment title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline-block w-4 h-4 mr-1" />
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={assignment.dueDate}
                    onChange={(e) => setAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={assignment.points}
                  onChange={(e) => setAssignment(prev => ({ ...prev, points: e.target.value }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={assignment.description}
                  onChange={(e) => setAssignment(prev => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the assignment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={assignment.instructions}
                  onChange={(e) => setAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed instructions for students"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rubric (Optional)
                </label>
                <textarea
                  value={assignment.rubric}
                  onChange={(e) => setAssignment(prev => ({ ...prev, rubric: e.target.value }))}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Grading criteria and rubric"
                />
              </div>
            </div>
          ) : (
            /* Quiz Form */
            <div className="space-y-6">
              {/* Quiz Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Quiz Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quiz Title *
                    </label>
                    <input
                      type="text"
                      value={quiz.title}
                      onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter quiz title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline-block w-4 h-4 mr-1" />
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={quiz.timeLimit}
                      onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="60"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={quiz.description}
                    onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Quiz description and instructions"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quiz.shuffleQuestions}
                      onChange={(e) => setQuiz(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Shuffle Questions</span>
                  </label>
                </div>
              </div>

              {/* Question Builder */}
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Add Question</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type
                    </label>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {questionTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question *
                  </label>
                  <textarea
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your question here"
                  />
                </div>

                {/* Question Type Specific Fields */}
                {currentQuestion.type === 'multiple_choice' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        Answer Options
                      </label>
                      <button
                        onClick={addOption}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                      >
                        <Plus className="inline-block w-4 h-4 mr-1" />
                        Add Option
                      </button>
                    </div>
                    
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === index.toString()}
                          onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index.toString() }))}
                          className="text-blue-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                        {currentQuestion.options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'true_false' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer
                    </label>
                    <div className="space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="trueFalse"
                          value="true"
                          checked={currentQuestion.correctAnswer === 'true'}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span className="ml-2">True</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="trueFalse"
                          value="false"
                          checked={currentQuestion.correctAnswer === 'false'}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span className="ml-2">False</span>
                      </label>
                    </div>
                  </div>
                )}

                {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'fill_blank') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sample Answer/Keywords
                    </label>
                    <input
                      type="text"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter sample answer or keywords"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation (Optional)
                  </label>
                  <textarea
                    value={currentQuestion.explanation}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explanation for the correct answer"
                  />
                </div>

                <button
                  onClick={addQuestion}
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  <Plus className="inline-block w-4 h-4 mr-2" />
                  Add Question
                </button>
              </div>

              {/* Questions List */}
              {quiz.questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Questions ({quiz.questions.length})</h3>
                  {quiz.questions.map((q, index) => (
                    <div key={q.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              Q{index + 1} • {questionTypes.find(t => t.value === q.type)?.label} • {q.points} pts
                            </span>
                          </div>
                          <p className="text-gray-800 mb-2">{q.question}</p>
                          {q.type === 'multiple_choice' && (
                            <ul className="text-sm text-gray-600 space-y-1">
                              {q.options.map((opt, i) => (
                                <li key={i} className={i.toString() === q.correctAnswer ? 'font-semibold text-green-600' : ''}>
                                  {String.fromCharCode(65 + i)}. {opt}
                                </li>
                              ))}
                            </ul>
                          )}
                          {q.type === 'true_false' && (
                            <p className="text-sm text-green-600 font-semibold">
                              Correct Answer: {q.correctAnswer === 'true' ? 'True' : 'False'}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeQuestion(q.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={previewContent}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            
            <div className="space-x-3">
              <button
                onClick={activeTab === 'assignment' ? saveAssignment : saveQuiz}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save {activeTab === 'assignment' ? 'Assignment' : 'Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentQuizPanel;