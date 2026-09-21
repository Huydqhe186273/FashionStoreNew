import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    
    // Validate Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    } else if (!/^[\p{L}\s]+$/u.test(formData.fullName)) {
      newErrors.fullName = 'Họ và tên chỉ được chứa chữ cái';
    }

    // Validate Email
    if (!formData.email) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    // Validate Password
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Validate Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccess('');
    
    if (!validate()) return;

    try {
      const requestData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      };
      await api.post('/auth/register', requestData);
      setSuccess('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setApiError(err.response?.data || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-side" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        <div className="auth-image-overlay"></div>
      </div>
      
      <div className="auth-form-side">
        <div className="auth-form-container">
          <Link to="/" className="auth-logo">FASHION STORE.</Link>
          
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join us to get the latest fashion updates.</p>
          
          {apiError && <div className="auth-error">{apiError}</div>}
          {success && <div className="auth-success">{success}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-input-group">
              <label className="auth-label">Họ và tên / Full Name</label>
              <input
                type="text"
                className={`auth-input ${errors.fullName ? 'input-error' : ''}`}
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>
            
            <div className="auth-input-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className={`auth-input ${errors.email ? 'input-error' : ''}`}
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className="auth-input-group">
              <label className="auth-label">Mật khẩu / Password</label>
              <input
                type="password"
                className={`auth-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Xác nhận mật khẩu / Confirm Password</label>
              <input
                type="password"
                className={`auth-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="auth-btn">Sign Up</button>
          </form>
          
          <div className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
