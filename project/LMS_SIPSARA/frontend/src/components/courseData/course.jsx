import { useState, useEffect } from 'react';
import { Upload, BookOpen, User, DollarSign, BarChart3, FileText, Camera, Check, Loader2 } from 'lucide-react';


function CourseCreator() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('courseDetails');
  const [loading, setLoading] = useState(false); 
  const [instructors, setInstructors] = useState([]);
  
  // Use state for coursedata instead of a static object
  const [coursedata, setCoursedata] = useState({
    title: '',
    description: '',
    price: '',
    level: '1 to 5',
    instructor: '',
    image: null,
  });

  const saveCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', coursedata.title);
      formData.append('description', coursedata.description);
      formData.append('price', coursedata.price);
      formData.append('level', coursedata.level);
      formData.append('instructor', coursedata.instructor);
      if (coursedata.image) {
        formData.append("image", coursedata.image); 
      }

      const response = await fetch('http://localhost:8000/lms/courses/create/', {
        method: 'POST',        
        body: formData  
      });

      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error details:', errorData);
        throw new Error(errorData.message || 'Failed to create course');
      }
      
      const responseData = await response.json();
      console.log('Course created successfully:', responseData);
      
      
      setCoursedata({
        title: '',
        description: '',
        price: '',
        level: '1 to 5',
        instructor: '',
        image: null,
      });
      setImage(null);
      setPreview(null);
      
      alert('Course created successfully!');
      
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (name === 'image' && files && files[0]) {
      const file = files[0];
      setImage(file);
      
      // Clean up previous preview URL
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      
      const newPreview = URL.createObjectURL(file);
      setPreview(newPreview);
      setCoursedata(prev => ({ ...prev, image: file }));
    } else if (type === 'checkbox') {
      setCoursedata(prev => ({ ...prev, [name]: checked ? value : '' }));
    } else {
      setCoursedata(prev => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    fetch('http://localhost:8000/lms/user/')
      .then((res) => res.json())
      .then((data) => setInstructors(data))
      .catch((err) => console.error('Error fetching instructors:', err));
  }, []);
  
  // Cleanup preview URL on unmount 
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          
          
          <h1 className="text-3xl font-bold mb-2">
            Create New Course
          </h1>
          <p className="text-blue-100">
            Build engaging learning experiences for your students
          </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Tab Navigation */}
          <div >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2">
              <div className="flex space-x-2">
                <button 
                  onClick={() => setActiveTab('courseDetails')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'courseDetails' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Course Details</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Content */}
          {activeTab === 'courseDetails' && (
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Course Title */}
                  <div className="group">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span>Course Title</span>
                    </label>
                    <input 
                      type="text" 
                      name="title" 
                      value={coursedata.title} 
                      onChange={handleCourseChange} 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="Enter an engaging course title..."
                      required 
                    />
                  </div>

                  {/* Description */}
                  <div className="group">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>Description</span>
                    </label>
                    <textarea 
                      name="description" 
                      value={coursedata.description} 
                      onChange={handleCourseChange} 
                      rows="4" 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 resize-none bg-white/80 backdrop-blur-sm"
                      placeholder="Describe what students will learn in this course..."
                      required 
                    />
                  </div>

                  {/* Price and Level Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span>Price</span>
                      </label>
                      <input 
                        type="number" 
                        name="price" 
                        value={coursedata.price} 
                        onChange={handleCourseChange} 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="group">
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        <span>Level</span>
                      </label>
                      <select 
                        name="level" 
                        value={coursedata.level} 
                        onChange={handleCourseChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      >
                        <option value="1 to 5">1 to 5</option>
                        <option value="Ordinary level">Ordinary Level</option>
                        <option value="advanced level">Advanced Level</option>
                        <option value="extra course">Extra Course</option>
                      </select>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="group">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                      <User className="w-4 h-4 text-blue-500" />
                      <span>Instructor</span>
                    </label>
                    <select 
                      name="instructor"
                      value={coursedata.instructor}
                      onChange={handleCourseChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      required
                    >
                      <option value="">Select instructor</option>
                      {instructors.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column - Image Upload */}
                <div className="space-y-6">
                  <div className="group">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                      <Camera className="w-4 h-4 text-pink-500" />
                      <span>Course Image</span>
                    </label>
                    
                    <div className="relative">
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleCourseChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      
                      {!preview ? (
                        <div className="border-2 border-dashed border-pink-300 rounded-2xl p-8 text-center bg-gradient-to-br from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 transition-all duration-300 cursor-pointer group-hover:border-pink-400">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="p-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
                              <Upload className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-gray-700 mb-1">
                                Upload Course Image
                              </p>
                              <p className="text-sm text-gray-500">
                                Drop your image here or click to browse
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 group cursor-pointer">
                          <img 
                            src={preview} 
                            alt="Course Preview" 
                            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2">
                              <p className="text-sm font-semibold text-gray-700">Click to change</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {preview && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-green-500 rounded-full">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-green-700">
                          Image uploaded successfully!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center mt-12">
                <button 
                  onClick={saveCourse}
                  disabled={loading}
                  className={`group relative px-12 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${
                    loading ? 'opacity-75 cursor-not-allowed' : 'hover:from-indigo-600 hover:to-purple-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    )}
                    <span className="text-lg">
                      {loading ? 'Creating Course...' : 'Create Course'}
                    </span>
                  </div>
                  
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Create engaging courses that inspire and educate your students
          </p>
        </div>
      </div>
    
  );
}

export default CourseCreator;