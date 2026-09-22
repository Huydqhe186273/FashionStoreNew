import React, { useState } from 'react';
import api from '../services/api';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const validationErrors = {};
    if (!oldPassword) {
      validationErrors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    if (!newPassword) {
      validationErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 6) {
      validationErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    } else if (newPassword === oldPassword) {
      validationErrors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu cũ';
    }
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await api.post('/profile/change-password', { oldPassword, newPassword });
      setMessage('Đổi mật khẩu thành công.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string'
        ? errorData
        : errorData?.message || errorData?.error || 'Đổi mật khẩu thất bại';
      setError(errorMessage);
    }
  };

  return (
    <div className="profile-card">
      <h2 className="profile-card-title">Change Password</h2>
      {error && <div className="profile-alert profile-alert-error">{error}</div>}
      {message && <div className="profile-alert profile-alert-success">{message}</div>}
      
      <form onSubmit={handleSubmit} noValidate>
        <div className="profile-form-group">
          <label className="profile-label">Current Password</label>
          <input
            type="password"
            required
            className="profile-input"
            placeholder="Enter current password"
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value);
              setFieldErrors({ ...fieldErrors, oldPassword: '' });
            }}
          />
          {fieldErrors.oldPassword && <div className="profile-field-error">{fieldErrors.oldPassword}</div>}
        </div>
        
        <div className="profile-form-group">
          <label className="profile-label">New Password</label>
          <input
            type="password"
            required
            className="profile-input"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setFieldErrors({ ...fieldErrors, newPassword: '' });
            }}
          />
          {fieldErrors.newPassword && <div className="profile-field-error">{fieldErrors.newPassword}</div>}
        </div>
        
        <button type="submit" className="profile-btn">
          Change Password
        </button>
      </form>
    </div>
  );
}
