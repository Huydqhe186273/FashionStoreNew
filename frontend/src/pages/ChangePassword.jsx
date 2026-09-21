import React, { useState } from 'react';
import api from '../services/api';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.post('/profile/change-password', { oldPassword, newPassword });
      setMessage('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || errorData?.error || 'Failed to change password';
      setError(errorMessage);
    }
  };

  return (
    <div className="profile-card">
      <h2 className="profile-card-title">Change Password</h2>
      {error && <div className="profile-alert profile-alert-error">{error}</div>}
      {message && <div className="profile-alert profile-alert-success">{message}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="profile-form-group">
          <label className="profile-label">Current Password</label>
          <input
            type="password"
            required
            className="profile-input"
            placeholder="Enter current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        
        <div className="profile-form-group">
          <label className="profile-label">New Password</label>
          <input
            type="password"
            required
            className="profile-input"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        
        <button type="submit" className="profile-btn">
          Change Password
        </button>
      </form>
    </div>
  );
}
