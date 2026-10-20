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
      const errorData = err.response?.data;
      const errorMsg = typeof errorData === 'string'
        ? errorData
        : errorData?.message || errorData?.error || 'Đăng ký thất bại. Vui lòng kiểm tra lại kết nối hoặc thông tin đăng ký.';
      setApiError(errorMsg);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-side" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        <div className="auth-image-overlay"></div>
        <div className="auth-image-top">
          <div className="auth-image-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>Thành viên mới</span>
          </div>
        </div>
        <div className="auth-image-content">
          <div className="auth-quote-card">
            <div className="auth-quote-stars">★★★★★</div>
            <p className="auth-quote-text">
              "Đăng ký thành viên để nhận ưu đãi độc quyền, cập nhật xu hướng thời trang sớm nhất và trải nghiệm mua sắm tiện lợi."
            </p>
            <div className="auth-quote-author">
              <strong>FashionStore Community</strong>
              <span>Gia nhập cùng hơn 10.000 tín đồ thời trang</span>
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
          
          <h2 className="auth-title">Đăng ký tài khoản</h2>
          <p className="auth-subtitle">Trở thành thành viên để nhận những ưu đãi hấp dẫn nhất.</p>
          
          {apiError && <div className="auth-error">{apiError}</div>}
          {success && <div className="auth-success">{success}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-input-group">
              <label className="auth-label">Họ và tên</label>
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
              <label className="auth-label">Địa chỉ Email</label>
              <input
                type="email"
                className={`auth-input ${errors.email ? 'input-error' : ''}`}
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className="auth-input-group">
              <label className="auth-label">Mật khẩu</label>
              <input
                type="password"
                className={`auth-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Xác nhận mật khẩu</label>
              <input
                type="password"
                className={`auth-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="auth-btn">
              <span>Đăng ký</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
          
          <div className="auth-footer-text">
            Đã có tài khoản? <Link to="/login" className="auth-link">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
