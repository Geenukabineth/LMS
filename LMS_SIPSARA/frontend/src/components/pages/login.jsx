import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/context/authService';

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

    // Validation
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const credentials = {
        email: email.trim().toLowerCase(),
        password,
      };

      const data = await authService.login(credentials);

      if (data && data.access && data.refresh) {

        setLoginSuccess(true);

        setTimeout(() => {
          const userType = data.user_type;

          if (userType === 'admin') navigate('/suadmin');
          else if (userType === 'instructor') navigate('/teacher');
          else if (userType === 'student') navigate('/student');
          else if (userType === 'receptionist') navigate('/receptionist');
          else setLoginError('Unknown user type');
        }, 800);
      } else {
        setLoginError('Invalid response from server.');
      }
    } catch (error) {
      authService.logout();
      setLoginError('Invalid email or password.');
      console.error('Login Error:', error);
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
    <div className="flex items-center justify-center min-h-screen bg-center bg-cover"
      style={{ backgroundImage: "url('/logos/Untitled design.png')" }}>
      <div className="w-full max-w-md p-8 border shadow-xl bg-white/20 backdrop-blur-lg rounded-2xl border-white/30">
        
        <h2 className="mb-6 text-3xl font-bold text-center uppercase">Login</h2>

        {loginSuccess && (
          <div className="flex items-center p-4 mb-4 text-sm text-green-800 border border-green-200 rounded-lg shadow-sm bg-green-50" role="alert">
          <svg className="flex-shrink-0 inline w-4 h-4 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
          </svg>
          <div>
            <span className="font-medium">Success!</span> Login successful.
          </div>
        </div>
        )}

        {loginError && (
          <div className="p-3 mb-4 text-red-800 bg-red-100 border border-red-300 rounded">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              checked={rememberMe}
              onChange={handleChange}
            />
            <label className="ml-2 text-sm">Remember me</label>
          </div>
          <p className="mt-2 text-sm text-right">
            <a
              href="/ForgotPassword"
              className="text-orange-600 hover:underline"
            >
              Forgot password?
            </a>
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 text-white rounded ${
              isSubmitting ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          Don’t have an account? <a className="text-orange-600" href="/signup">Signup</a>
        </p>

      </div>
    </div>
  );
}

export default Login;