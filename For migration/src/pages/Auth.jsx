import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Send, Sparkles, Loader2 } from 'lucide-react';
import { API_BASE } from '../config';

const Auth = ({ onAuthSuccess, addToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!email.trim() || !password.trim()) {
      addToast('Please fill in all required fields', 'warning');
      return;
    }
    if (!isLogin && !username.trim()) {
      addToast('Username is required for signup', 'warning');
      return;
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters long', 'warning');
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

      addToast(isLogin ? `Welcome back, ${data.username}!` : `Account created! Welcome, ${data.username}!`, 'success');
      
      // Store in LocalStorage and trigger success callback
      onAuthSuccess(data.token, data);
    } catch (error) {
      console.error(error);
      addToast(error.message || 'Error occurred during authentication', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <img 
            src="/walrus.jpeg" 
            alt="Walrus Logo" 
            style={{ width: '4rem', height: '4rem', borderRadius: '50%', objectFit: 'cover', boxShadow: 'var(--shadow-glow)' }} 
          />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            <span>Walrus</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Your AI-Powered Productivity Assistant
          </p>
        </div>

        {/* Tab Selector */}
        <div className="filters-bar" style={{ paddingBottom: 0, borderBottom: 'none', justifyContent: 'center', margin: 0 }}>
          <div className="filter-tabs" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <button
              className={`filter-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setPassword(''); }}
              style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.9rem' }}
            >
              Sign In
            </button>
            <button
              className={`filter-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setPassword(''); }}
              style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.9rem' }}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Username (Only for Sign Up) */}
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <UserIcon size={16} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={16} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              className="input-field"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={16} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              className="input-field"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }} 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="spinner" size={18} />
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
};

export default Auth;
