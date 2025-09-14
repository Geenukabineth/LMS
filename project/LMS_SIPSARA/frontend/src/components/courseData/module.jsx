import React, { useState, useEffect } from 'react';
import { Plus, Video, FileText, Trash2, Save, X, Upload, Clock, Link } from 'lucide-react';

function ModuleCreator() {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState([]);

  const [module, setModule] = useState({
    title: '',
    description: '',
    week: '',
    videos: [],
    documents: []
  });

  const Token =localStorage.getItem('authToken')
  
  const weeks = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Week ${i + 1}`
  }));


  useEffect(() => {   
    
    fetch("http://127.0.0.1:8000/lms/Coursemodule/filter/title/", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${Token}`, 
        },
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setTitles(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Error fetching titles:", err);
        setTitles([]);
      });
  }, []);

  const [currentVideo, setCurrentVideo] = useState({
    title: '',
    duration: '',
    file: null,
    url: ''
  });

  const [currentDocument, setCurrentDocument] = useState({
    title: '',
    content: '',
    file: null
  });

  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);

  const saveModule = async () => {
    if (!selectedCourse || !selectedWeek || !module.title.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const moduleData = {
        ...module,
        week: selectedWeek,
        courseId: selectedCourse
      };

      const response = await fetch('http://localhost:8000/lms/courses/create/', {
        method: 'POST', // Changed from 'get' to 'POST'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData), // Fixed: stringify the data
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('error details:', errorData);
        throw new Error(errorData.message || 'failed to create modules');
      }

      const result = await response.json();
      console.log('Module created successfully:', result);
      
      alert(`Module created successfully for Week ${selectedWeek}!`);
      
      // Reset form
      setModule({
        title: '',
        description: '',
        week: '',
        videos: [],
        documents: []
      });
      setSelectedCourse('');
      setSelectedWeek('');

    } catch (error) {
      console.error('Error creating module:', error);
      alert('Failed to create module. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addVideo = () => {
    if (!currentVideo.title.trim()) return;
    
    const video = {
      id: Date.now(),
      title: currentVideo.title,
      duration: currentVideo.duration,
      file: currentVideo.file,
      url: currentVideo.url,
      type: currentVideo.file ? 'upload' : 'url'
    };

    setModule({
      ...module,
      videos: [...module.videos, video]
    });

    setCurrentVideo({ title: '', duration: '', file: null, url: '' });
    setShowVideoForm(false);
  };

  const addDocument = () => {
    if (!currentDocument.title.trim()) return;
    
    const document = {
      id: Date.now(),
      title: currentDocument.title,
      content: currentDocument.content,
      file: currentDocument.file,
      type: currentDocument.file ? 'upload' : 'text'
    };

    setModule({
      ...module,
      documents: [...module.documents, document]
    });

    setCurrentDocument({ title: '', content: '', file: null });
    setShowDocForm(false);
  };

  const removeVideo = (id) => {
    setModule({
      ...module,
      videos: module.videos.filter(v => v.id !== id)
    });
  };

  const removeDocument = (id) => {
    setModule({
      ...module,
      documents: module.documents.filter(d => d.id !== id)
    });
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'video') {
        setCurrentVideo({ ...currentVideo, file });
      } else {
        setCurrentDocument({ ...currentDocument, file });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">Create New Module</h1>
            <p className="text-blue-100">Add videos and documents to enhance your course content</p>
            {selectedWeek && (
              <div className="mt-3 inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                Creating module for Week {selectedWeek}
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Course Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">Choose a course...</option>
                  {titles.map(title => (
                    <option key={title.id} value={title.id}>{title.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Select Week</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">Choose a week...</option>
                  {weeks.map(week => (
                    <option key={week.id} value={week.id}>{week.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Module Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Module Title</label>
                <input
                  type="text"
                  value={module.title}
                  onChange={(e) => setModule({ ...module, title: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter module title..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Description</label>
                <input
                  type="text"
                  value={module.description}
                  onChange={(e) => setModule({ ...module, description: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Brief description..."
                />
              </div>
            </div>

            {/* Videos Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Videos ({module.videos.length})
                </h3>
                <button
                  onClick={() => setShowVideoForm(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Video
                </button>
              </div>

              {/* Video Form Modal */}
              {showVideoForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold">Add Video</h4>
                      <button
                        onClick={() => setShowVideoForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Video title"
                        value={currentVideo.title}
                        onChange={(e) => setCurrentVideo({ ...currentVideo, title: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                      
                      <input
                        type="text"
                        placeholder="Duration (e.g., 10:30)"
                        value={currentVideo.duration}
                        onChange={(e) => setCurrentVideo({ ...currentVideo, duration: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Upload Video File</label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, 'video')}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div className="text-center text-gray-500">OR</div>

                      <input
                        type="url"
                        placeholder="Video URL"
                        value={currentVideo.url}
                        onChange={(e) => setCurrentVideo({ ...currentVideo, url: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={addVideo}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Video
                        </button>
                        <button
                          onClick={() => setShowVideoForm(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Videos List */}
              <div className="space-y-2">
                {module.videos.map(video => (
                  <div key={video.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-800">{video.title}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {video.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {video.duration}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            {video.type === 'upload' ? <Upload className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                            {video.type === 'upload' ? 'File Upload' : 'URL'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeVideo(video.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Documents ({module.documents.length})
                </h3>
                <button
                  onClick={() => setShowDocForm(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Document
                </button>
              </div>

              {/* Document Form Modal */}
              {showDocForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold">Add Document</h4>
                      <button
                        onClick={() => setShowDocForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Document title"
                        value={currentDocument.title}
                        onChange={(e) => setCurrentDocument({ ...currentDocument, title: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Upload Document</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => handleFileUpload(e, 'document')}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div className="text-center text-gray-500">OR</div>

                      <textarea
                        placeholder="Write document content..."
                        value={currentDocument.content}
                        onChange={(e) => setCurrentDocument({ ...currentDocument, content: e.target.value })}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={addDocument}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Add Document
                        </button>
                        <button
                          onClick={() => setShowDocForm(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents List */}
              <div className="space-y-2">
                {module.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-800">{doc.title}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          {doc.type === 'upload' ? <Upload className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {doc.type === 'upload' ? 'File Upload' : 'Text Content'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                onClick={saveModule}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Creating...' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModuleCreator;