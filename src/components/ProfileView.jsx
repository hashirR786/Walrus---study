import React, { useState } from 'react';
import { User as UserIcon, Camera, Trophy, Sparkles, CheckSquare, Target, Settings, Flame, Loader2 } from 'lucide-react';
import { API_BASE } from '../config';

const ProfileView = ({ token, user, onUpdateUser, addToast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  const [editedAvatar, setEditedAvatar] = useState(user?.avatar || 'walrus_classic');
  const [editedGoal, setEditedGoal] = useState(user?.dailyGoal || 3);
  const [editedCategory, setEditedCategory] = useState(user?.focusCategory || 'general');
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Fetch tasks on render for statistics
  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_BASE}/student/progress?userId=${user?._id || 'default-student'}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Failed to retrieve tasks');
        const data = await res.json();
        // Extract study tasks or all tasks if we have them
        setTasks(data?.dailyGoals || []);
      } catch (error) {
        console.error('Error fetching tasks for stats:', error);
      } finally {
        setLoadingTasks(false);
      }
    };
    if (token) {
      fetchTasks();
    } else {
      setLoadingTasks(false);
    }
  }, [token, user]);

  // Preset Avatar Background Colors (themed to match app design palette)
  const presets = [
    { id: 'walrus_classic', label: 'Classic Slate', color: '#8c826b' },
    { id: 'walrus_rose', label: 'Rose Amber', color: '#d99f59' },
    { id: 'walrus_amethyst', label: 'Amethyst', color: '#8b5cf6' },
    { id: 'walrus_emerald', label: 'Emerald', color: '#5f7560' },
    { id: 'walrus_terracotta', label: 'Terracotta', color: '#b05a5a' },
    { id: 'walrus_sapphire', label: 'Sapphire', color: '#4f46e5' },
  ];

  // Helper: check if avatar is a Base64 image
  const isBase64Avatar = (avatarStr) => {
    return avatarStr && avatarStr.startsWith('data:image/');
  };

  // Helper: get avatar background style
  const getAvatarStyle = (avatarId) => {
    if (isBase64Avatar(avatarId)) {
      return {};
    }
    const found = presets.find(p => p.id === avatarId);
    return { backgroundColor: found ? found.color : '#8c826b', color: '#ffffff' };
  };

  // Helper: Handle file upload and encode to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit to 1.5MB to prevent Mongoose payload size issues
    if (file.size > 1500000) {
      addToast('Image size exceeds limit. Please select an image under 1.5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setEditedAvatar(uploadEvent.target.result); // Save Base64 String
      addToast('Custom avatar loaded! Click Save to apply.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Handler: Save profile settings
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editedUsername.trim()) {
      addToast('Username cannot be empty', 'warning');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editedUsername.trim(),
          avatar: editedAvatar,
          dailyGoal: editedGoal,
          focusCategory: editedCategory,
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile settings');
      const updatedUser = await res.json();
      
      onUpdateUser(updatedUser);
      setIsEditing(false);
      addToast('Profile dashboard updated!', 'success');
    } catch (error) {
      console.error(error);
      addToast(error.message || 'Error saving profile details', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // --- STATS COMPUTATIONS ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Streak Calculation Algorithm: consecutive days with >= 1 task completed
  const calculateStreak = () => {
    // Fallback if tasks don't have streak info
    return user?.streak || 0;
  };

  const currentStreak = calculateStreak();

  if (loadingTasks) {
    return (
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '0.5rem', color: 'var(--text-secondary)' }}>
        <Loader2 className="spinner" size={24} />
        <span>Loading your profile stats...</span>
      </div>
    );
  }

  return (
    <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
      {/* LEFT COLUMN: User Card & Streak */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'stretch' }}>
        <section className="glass-panel profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
          {/* Avatar Render */}
          <div className="profile-main-avatar" style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            overflow: 'hidden',
            border: '2px solid var(--border-color)',
            ...getAvatarStyle(isEditing ? editedAvatar : user?.avatar)
          }}>
            {isBase64Avatar(isEditing ? editedAvatar : user?.avatar) ? (
              <img 
                src={isEditing ? editedAvatar : user?.avatar} 
                alt="Profile Avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <span>{(isEditing ? editedUsername : user?.username || 'W').charAt(0).toUpperCase()}</span>
            )}
          </div>

          <h2 className="profile-username-heading" style={{ margin: '0.5rem 0 0.2rem 0', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{user?.username}</h2>
          <p className="profile-email-sub" style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user?.email}</p>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Member Since: {new Date(user?.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>

          {/* Streak indicator */}
          <div className="streak-widget" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginTop: '1.5rem', 
            padding: '1rem', 
            backgroundColor: 'var(--bg-card-hover)', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)',
            width: '100%'
          }}>
            <div className="streak-icon-container" style={{ fontSize: '1.8rem' }}>
              <Flame className="streak-flame" size={24} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="streak-info" style={{ textAlign: 'left' }}>
              <div className="streak-count-text" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</div>
              <div className="streak-label-text" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {currentStreak > 0 ? 'Conscious streak active! Keep going!' : 'Complete a task today to start your streak!'}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: Settings / Preferences */}
      <section className="glass-panel" style={{ minHeight: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Settings size={20} className="text-primary" />
            <span>Profile Dashboard & Settings</span>
          </h2>
          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => {
              if (isEditing) {
                // Cancel: reset fields
                setEditedUsername(user?.username || '');
                setEditedAvatar(user?.avatar || 'walrus_classic');
                setEditedGoal(user?.dailyGoal || 3);
                setEditedCategory(user?.focusCategory || 'general');
              }
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? 'Cancel' : 'Edit Preferences'}
          </button>
        </div>

        {/* STATS OVERVIEW PANEL */}
        {!isEditing && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Trophy size={14} style={{ color: 'var(--warning)' }} />
              Productivity Overview
            </h3>
            
            <div className="stats-card-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="stat-mini-card" style={{ padding: '1rem', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div className="stat-mini-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalTasks}</div>
                <div className="stat-mini-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Tasks</div>
              </div>
              <div className="stat-mini-card" style={{ padding: '1rem', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div className="stat-mini-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{completedTasks}</div>
                <div className="stat-mini-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed</div>
              </div>
              <div className="stat-mini-card" style={{ padding: '1rem', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div className="stat-mini-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{completionRate}%</div>
                <div className="stat-mini-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completion Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS FORM */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* USERNAME INPUT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Account Username
            </label>
            <input
              type="text"
              className="input-field"
              style={{ width: '100%', padding: '0.6rem 0.85rem' }}
              value={editedUsername}
              onChange={(e) => setEditedUsername(e.target.value)}
              disabled={!isEditing || saving}
              placeholder="Your Username"
            />
          </div>

          {/* AVATAR STYLE SELECTOR */}
          {isEditing && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Customize Avatar
              </label>

              {/* Color Presets */}
              <div className="avatar-select-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {presets.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`avatar-option-btn ${editedAvatar === p.id ? 'selected' : ''}`}
                    style={{ 
                      backgroundColor: p.color, 
                      border: editedAvatar === p.id ? '2px solid var(--text-primary)' : '1px solid transparent',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onClick={() => setEditedAvatar(p.id)}
                    title={p.label}
                  >
                    🦦
                  </button>
                ))}
              </div>

              {/* Device Image Uploader */}
              <div style={{ marginTop: '0.5rem' }}>
                <label className="file-upload-label" style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.5rem 1rem', 
                  backgroundColor: 'var(--bg-card-hover)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>
                  <Camera size={14} />
                  <span>Upload Custom Image</span>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          )}

          {/* PREFERENCES SETTINGS */}
          <div className="profile-preferences-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* DAILY COMPLETION TARGET GOAL */}
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                <span>Daily Completion Target</span>
                <span className="text-primary" style={{ fontWeight: 700 }}>{editedGoal} tasks</span>
              </label>
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
                    value={editedGoal}
                    onChange={(e) => setEditedGoal(parseInt(e.target.value))}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <Target size={16} className="text-muted" />
                  <span>{user?.dailyGoal || 3} Tasks completed / day</span>
                </div>
              )}
            </div>

            {/* DEFAULT FOCUS CATEGORY */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Default Focus Category
              </label>
              {isEditing ? (
                <select
                  className="filter-select"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', height: '2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                >
                  <option value="general">📂 General</option>
                  <option value="work">💼 Work</option>
                  <option value="study">📚 Study</option>
                  <option value="personal">👤 Personal</option>
                  <option value="career">🚀 Career</option>
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', textTransform: 'capitalize' }}>
                  <CheckSquare size={16} className="text-muted" />
                  <span>{user?.focusCategory || 'General'}</span>
                </div>
              )}
            </div>
          </div>

          {/* SAVE CONTROLS (Only visible in editing mode) */}
          {isEditing && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ width: '100%', padding: '0.85rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {saving ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Save Profile Dashboard</span>
                </>
              )}
            </button>
          )}
        </form>
      </section>
    </div>
  );
};

export default ProfileView;
