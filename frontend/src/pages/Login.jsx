import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, id, role } = response.data;
      login(token, { id, email, role });
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'staff') {
        navigate('/staff/orders');
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="auth-input"
                  style={{ width: '100%', paddingRight: '42px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn">Sign In</button>
          </form>

          <div className="auth-footer-text">
            Don't have an account? <Link to="/register" className="auth-link">Sign up for free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
