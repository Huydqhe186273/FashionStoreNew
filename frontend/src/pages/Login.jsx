import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // State cho Modal Đăng nhập bằng Google
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('nbacuong1@gmail.com');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, id, role } = response.data;
      login(token, { id, email, role });
      if (role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errorData = err.response?.data;
      setError(typeof errorData === 'string'
        ? errorData
        : errorData?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  const [otpSent, setOtpSent] = useState(false);
  const [googleOtpInput, setGoogleOtpInput] = useState('');

  const handleSendGoogleOtp = async () => {
    if (!googleEmailInput || !googleEmailInput.includes('@')) {
      setGoogleError('Vui lòng nhập địa chỉ Gmail hợp lệ.');
      return;
    }
    setGoogleError('');
    setGoogleLoading(true);
    try {
      await api.post(`/auth/send-google-otp?email=${encodeURIComponent(googleEmailInput)}`);
      setOtpSent(true);
      alert("Đã gửi mã OTP 6 số về Gmail của bạn!");
    } catch (err) {
      setGoogleError(err.response?.data || err.message || 'Lỗi gửi mã OTP');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmailInput || !googleEmailInput.includes('@')) {
      setGoogleError('Vui lòng nhập địa chỉ Gmail hợp lệ.');
      return;
    }
    setGoogleError('');
    setGoogleLoading(true);
    try {
      const fullName = googleEmailInput.split('@')[0];
      let res;
      if (otpSent && googleOtpInput.trim()) {
        res = await api.post('/auth/google-login-with-otp', {
          email: googleEmailInput, fullName, googleId: 'google-sub-123', otp: googleOtpInput.trim()
        });
      } else {
        res = await api.post('/auth/google-login', { email: googleEmailInput, fullName, googleId: 'google-sub-123' });
      }
      const { token, id, role } = res.data;
      login(token, { id, email: googleEmailInput, role });
      setShowGoogleModal(false);
      if (role === 'admin') navigate('/dashboard');
      else navigate('/');
    } catch (err) {
      setGoogleError(err.response?.data || err.message || 'Đăng nhập Google thất bại');
    } finally {
      setGoogleLoading(false);
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
          
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Please enter your details to sign in.</p>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                required
                className="auth-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="auth-input-group">
              <div className="auth-links">
                <label className="auth-label">Password</label>
                <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
              </div>
              <input
                type="password"
                required
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-btn">Sign In</button>
          </form>

          <div style={{ margin: '16px 0', textAlign: 'center', position: 'relative' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#ffffff', padding: '0 12px', fontSize: '0.8rem', color: '#6b7280' }}>
              hoặc
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            style={{
              width: '100%', padding: '12px', backgroundColor: '#ffffff', color: '#374151',
              border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Đăng nhập bằng Gmail / Google
          </button>

          <div className="auth-footer-text" style={{ marginTop: '20px' }}>
            Don't have an account? <Link to="/register" className="auth-link">Sign up for free</Link>
          </div>
        </div>
      </div>

      {/* CUSTOM GOOGLE SIGN-IN MODAL */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px',
            width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #f3f4f6', animation: 'scaleUp 0.2s ease-out forwards'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f3f4f6',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 'bold', color: '#111827' }}>Đăng nhập với Google</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Chọn tài khoản Gmail để tiếp tục vào FashionStore</p>
            </div>

            {googleError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '16px', fontWeight: '500' }}>
                {googleError}
              </div>
            )}

            <form onSubmit={handleGoogleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>
                  Địa chỉ Gmail
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    required
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="nhap-email@gmail.com"
                    style={{
                      flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db',
                      outline: 'none', fontSize: '0.95rem', transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4285F4'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="button"
                    onClick={handleSendGoogleOtp}
                    disabled={googleLoading}
                    style={{
                      padding: '0 12px', backgroundColor: '#f3f4f6', color: '#2563eb',
                      border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: '600', whitespace: 'nowrap'
                    }}
                  >
                    {otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div style={{ marginBottom: '16px', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#1e40af', fontSize: '0.85rem', fontWeight: '600' }}>
                    Nhập mã OTP (6 số) đã gửi về Gmail:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={googleOtpInput}
                    onChange={(e) => setGoogleOtpInput(e.target.value)}
                    placeholder="Ví dụ: 849201"
                    style={{
                      width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #93c5fd',
                      fontSize: '1.1rem', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold',
                      boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              )}

              {/* Gợi ý chọn nhanh */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '8px' }}>Tài khoản gợi ý:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['nbacuong1@gmail.com', 'customer@gmail.com'].map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setGoogleEmailInput(e)}
                      style={{
                        padding: '6px 12px', backgroundColor: googleEmailInput === e ? '#eff6ff' : '#f3f4f6',
                        color: googleEmailInput === e ? '#2563eb' : '#4b5563',
                        border: googleEmailInput === e ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                        borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500'
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  disabled={googleLoading}
                  style={{
                    padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={googleLoading}
                  style={{
                    padding: '10px 24px', backgroundColor: '#4285F4', color: '#ffffff',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                    boxShadow: '0 4px 6px -1px rgba(66, 133, 244, 0.3)', opacity: googleLoading ? 0.7 : 1
                  }}
                >
                  {googleLoading ? 'Đang xác thực...' : 'Xác nhận Đăng nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
