import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ChangePassword from './ChangePassword';
import './Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);
      // Ensure context has the latest name from backend
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
    try {
      await api.put('/profile', profile);
      setMessage('Profile updated successfully');
      // Update global context so header/sidebar updates immediately
      if (user && setUser) {
        setUser({ ...user, fullName: profile.fullName });
      }
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '40px'}}>Loading profile data...</div>;

  return (
    <div className="profile-page-wrapper">
      <div className="profile-cover">
        <div className="profile-cover-overlay"></div>
      </div>
      
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar" style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=111827&color=fff&size=200')` }}></div>
          <div className="profile-header-text">
            <h1 className="profile-title">My Account</h1>
            <p className="profile-subtitle">Manage your personal information and security settings.</p>
          </div>
        </div>
        
        <div className="profile-content">
          <div className="profile-card">
            <h2 className="profile-card-title">Personal Information</h2>
            {error && <div className="profile-alert profile-alert-error">{error}</div>}
            {message && <div className="profile-alert profile-alert-success">{message}</div>}
            
            {profile && (
              <form onSubmit={handleUpdate}>
                <div className="profile-form-group">
                  <label className="profile-label">Full Name</label>
                  <input
                    type="text"
                    className="profile-input"
                    placeholder="Enter your full name"
                    value={profile.fullName || ''}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  />
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-label">Phone Number</label>
                  <input
                    type="text"
                    className="profile-input"
                    placeholder="Enter your phone number"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-label">Email Address</label>
                  <input
                    type="email"
                    disabled
                    className="profile-input"
                    value={profile.email || ''}
                    title="Email cannot be changed"
                  />
                </div>
                
                <button type="submit" className="profile-btn">
                  Save Changes
                </button>
              </form>
            )}
          </div>

          <ChangePassword />
        </div>
      </div>
    </div>
  );
}
