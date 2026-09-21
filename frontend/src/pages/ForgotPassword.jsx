import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('OTP has been sent to your email.');
      setStep(2);
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || errorData?.error || 'Failed to request OTP';
      setError(errorMessage);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setMessage('OTP verified! Please enter your new password.');
      setStep(3);
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || errorData?.error || 'Invalid OTP';
      setError(errorMessage);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setMessage('Password reset successful! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || errorData?.error || 'Failed to reset password';
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-side">
        <div className="auth-image-overlay"></div>
      </div>
      
      <div className="auth-form-side">
        <div className="auth-form-container">
          <Link to="/" className="auth-logo">FASHION STORE.</Link>
          
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            {step === 1 && 'Enter your email to receive an OTP.'}
            {step === 2 && 'Enter the OTP sent to your email.'}
            {step === 3 && 'Enter your new password.'}
          </p>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          {step === 1 ? (
            <form className="auth-form" onSubmit={handleRequestOtp}>
              <div className="auth-input-group">
                <label className="auth-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-btn">
                Send OTP
              </button>
            </form>
          ) : step === 2 ? (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <div className="auth-input-group">
                <label className="auth-label">OTP Code</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="auth-btn">
                Verify OTP
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="auth-input-group">
                <label className="auth-label">New Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-btn">
                Reset Password
              </button>
            </form>
          )}

          <p className="auth-footer-text">
            Remember your password? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
