import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Sparkles, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config';


export default function Auth({ onAuthSuccess, addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = 'note') => {
    if (addToast) {
      addToast(message, type);
    } else {
      alert(message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    if (!isLogin && !username.trim()) {
      showToast('Username is required for signup', 'warning');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
    const body = isLogin 
      ? { email: email.trim(), password }
      : { username: username.trim(), email: email.trim(), password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      showToast(isLogin ? `Welcome back, ${data.username}!` : `Account created! Welcome, ${data.username}!`, 'success');
      onAuthSuccess(data.token, data);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Error occurred during authentication', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container" data-theme="dark">
      <div className="auth-card">
        {/* Brand Header */}
        <div>
          <img 
            src="/walrus.jpeg" 
            alt="Walrus Logo" 
            className="auth-logo-img"
          />
          <h2 className="auth-title">
            Walrus
          </h2>
          <p className="auth-subtitle">
            AI-Powered Productivity Hub
          </p>
        </div>

        {/* Tab Selector Capsule */}
        <div className="auth-capsule-switcher">
          <button
            type="button"
            className={`auth-switcher-btn ${isLogin ? 'active' : 'inactive'}`}
            onClick={() => { setIsLogin(true); setPassword(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-switcher-btn ${!isLogin ? 'active' : 'inactive'}`}
            onClick={() => { setIsLogin(false); setPassword(''); }}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Username (Only for Sign Up) */}
          {!isLogin && (
            <div className="auth-input-group slide-down">
              <label className="auth-input-label">Username</label>
              <div className="auth-input-wrapper">
                <UserIcon size={18} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-input-field"
                  placeholder="Choose username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="auth-input-group">
            <label className="auth-input-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input-field"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <label className="auth-input-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type="password"
                className="auth-input-field"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="auth-submit-btn" 
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <>
                <Sparkles size={16} />
                <span>{isLogin ? 'Sign In to Dashboard' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
