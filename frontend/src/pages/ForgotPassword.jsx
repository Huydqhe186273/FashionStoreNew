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
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await api.post('/auth/forgot-password', { email: normalizedEmail });
      setEmail(normalizedEmail);
      setMessage('Mã OTP đã được gửi đến email của bạn.');
      setStep(2);
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || errorData?.error || 'Không thể gửi mã OTP.';
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
        : errorData?.message || errorData?.error || 'Mã OTP không đúng hoặc đã hết hạn.';
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
        : errorData?.message || errorData?.error || 'Không thể đặt lại mật khẩu.';
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-side" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        <div className="auth-image-overlay"></div>
        <div className="auth-image-top">
          <div className="auth-image-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Bảo mật tài khoản</span>
          </div>
        </div>
        <div className="auth-image-content">
          <div className="auth-quote-card">
            <div className="auth-quote-stars">★★★★★</div>
            <p className="auth-quote-text">
              "Khôi phục mật khẩu nhanh chóng và an toàn qua mã xác thực OTP gửi trực tiếp tới hòm thư cá nhân của bạn."
            </p>
            <div className="auth-quote-author">
              <strong>FashionStore Security</strong>
              <span>Bảo vệ quyền lợi & tài khoản khách hàng</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-top-nav">
            <Link to="/" className="auth-brand" title="Quay lại trang chủ">
              <img 
                src="/logo.png" 
                alt="FashionStore Logo" 
                className="auth-brand-logo" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="auth-brand-name">
                FASHION<span>STORE</span>
              </span>
            </Link>

            <Link to="/" className="auth-back-link" title="Quay lại trang chủ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Trang chủ</span>
            </Link>
          </div>
          
          <h1 className="auth-title">Khôi phục mật khẩu</h1>
          <p className="auth-subtitle">
            {step === 1 && 'Nhập địa chỉ email của bạn để nhận mã xác thực OTP.'}
            {step === 2 && 'Nhập mã OTP 6 số đã được gửi tới email của bạn.'}
            {step === 3 && 'Nhập mật khẩu mới cho tài khoản của bạn.'}
          </p>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          {step === 1 ? (
            <form className="auth-form" onSubmit={handleRequestOtp}>
              <div className="auth-input-group">
                <label className="auth-label">Địa chỉ Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-btn">
                <span>Gửi mã OTP</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </form>
          ) : step === 2 ? (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <div className="auth-input-group">
                <label className="auth-label">Mã OTP</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Nhập mã OTP 6 số"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="auth-btn">
                <span>Xác nhận OTP</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="auth-input-group">
                <label className="auth-label">Mật khẩu mới</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-btn">
                <span>Đặt lại mật khẩu</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </form>
          )}

          <p className="auth-footer-text">
            Đã nhớ lại mật khẩu? <Link to="/login" className="auth-link">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
