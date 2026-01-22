import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/lms/'; // Adjusted for /lms/ prefix

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post(`${API_BASE}password/reset/request/`, { email }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setMessage('OTP sent to your email! Check your inbox or spam folder.');
      setStep(2);
    } catch (error) {
      console.error('Error:', error.response?.data);
      setMessage(error.response?.data?.error || 'Error sending OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await axios.post(`${API_BASE}password/reset/confirm/`, {
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Error:', error.response?.data);
      setMessage(error.response?.data?.error || 'Error resetting password. Check OTP or try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Forgot Password</h2>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your email"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full p-2 text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-orange-300"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            {message && (
              <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Verify OTP and Reset Password</h2>
            <div className="mb-4">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter OTP"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="New Password"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Confirm New Password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full p-2 text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-orange-300"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            {message && (
              <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;