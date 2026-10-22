import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ChangePassword from './ChangePassword';
import AddressManager from '../components/AddressManager';
import './Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);
      if (user && setUser) {
        setUser({ ...user, fullName: response.data.fullName });
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const fullName = profile.fullName?.trim() || '';
    const phone = profile.phone?.trim() || '';
    const email = profile.email?.trim() || '';
    const validationErrors = {};

    if (fullName.length < 2 || fullName.length > 100 || !/^\p{L}+(?:\s+\p{L}+)*$/u.test(fullName)) {
      validationErrors.fullName = 'Full Name can contain letters and spaces only';
    }
    if (!/^0\d{9}$/.test(phone)) {
      validationErrors.phone = 'Phone Number must contain exactly 10 digits and start with 0';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const updatedProfile = { ...profile, fullName, phone, email };
      const response = await api.put('/profile', updatedProfile);
      setProfile(response.data);
      setMessage('Profile updated successfully');
      if (user && setUser) {
        setUser({ ...user, fullName: response.data.fullName, email: response.data.email });
      }
    } catch (err) {
      const errorData = err.response?.data;
      setError(typeof errorData === 'string' ? errorData : errorData?.message || 'Failed to update profile');
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '0.95rem' }}>
      Đang tải thông tin tài khoản...
    </div>
  );

  return (
    <div className="profile-page-wrapper">
      <div className="profile-cover">
        <div className="profile-cover-overlay"></div>
      </div>

      <div className="profile-container">
        <div className="profile-back-nav">
          <Link to="/" className="profile-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="profile-back-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-avatar-wrapper">
              <div
                className="profile-avatar"
                style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=111827&color=fff&size=200')` }}
              />
            </div>
            <h1 className="profile-name">{profile?.fullName || 'My Account'}</h1>
            <p className="profile-email">{profile?.email}</p>

            <Link to="/shop/orders" className="profile-sidebar-link profile-sidebar-link--primary">
              📦 Đơn hàng của tôi
            </Link>
            <Link to="/shop/notifications" className="profile-sidebar-link profile-sidebar-link--secondary">
              🔔 Thông báo của tôi
            </Link>
          </div>

          {/* Main content area */}
          <div className="profile-content-area">
            {/* Personal Info card */}
            <div className="profile-card">
              <h2 className="profile-card-title">Personal Information</h2>
              {error && <div className="profile-alert profile-alert-error">{error}</div>}
              {message && <div className="profile-alert profile-alert-success">{message}</div>}

              {profile && (
                <form onSubmit={handleUpdate} noValidate>
                  <div className="profile-form-group">
                    <label className="profile-label">Full Name</label>
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="Enter your full name"
                      value={profile.fullName || ''}
                      maxLength="100"
                      onChange={(e) => {
                        setProfile({ ...profile, fullName: e.target.value });
                        setFieldErrors({ ...fieldErrors, fullName: '' });
                      }}
                    />
                    {fieldErrors.fullName && <div className="profile-field-error">{fieldErrors.fullName}</div>}
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-label">Phone Number</label>
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="Enter your phone number"
                      value={profile.phone || ''}
                      inputMode="numeric"
                      maxLength="10"
                      onChange={(e) => {
                        setProfile({ ...profile, phone: e.target.value });
                        setFieldErrors({ ...fieldErrors, phone: '' });
                      }}
                    />
                    {fieldErrors.phone && <div className="profile-field-error">{fieldErrors.phone}</div>}
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-label">Email Address</label>
                    <input
                      type="email"
                      className="profile-input"
                      value={profile.email || ''}
                      onChange={(e) => {
                        setProfile({ ...profile, email: e.target.value });
                        setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                    />
                    {fieldErrors.email && <div className="profile-field-error">{fieldErrors.email}</div>}
                  </div>

                  <button type="submit" className="profile-btn">
                    Save Changes
                  </button>
                </form>
              )}
            </div>

            {/* Change Password card */}
            <ChangePassword />

            {/* Address Manager card */}
            <div className="profile-card">
              <h2 className="profile-card-title">Địa chỉ giao hàng</h2>
              <AddressManager userId={user?.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
