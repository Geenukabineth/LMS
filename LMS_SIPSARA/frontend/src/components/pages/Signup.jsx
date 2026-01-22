import { useState } from 'react';

function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [phone, setPhone] = useState('');
  const [semester, setSemester] = useState('');
  const [errors, setErrors] = useState({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    if (!firstName || !lastName || !email || !password || !password2 || !semester) {
      setErrors({ general: 'All fields are required' });
      setIsSubmitting(false);
      return;
    }

    if (password !== password2) {
      setErrors({ password2: 'Passwords do not match' });
      setIsSubmitting(false);
      return;
    }

    const userData = {
      username: firstName.toLowerCase() + '.' + lastName.toLowerCase(),
      email: email,
      password: password,
      password2: password2,
      phone: phone,
      user_type: 'student',
      semester: semester,
      firstName: firstName,
      lastName: lastName
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

      const data = await response.json();
      console.log('Registration successful:', data);
      setSignupSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        window.location.href = '/courses';
      }, 2000);
    } catch (error) {
      console.error('Error during registration:', error);
      setSignupError('Network error. Please try again later.');
      setErrors({ general: 'Network error. Please try again later.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-orange-50 to-orange-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-6">
        

        <div className="p-8 bg-white rounded-lg shadow-md">
          <h2 className="mb-2 text-3xl font-extrabold text-center text-gray-900">
            Student Registration
          </h2>
          <p className="mb-8 text-center text-gray-600">
            Create your account to start learning
          </p>
          
          {signupSuccess && (
            <div className="p-4 mb-4 border border-green-200 rounded-md bg-green-50">
              <p className="text-sm font-medium text-green-800">
                Signup successful! Please log in.
              </p>
            </div>
          )}
          
          {signupError && (
            <div className="p-4 mb-4 border border-red-200 rounded-md bg-red-50">
              <p className="text-sm font-medium text-red-800">
                {signupError}
              </p>
            </div>
          )}

          {errors.general && (
            <div className="p-4 mb-4 border border-red-200 rounded-md bg-red-50">
              <p className="text-sm font-medium text-red-800">
                {errors.general}
              </p>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="firstName" 
                  id="firstName" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm" 
                  placeholder="John" 
                  required
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="lastName" 
                  id="lastName" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm" 
                  placeholder="Doe" 
                  required
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm" 
                  placeholder="student@example.com" 
                  required
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input 
                  type="text" 
                  name="phone" 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm" 
                  placeholder="+94 71 234 5678" 
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm" 
                  placeholder="••••••••" 
                  required
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
              
              <div>
                <label htmlFor="password2" className="block mb-2 text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input 
                  type="password" 
                  name="password2" 
                  id="password2" 
                  value={password2} 
                  onChange={(e) => setPassword2(e.target.value)} 
                  className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm" 
                  placeholder="••••••••" 
                  required
                />
                {errors.password2 && <p className="mt-1 text-sm text-red-600">{errors.password2}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="semester" className="block mb-2 text-sm font-medium text-gray-700">
                Grade/Semester <span className="text-red-500">*</span>
              </label>
              <select 
                name="semester" 
                id="semester" 
                value={semester} 
                onChange={(e) => setSemester(e.target.value)} 
                className="relative block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                required
              >
                <option value="">Select Grade/Semester</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
                <option value="13">Grade 13</option>
              </select>
              {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              onClick={handleSubmit}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Student Account'}
            </button>
            
            <p className="text-sm text-center text-gray-600">
              Already have an account?{' '}
              <a 
                href="/" 
                className="font-medium text-orange-600 hover:text-orange-500 hover:underline"
              >
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;