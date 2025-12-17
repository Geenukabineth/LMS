import { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';

function TeacherApplication() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    permanentAddress: '',
    currentSchool: '',
    department: '',
    yearsOfExperience: '',
    qualification: '',
    gender: ''
  });
  
  const [cvFile, setCvFile] = useState(null);
  const [cvFileName, setCvFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, cv: 'Please upload a PDF or Word document' }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, cv: 'File size must be less than 5MB' }));
        return;
      }
      
      setCvFile(file);
      setCvFileName(file.name);
      setErrors(prev => ({ ...prev, cv: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
        !formData.permanentAddress || !formData.currentSchool || !formData.department) {
      setErrors({ general: 'Please fill in all required fields' });
      setIsSubmitting(false);
      return;
    }

    if (!cvFile) {
      setErrors({ cv: 'Please upload your CV' });
      setIsSubmitting(false);
      return;
    }

    const submitData = new FormData();
    submitData.append('firstName', formData.firstName);
    submitData.append('lastName', formData.lastName);
    submitData.append('email', formData.email);
    submitData.append('phone', formData.phone);
    submitData.append('permanentAddress', formData.permanentAddress);
    submitData.append('currentSchool', formData.currentSchool);
    submitData.append('department', formData.department);
    submitData.append('yearsOfExperience', formData.yearsOfExperience);
    submitData.append('qualification', formData.qualification);
    submitData.append('gender', formData.gender);
    submitData.append('cv', cvFile);

    try {
      const response = await fetch('http://localhost:8000/lms/teacher/application/', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Application error details:', errorData);
        setErrors(errorData);
        setSubmitError('Application submission failed. Please check the form and try again.');
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      console.log('Application submitted successfully:', data);
      setSubmitSuccess(true);
      setIsSubmitting(false);
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        permanentAddress: '',
        currentSchool: '',
        department: '',
        yearsOfExperience: '',
        qualification: '',
        gender: ''
      });
      setCvFile(null);
      setCvFileName('');
    } catch (error) {
      console.error('Error during application submission:', error);
      setSubmitError('Network error. Please try again later.');
      setErrors({ general: 'Network error. Please try again later.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Join Our Teaching Team
            </h1>
            <p className="text-lg text-gray-600">
              Help shape the future of education at EDULEARN
            </p>
          </div>

          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">
                  Application Submitted Successfully!
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Thank you for your interest. We will review your application and contact you soon.
                </p>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm font-medium">{submitError}</p>
            </div>
          )}

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm font-medium">{errors.general}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="teacher@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+94 71 234 5678"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="permanentAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Permanent Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="permanentAddress"
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your complete permanent address"
                />
                {errors.permanentAddress && <p className="mt-1 text-sm text-red-600">{errors.permanentAddress}</p>}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Professional Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="currentSchool" className="block text-sm font-medium text-gray-700 mb-2">
                    Current/Previous School <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="currentSchool"
                    name="currentSchool"
                    value={formData.currentSchool}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Name of your current or previous school"
                  />
                  {errors.currentSchool && <p className="mt-1 text-sm text-red-600">{errors.currentSchool}</p>}
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject/Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Mathematics, Science, English"
                  />
                  {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
                </div>

                <div>
                  <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-2">
                    Highest Qualification
                  </label>
                  <select
                    id="qualification"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">Select Qualification</option>
                    <option value="bachelor">Bachelor Degree</option>
                    <option value="master">Master Degree</option>
                    <option value="phd">PhD</option>
                    <option value="diploma">Diploma</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="yearsOfExperience"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Years of teaching experience"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Upload Your CV
              </h2>
              <div className="mt-4">
                <label htmlFor="cv" className="block text-sm font-medium text-gray-700 mb-2">
                  Curriculum Vitae (CV) <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                  <div className="space-y-2 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="cv"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="cv"
                          name="cv"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 5MB</p>
                    {cvFileName && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        Selected: {cvFileName}
                      </p>
                    )}
                  </div>
                </div>
                {errors.cv && <p className="mt-2 text-sm text-red-600">{errors.cv}</p>}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Login here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherApplication;