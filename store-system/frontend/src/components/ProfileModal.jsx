import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        id: user.id, 
        username 
      };
      if (password) payload.password = password;

      const res = await api.put('/users/profile', payload);
      setSuccess(res.data.message || 'Profile updated successfully.');
      
      // If password changed, suggest re-login, or simply auto logout
      if (res.data.requires_login) {
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content animate-fade-in-up" style={{
        maxWidth: '450px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        padding: 0,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-main/20 text-brand rounded-xl shadow-lg border border-main/20">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">My Profile</h2>
              <p className="text-xs text-muted font-medium mt-0.5">Update your credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {error && <div className="alert alert-error mb-4">{error}</div>}
          {success && <div className="alert alert-success mb-4">{success}</div>}
          
          <form id="profileForm" onSubmit={handleSubmit}>
            <div className="form-group mb-5">
              <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3.5 text-muted" />
                <input type="text" className="form-control pl-10 bg-dark/40 border-white/10" required 
                  value={username} onChange={e => setUsername(e.target.value)} />
              </div>
            </div>

            <div className="form-group mb-5">
              <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">New Password <span className="lowercase text-muted font-normal">(Leave blank to keep current)</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-muted" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-control pl-10 pr-10 bg-dark/40 border-white/10"
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => setShowPwd(p => !p)} tabIndex="-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {password && (
              <div className="form-group mb-2">
                <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-muted" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="form-control pl-10 pr-10 bg-dark/40 border-white/10"
                    required={!!password} minLength={6}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer" style={{
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button className="btn btn-glass" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="profileForm" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }} disabled={loading}>
            {loading ? 'Saving...' : 'Update Profile'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileModal;
