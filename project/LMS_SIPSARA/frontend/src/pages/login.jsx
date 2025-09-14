import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    setErrors({});

    // Basic validation
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Attempting login with:', { email }); // Don't log password
      console.log('Password length:', password.length); // Debug password without showing it
      
      const requestData = {
        email: email.trim().toLowerCase(), // Ensure email is clean
        password: password
      };
      
      console.log('Request data:', { email: requestData.email, passwordProvided: !!requestData.password });
      
      const response = await fetch('http://localhost:8000/lms/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        // Handle HTTP errors
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
  
      if (data && data.access) {
        // FIXED: Store the access token with the correct key that Topbar expects
        localStorage.setItem('authToken', data.access);
        
        // Store refresh token if available
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
        }
        
        // Store user data with additional fields from backend response
        const userData = {
          user_id: data.user_id,
          user_type: data.user_type,
          username: data.username || email.split('@')[0], // Fallback to email prefix if no username
          email: data.email || email // Use backend email or fallback to input email
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        setLoginSuccess(true);
        
        // Determine redirect based on user_type
        const userType = data.user_type;
        console.log('User type:', userType);
        
        // Short delay to show success message before redirect
        setTimeout(() => {
          if (userType === 'admin') {
            navigate('/Suadmin');
          } else if (userType === 'instructor') {
            navigate('/Teacher');
          } else if (userType === 'student') {
            navigate('/Student');
          } else {
            console.error('Unknown user type:', userType);
            setLoginError('Unknown user type. Please contact support.');
          }
        }, 1000);
      } else {
        console.error('No access token in response:', data);
        setLoginError('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Clear any existing tokens on login failure
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.setItem('user', JSON.stringify({}));
      
      // Handle specific error messages
      if (error.message.includes('HTTP 401')) {
        setLoginError('Invalid email or password. Please try again.');
      } else if (error.message.includes('HTTP 400')) {
        setLoginError('Invalid request. Please check your input.');
      } else if (error.message.includes('HTTP 500')) {
        setLoginError('Server error. Please try again later.');
      } else if (error.message.includes('Failed to fetch')) {
        setLoginError('No response from server. Please check your connection and ensure the server is running.');
      } else {
        setLoginError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'rememberMe') {
      setRememberMe(e.target.checked);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
            Login
          </h2>
          
          {loginSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm font-medium">
                ✅ Login successful! Redirecting...
              </p>
            </div>
          )}
          
          {loginError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm font-medium">
                ❌ {loginError}
              </p>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                required
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                id="rememberMe"
                checked={rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
            
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a 
                href="/signup" 
                className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Signup
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;