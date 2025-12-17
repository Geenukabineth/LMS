import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import PropTypes from 'prop-types';

// Constants for Academic Years (Levels)
const ACADEMIC_YEARS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 
  'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 
  'Grade 13'
];

// Helper to get the numeric grade (1 to 13) from the string 'Grade X'
const getGradeNumber = (gradeString) => {
  if (!gradeString) return '';
  const match = gradeString.match(/\d+/);
  return match ? match[0] : '';
};

// Reusable Loader Component
const Loader = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-4 h-4 border-2 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
    <span>Loading...</span>
  </div>
);

const UserAdd = ({ onAdd, onClose }) => {
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    guardianName: '', 
    guardianPhone: '', 
    emergencyContact: '',
    emergencyPhone: '',
    academicYear: '', 
    previousSchool: '',
    medicalInfo: '',
    notes: '',
    enrollmentDate: new Date().toISOString().slice(0, 10),
    registrationFees: false,
    courses: [{ course: '', teacher: '' }],
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLevelSelected, setIsLevelSelected] = useState(false);

  // Fetches courses based on the selected academicYear (Level)
  const fetchCourses = async (academicYear) => {
    if (!academicYear) {
      setCourses([]);
      setIsLevelSelected(false);
      return;
    }

    setIsLoadingCourses(true);
    setApiError('');

    const url = `http://localhost:8000/Course/list_by_level/?level=${encodeURIComponent(academicYear)}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Courses fetched successfully:', response.data);
      
      // Extract the actual course list from the 'results' key
      let fetchedCourses = Array.isArray(response.data.results) 
          ? response.data.results 
          : [];
      
      setCourses(fetchedCourses);
      setIsLevelSelected(true);

    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setApiError(`Failed to load courses: ${error.response?.data?.error || error.message}. Please check backend URL configuration.`);
      setCourses([]);
      setIsLevelSelected(true);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // Effect to trigger course fetching whenever academicYear changes
  useEffect(() => {
    if (studentForm.academicYear) {
      fetchCourses(studentForm.academicYear);
    } else {
      setCourses([]);
      setIsLevelSelected(false);
    }

    // Reset course/teacher selections when level changes
    setStudentForm((prev) => ({
      ...prev,
      courses: [{ course: '', teacher: '' }],
    }));
  }, [studentForm.academicYear]);

  // Helper function to get course details
  const getCourseDetails = (courseId) => {
    if (!courseId) return null;
    return courses.find((c) => c.course_id === courseId); 
  };

  // Refactored handleInputChange for robust array state update and correct teacher ID access
  const handleInputChange = (e, index) => {
    const { name, value, type, checked } = e.target;

    setApiError('');

    if (name === 'registrationFees') {
      setStudentForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (index !== undefined) {
      
      const newCourses = studentForm.courses.map((courseAssignment, i) => {
        if (i === index) {
          // Clone the specific object being modified
          const updatedAssignment = { ...courseAssignment, [name]: value };

          // Specific logic for course selection
          if (name === 'course') {
            const selectedCourse = courses.find((c) => c.course_id === value);
            
            // Set the course ID
            updatedAssignment.course = value;

            // Auto-populate the assigned teacher's ID
            updatedAssignment.teacher = selectedCourse?.teacher?.teacher_id || ''; 
          }
          return updatedAssignment;
        }
        return courseAssignment;
      });

      setStudentForm((prev) => ({ ...prev, courses: newCourses }));
      
    } else {
      setStudentForm((prev) => ({ ...prev, [name]: value }));
      
      // Clear errors on change
      if (name === 'academicYear' || name === 'firstName' || name === 'lastName' || name === 'email') {
        setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
      }
    }
  };

  const addCourseField = () => {
    setStudentForm((prev) => ({
      ...prev,
      courses: [...prev.courses, { course: '', teacher: '' }],
    }));
  };

  const removeCourseField = (index) => {
    if (studentForm.courses.length > 1) {
      const newCourses = studentForm.courses.filter((_, i) => i !== index);
      setStudentForm((prev) => ({ ...prev, courses: newCourses }));
    } else {
      setStudentForm((prev) => ({ ...prev, courses: [{ course: '', teacher: '' }] }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!studentForm.firstName) newErrors.firstName = 'First Name is required.';
    if (!studentForm.lastName) newErrors.lastName = 'Last Name is required.';
    if (!studentForm.email) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(studentForm.email)) newErrors.email = 'Email is invalid.';
    if (!studentForm.academicYear) newErrors.academicYear = 'Academic Year (Level) is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddStudent = async () => {
    if (!validateForm()) {
      setApiError('Please fill out all required fields.');
      return;
    }

    const gradeNumber = getGradeNumber(studentForm.academicYear);

    // FIX: Generate required username and password for the RegisterSerializer validation
    const generatedUsername = `${studentForm.firstName.toLowerCase()}.${studentForm.lastName.toLowerCase()}.${Math.floor(1000 + Math.random() * 9000)}`;
    const temporaryPassword = `Student@${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Payload for the general registration endpoint (/lms/register/)
    const payload = {
      // **CRITICAL FIXES**
      username: generatedUsername, 
      password: temporaryPassword, 
      password2: temporaryPassword, // Required by RegisterSerializer
      
      // User and basic student fields
      firstName: studentForm.firstName,
      lastName: studentForm.lastName,
      email: studentForm.email,
      phone: studentForm.phone,
      semester: gradeNumber, // Maps to Grade in the backend
      user_type: 'student',
    };
    
    // API URL for student registration (POST to RegisterView)
    const API_ENDPOINT = 'http://localhost:8000/lms/register/';

    try {
      setApiError('');
      const response = await axios.post(API_ENDPOINT, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Student added successfully:', response.data);
      setSuccessMessage('Student added successfully!');

      if (onAdd) {
        onAdd(response.data);
      }

      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to add student:', error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.error ||
        error.message ||
        'Failed to add student';

      setApiError(`Error: ${errorMessage}. The registration failed.`);
      setSuccessMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 text-white shadow bg-gradient-to-r from-blue-600 to-blue-800">
          <h2 className="text-2xl font-bold">Add New Student</h2>
          <button
            onClick={onClose}
            className="p-1 text-white transition-colors rounded hover:bg-blue-900"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Message Display */}
        {apiError && (
          <div className="p-4 m-4 border-l-4 border-red-500 bg-red-50">
            <p className="text-red-700">{apiError}</p>
          </div>
        )}
        {successMessage && (
          <div className="p-4 m-4 border-l-4 border-green-500 bg-green-50">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information Section */}
          <h3 className="pb-2 text-lg font-semibold border-b">Personal Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={studentForm.firstName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Jane"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={studentForm.lastName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Doe"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={studentForm.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="jane.doe@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={studentForm.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          {/* Guardian Information Section */}
          <h3 className="pb-2 text-lg font-semibold border-b">Guardian Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Guardian Name
              </label>
              <input
                type="text"
                name="guardianName"
                value={studentForm.guardianName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Guardian's Full Name"
              />
            </div>            

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Guardian Phone</label>
              <input
                type="tel"
                name="guardianPhone"
                value={studentForm.guardianPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Academic & Course Section */}
          <h3 className="pb-2 mt-6 text-lg font-semibold border-b">Academic Details</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Academic Year (Level) <span className="text-red-500">*</span>
              </label>
              <select
                name="academicYear"
                value={studentForm.academicYear}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  errors.academicYear ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Select Grade Level --</option>
                {ACADEMIC_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.academicYear && <p className="mt-1 text-xs text-red-500">{errors.academicYear}</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Enrollment Date</label>
              <input
                type="date"
                name="enrollmentDate"
                value={studentForm.enrollmentDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Dynamic Course Selection */}
          <h3 className="flex items-center justify-between pb-2 mt-6 text-lg font-semibold border-b">
            Courses & Teachers
            <button
              onClick={addCourseField}
              disabled={!isLevelSelected}
              className={`text-blue-600 hover:text-blue-800 transition-colors ${
                !isLevelSelected ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Plus className="inline w-5 h-5 mr-1" /> Add Course
            </button>
          </h3>

          {isLoadingCourses && <Loader />}
          {!isLevelSelected && (
            <p className="p-3 text-yellow-600 border border-yellow-200 rounded-lg bg-yellow-50">
              Please select a Grade Level first to view available courses.
            </p>
          )}

          <div className="space-y-4">
            {studentForm.courses.map((courseAssignment, index) => {
              // Find the full course details based on the selected course_id (string)
              const selectedCourseDetails = getCourseDetails(courseAssignment.course);
              // Access full_name from the nested teacher object
              const teacherFullName = selectedCourseDetails?.teacher?.full_name || 'N/A';

              return (
                <div key={index} className="flex items-end p-4 space-x-3 rounded-lg shadow-sm bg-gray-50">
                  <div className="flex-1">
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Course {index + 1}
                    </label>
                    <select
                      name="course"
                      value={courseAssignment.course}
                      onChange={(e) => handleInputChange(e, index)}
                      disabled={!isLevelSelected || isLoadingCourses}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select Course --</option>
                      {courses.map((course) => (
                        <option key={course.course_id} value={course.course_id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block mb-1 text-xs font-medium text-gray-700">Assigned Teacher</label>
                    <input
                      type="text"
                      // Display the determined full name
                      value={teacherFullName}
                      readOnly
                      className="w-full px-4 py-3 text-gray-600 bg-gray-200 border border-gray-300 rounded-lg cursor-default"
                      title={selectedCourseDetails ? `Teacher: ${teacherFullName}` : 'Select a course first.'}
                    />
                    {/* Hidden field to store the teacher ID for the payload, which is set in handleInputChange */}
                    <input type="hidden" name="teacher" value={courseAssignment.teacher} />
                  </div>

                  {studentForm.courses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCourseField(index)}
                      className="self-end p-3 text-red-600 transition-colors bg-red-100 rounded-lg hover:bg-red-200"
                      title="Remove Course"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {errors.courses && <p className="mt-1 text-xs text-red-500">{errors.courses}</p>}

          {/* Other Optional Details */}
          <h3 className="pb-2 mt-6 text-lg font-semibold border-b">Other Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Medical Information</label>
              <textarea
                name="medicalInfo"
                value={studentForm.medicalInfo}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Allergies, chronic conditions, etc."
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Additional Notes</label>
              <textarea
                name="notes"
                value={studentForm.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information..."
              />
            </div>

            <div className="flex items-center pt-2 md:col-span-2">
              <input
                id="registrationFees"
                name="registrationFees"
                type="checkbox"
                checked={studentForm.registrationFees}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="registrationFees" className="ml-3 text-sm font-medium text-gray-700">
                Registration Fees Paid
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex p-6 space-x-3 border-t bg-gray-50">
          <button
            onClick={handleAddStudent}
            disabled={isLoadingCourses}
            className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center transition duration-150 ease-in-out ${
              isLoadingCourses ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Check className="w-4 h-4 mr-2" />
            Add Student
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 transition duration-150 ease-in-out bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

UserAdd.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default UserAdd;