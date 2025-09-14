import { useState } from 'react';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('student');
  const [errors, setErrors] = useState({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'student',
    semester: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    if (!username || !email || !password || !password2) {
      setErrors({ general: 'All fields are required' });
      setIsSubmitting(false);
      return;
    }

    if (password !== password2) {
      setErrors({ password2: 'Passwords do not match' });
      setIsSubmitting(false);
      return;
    }

    // Create payload with correct field names
    const userData = {
      username: username,
      email: email,
      password: password,
      password2: password2,
      phone: phone,
      user_type: userType
    };

    try {
      const response = await fetch('http://localhost:8000/lms/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration error details:', errorData);
        
        setErrors(errorData);
        setSignupError('Registration failed. Please check the form and try again.');
        setIsSubmitting(false);
        return;
      }

      // Registration successful
      const data = await response.json();
      console.log('Registration successful:', data);
      setSignupSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        console.log('Redirecting to login page');
      }, 2000);
    } catch (error) {
      console.error('Error during registration:', error);
      setSignupError('Network error. Please try again later.');
      setErrors({ general: 'Network error. Please try again later.' });
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'semester') {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
            Sign Up for EDULEARN
          </h2>
          
          {signupSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm font-medium">
                Signup successful! Please log in.
              </p>
            </div>
          )}
          
          {signupError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm font-medium">
                {signupError}
              </p>
            </div>
          )}

          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm font-medium">
                {errors.general}
              </p>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                  placeholder="Your Name" 
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                  placeholder="Email" 
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                  placeholder="Password" 
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
              
              <div>
                <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input 
                  type="password" 
                  name="password2" 
                  id="password2" 
                  value={password2} 
                  onChange={(e) => setPassword2(e.target.value)} 
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                  placeholder="Confirm Password" 
                />
                {errors.password2 && <p className="mt-1 text-sm text-red-600">{errors.password2}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input 
                type="text" 
                name="phone" 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                placeholder="Phone" 
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                id="userType"
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value);
                  setFormData({ ...formData, type: e.target.value });
                }}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
              {errors.user_type && <p className="mt-1 text-sm text-red-600">{errors.user_type}</p>}
            </div>

            {formData.type === 'student' && (
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select 
                  name="semester" 
                  id="semester" 
                  value={formData.semester} 
                  onChange={handleChange} 
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white"
                >
                  <option value="">Select Semester</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
                {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester}</p>}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting} 
              onClick={handleSubmit}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? 'Signing up...' : 'Sign up'}
            </button>
            
            <p className="text-center text-sm text-gray-600">
              Have an account already?{' '}
              <a 
                href="/login" 
                className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;