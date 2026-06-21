import React from 'react';
import { 
  BookOpen, 
  MessageSquare, 
  CheckSquare, 
  Activity, 
  Calendar, 
  Users, 
  Sun, 
  Moon, 
  GraduationCap,
  LogOut,
  X,
  HelpCircle
} from 'lucide-react';


const ACCENTS = [
  { name: 'classic-slate', hex: '#8c826b', label: 'Classic Slate' },
  { name: 'rose-amber', hex: '#d99f59', label: 'Rose Amber' },
  { name: 'amethyst', hex: '#8b5cf6', label: 'Amethyst' },
  { name: 'emerald', hex: '#5f7560', label: 'Emerald' },
  { name: 'terracotta', hex: '#b05a5a', label: 'Terracotta' },
  { name: 'sapphire', hex: '#4f46e5', label: 'Sapphire' }
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  setTheme, 
  accent, 
  setAccent,
  streakCount,
  user,
  onLogout,
  isOpen,
  onClose
}) {
  const menuItems = [
    { id: 'tutorial', label: 'Quick Start Tour', icon: HelpCircle },
    { id: 'doubt-solver', label: 'AI Doubt Solver', icon: MessageSquare },
    { id: 'syllabus-tracker', label: 'Syllabus Tracker', icon: CheckSquare },
    { id: 'practice-engine', label: 'Practice Engine', icon: GraduationCap },
    { id: 'analytics', label: 'Analytics Dashboard', icon: Activity },
    { id: 'planner', label: 'Planner & productivity', icon: Calendar },
    { id: 'community', label: 'Community Hub', icon: Users }
  ];

  const presets = [
    { id: 'walrus_classic', color: '#8c826b' },
    { id: 'walrus_rose', color: '#d99f59' },
    { id: 'walrus_amethyst', color: '#8b5cf6' },
    { id: 'walrus_emerald', color: '#5f7560' },
    { id: 'walrus_terracotta', color: '#b05a5a' },
    { id: 'walrus_sapphire', color: '#4f46e5' },
  ];

  const getAvatarStyle = (avatarId) => {
    if (avatarId && avatarId.startsWith('data:image/')) {
      return {};
    }
    const found = presets.find(p => p.id === avatarId);
    return { backgroundColor: found ? found.color : '#8c826b', color: '#ffffff' };
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Logo Header */}
      <div className="brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '2.5rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src="/walrus.png" 
            alt="Walrus Logo" 
            style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '10px', 
              objectFit: 'cover',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-color)'
            }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', lineHeight: '1' }}>
              Walrus
            </span>
            <span style={{ fontSize: '0.62rem', fontWeight: '600', color: 'var(--primary)', marginTop: '0.15rem', letterSpacing: '0.01em', lineHeight: '1.2' }}>
              AI-Powered Productivity Hub
            </span>
          </div>
        </div>
        <button 
          className="mobile-close-btn" 
          onClick={onClose} 
          style={{ 
            display: 'none', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {streakCount > 0 && (
        <div className="streak-badge-premium">
          <span className="streak-fire-icon">🔥</span>
          <span>{streakCount} Day Streak!</span>
        </div>
      )}

      <div className="nav-menu">
        <div className="nav-group-header">Learning Core</div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.filter(item => ['doubt-solver', 'syllabus-tracker', 'practice-engine'].includes(item.id)).map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <a 
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.id); if (onClose) onClose(); }}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="nav-group-header">Productivity & Insights</div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.filter(item => ['planner', 'analytics'].includes(item.id)).map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <a 
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.id); if (onClose) onClose(); }}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="nav-group-header">Explore</div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.filter(item => ['community', 'tutorial'].includes(item.id)).map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <a 
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.id); if (onClose) onClose(); }}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-controls">
        {/* Logged in User Profile Node */}
        {user && (
          <div 
            onClick={() => { setActiveTab('profile'); if (onClose) onClose(); }}
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.6rem', 
              padding: '0.65rem 0.85rem', 
              backgroundColor: activeTab === 'profile' ? 'var(--primary-light)' : 'rgba(var(--primary-rgb), 0.04)', 
              borderRadius: 'var(--radius-md)', 
              border: activeTab === 'profile' ? '1px solid var(--primary)' : '1px solid var(--border-color)', 
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: 0
            }}
            className="sidebar-profile-card"
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid var(--border-color)',
              ...getAvatarStyle(user.avatar)
            }}>
              {user.avatar && user.avatar.startsWith('data:image/') ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{(user.username || 'W').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'left', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem', width: '100%', overflow: 'hidden' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </span>
                <span className="sidebar-stream-tag" style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '0.1rem 0.3rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(var(--primary-rgb), 0.15)',
                  flexShrink: 0
                }}>
                  {user.stream === 'general' || !user.stream ? 'ALL' : user.stream}
                </span>
              </div>
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
                {user.email}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Switch Light/Dark Mode" style={{ flex: 1 }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {onLogout && (
            <button 
              className="theme-toggle-btn" 
              onClick={onLogout} 
              title="Log Out Session"
              style={{ flex: 1, backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
