import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DoubtSolver from './components/DoubtSolver';
import SyllabusTracker from './components/SyllabusTracker';
import PracticeEngine from './components/PracticeEngine';
import Analytics from './components/Analytics';
import Planner from './components/Planner';
import Resources from './components/Resources';
import Community from './components/Community';
import Auth from './components/Auth';
import ProfileView from './components/ProfileView';
import Tutorial from './components/Tutorial';
import StreamSetup from './components/StreamSetup';
import { API_BASE } from './config';


const OFFLINE_SYLLABUS = [
  {
    subjectName: 'Physics',
    chapters: [
      { chapterName: 'Electric Charges and Fields', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Electrostatic Potential and Capacitance', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Current Electricity', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Moving Charges and Magnetism', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Magnetism and Matter', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Electromagnetic Induction', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Alternating Current', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Ray Optics and Optical Instruments', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Wave Optics', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Semiconductor Electronics: Materials, Devices & Simple Circuits', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Chemistry',
    chapters: [
      { chapterName: 'Solutions', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Electrochemistry', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Chemical Kinetics', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Coordination Compounds', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Haloalkanes and Haloarenes', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Alcohols, Phenols and Ethers', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Biomolecules', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Mathematics',
    chapters: [
      { chapterName: 'Relations and Functions', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Matrices', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Continuity and Differentiability', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Integrals', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Probability', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Biology',
    chapters: [
      { chapterName: 'Sexual Reproduction in Flowering Plants', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Human Reproduction', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Reproductive Health', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Principles of Inheritance and Variation', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Economics',
    chapters: [
      { chapterName: 'Introduction to Macroeconomics & National Income Accounting', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Money and Banking', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Government Budget and the Economy', status: 'Todo', masteryScore: 0 }
    ]
  },
  {
    subjectName: 'Computer Science',
    chapters: [
      { chapterName: 'Exception Handling', status: 'Todo', masteryScore: 0 },
      { chapterName: 'File Handling', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Stack', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Queue', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Searching', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Sorting', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Database Concepts', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Structured Query Language (SQL)', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Computer Networks', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Data Communication and Network Security', status: 'Todo', masteryScore: 0 },
      { chapterName: 'Interface Python with SQL (MySQL Connectivity)', status: 'Todo', masteryScore: 0 }
    ]
  }
];

const OFFLINE_GOALS = [
  { taskName: 'Complete 1 Pomodoro study session', completed: false },
  { taskName: 'Ask the AI Doubt Solver a question', completed: false },
  { taskName: 'Update chapter completion checklist', completed: false }
];

const STREAM_SUBJECTS = {
  general: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Computer Science'],
  pcmb: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  pcmc: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science'],
  pcb: ['Physics', 'Chemistry', 'Biology'],
  commerce: ['Economics', 'Mathematics']
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return (u && u !== 'undefined') ? JSON.parse(u) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      return null;
    }
  });
  const [toasts, setToasts] = useState([]);

  const [activeTab, setActiveTab] = useState('tutorial');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [accent, setAccent] = useState(localStorage.getItem('accent') || 'classic-slate');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileHeaderHidden, setMobileHeaderHidden] = useState(false);
  
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Show stream setup if user hasn't explicitly set a stream.
  // Skip if:  (a) they've been through setup before (localStorage flag), OR
  //           (b) they already have a non-"general" stream saved in their DB profile
  const alreadyConfigured = user && (
    localStorage.getItem(`stream_configured_${user._id}`) ||
    (user.stream && user.stream !== 'general')
  );
  const needsStreamSetup = user && !alreadyConfigured;

  const userStream = user?.stream || 'general';
  const allowedSubjects = STREAM_SUBJECTS[userStream] || STREAM_SUBJECTS.general;

  const filteredProgressData = progressData ? {
    ...progressData,
    subjectProgress: progressData.subjectProgress.filter(s => allowedSubjects.includes(s.subjectName))
  } : null;

  useEffect(() => {
    setMobileHeaderHidden(false);
  }, [activeTab]);

  // Toast utility
  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(curr => curr.filter(x => x.id !== id));
    }, 4000);
  };

  // Apply Theme and Accent attributes to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('accent', accent);
  }, [accent]);

  // Load profile data on start or when user changes
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    const userId = user?._id || 'default-student';
    try {
      const res = await fetch(`${API_BASE}/student/progress?userId=${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setProgressData(data);
      setIsOffline(false);
    } catch (err) {
      console.warn('Backend connection offline. Running in local cache mode.');
      setIsOffline(true);
      
      const cachedKey = `cbse_progress_data_${userId}`;
      const cached = localStorage.getItem(cachedKey);
      if (cached) {
        setProgressData(JSON.parse(cached));
      } else {
        const initialOffline = {
          userId,
          streak: { count: 0, lastActive: null },
          subjectProgress: OFFLINE_SYLLABUS,
          studyTime: [],
          dailyGoals: OFFLINE_GOALS
        };
        setProgressData(initialOffline);
        localStorage.setItem(cachedKey, JSON.stringify(initialOffline));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    // Clear any previous stream_configured flag when logging in fresh
    // so returning users who haven't set it will see the setup screen
    // Note: if they already have a non-general stream saved in DB, they won't see it (handled via needsStreamSetup)
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    addToast('Logged out successfully', 'success');
  };

  const handleUpdateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleUpdateChapter = async (subjectName, chapterName, newStatus) => {
    const userId = user?._id || 'default-student';
    if (isOffline) {
      const updated = { ...progressData };
      const sub = updated.subjectProgress.find(s => s.subjectName === subjectName);
      if (sub) {
        const ch = sub.chapters.find(c => c.chapterName === chapterName);
        if (ch) ch.status = newStatus;
      }
      setProgressData(updated);
      localStorage.setItem(`cbse_progress_data_${userId}`, JSON.stringify(updated));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/student/progress/chapter`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ userId, subjectName, chapterName, status: newStatus })
      });
      const data = await res.json();
      setProgressData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleGoal = async (taskName, completed) => {
    const userId = user?._id || 'default-student';
    if (isOffline) {
      const updated = { ...progressData };
      const goal = updated.dailyGoals.find(g => g.taskName === taskName);
      if (goal) goal.completed = completed;
      setProgressData(updated);
      localStorage.setItem(`cbse_progress_data_${userId}`, JSON.stringify(updated));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/student/progress/goal`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ userId, taskName, completed })
      });
      const data = await res.json();
      setProgressData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStudyTime = async (minutes) => {
    const userId = user?._id || 'default-student';
    if (isOffline) {
      const updated = { ...progressData };
      const todayStr = new Date().toISOString().split('T')[0];
      const index = updated.studyTime.findIndex(s => s.date === todayStr);
      if (index !== -1) {
        updated.studyTime[index].minutes += minutes;
      } else {
        updated.studyTime.push({ date: todayStr, minutes });
      }
      setProgressData(updated);
      localStorage.setItem(`cbse_progress_data_${userId}`, JSON.stringify(updated));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/student/progress/study-time`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ userId, minutes })
      });
      const data = await res.json();
      setProgressData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTestResult = async (testResult) => {
    const userId = user?._id || 'default-student';
    if (isOffline) {
      if (testResult.score !== null && testResult.totalMarks > 0) {
        const pct = Math.round((testResult.score / testResult.totalMarks) * 100);
        const updated = { ...progressData };
        const sub = updated.subjectProgress.find(s => s.subjectName === testResult.subject);
        if (sub) {
          const ch = sub.chapters.find(c => c.chapterName === testResult.chapter);
          if (ch) {
            ch.masteryScore = pct;
            ch.status = pct >= 80 ? 'Completed' : 'InProgress';
          }
        }
        setProgressData(updated);
        localStorage.setItem(`cbse_progress_data_${userId}`, JSON.stringify(updated));
      }
      return;
    }

    try {
      await fetch(`${API_BASE}/student/tests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ userId, ...testResult })
      });
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  // Rendering Session Gate: Auth Page if not logged in
  if (!token || !user) {
    return (
      <>
        <Auth onAuthSuccess={handleAuthSuccess} addToast={addToast} />
        
        {/* Floating Toasts */}
        <div style={{ position: 'fixed', top: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000 }}>
          {toasts.map(t => (
            <div 
              key={t.id} 
              className={`badge badge-${t.type === 'danger' ? 'danger' : t.type === 'warning' ? 'warning' : 'success'}`} 
              style={{ padding: '0.8rem 1.4rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}
            >
              {t.msg}
            </div>
          ))}
        </div>
      </>
    );
  }

  // Stream setup gate: show onboarding for users who haven't picked a stream
  if (needsStreamSetup) {
    return (
      <>
        <StreamSetup
          user={user}
          token={token}
          onComplete={(updatedUser) => {
            handleUpdateUser(updatedUser);
            // Mark as configured so we don't show again
            localStorage.setItem(`stream_configured_${user._id}`, '1');
          }}
        />
        {/* Floating Toasts */}
        <div style={{ position: 'fixed', top: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10000 }}>
          {toasts.map(t => (
            <div
              key={t.id}
              className={`badge badge-${t.type === 'danger' ? 'danger' : t.type === 'warning' ? 'warning' : 'success'}`}
              style={{ padding: '0.8rem 1.4rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}
            >
              {t.msg}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className={`app-container ${mobileHeaderHidden ? 'mobile-header-hidden' : ''}`}>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/walrus.png" alt="Walrus Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>Walrus</span>
        </div>
        <div style={{ width: '24px' }} />
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        setTheme={setTheme} 
        accent={accent} 
        setAccent={setAccent}
        streakCount={progressData?.streak?.count || 0}
        user={user}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className={`main-content ${activeTab === 'doubt-solver' ? 'chat-mode' : ''}`}>
        {isOffline && (
          <div className="badge badge-danger" style={{ marginBottom: '1.5rem', width: '100%', justifyContent: 'center', padding: '0.6rem' }}>
            <span>⚠️ Standalone Offline Mode: Express Server is offline. Running with cached LocalStorage state.</span>
          </div>
        )}

        <div className="page-transition" style={{ height: activeTab === 'doubt-solver' ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>

          <div style={{ display: activeTab === 'tutorial' ? 'block' : 'none' }}>
            <Tutorial setActiveTab={setActiveTab} user={user} />
          </div>

          <div style={{ display: activeTab === 'doubt-solver' ? 'flex' : 'none', flexDirection: 'column', height: '100%', width: '100%', minHeight: 0, overflow: 'hidden' }}>
            <DoubtSolver 
              progressData={filteredProgressData} 
              onActivityTriggered={handleUpdateStudyTime}
              user={user}
              activeTab={activeTab}
              onScrollDirectionChange={setMobileHeaderHidden}
            />
          </div>

          <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
            <ProfileView
              token={token}
              user={user}
              onUpdateUser={handleUpdateUser}
              addToast={addToast}
            />
          </div>
          
          <div style={{ display: activeTab === 'syllabus-tracker' ? 'block' : 'none' }}>
            <SyllabusTracker 
              progressData={filteredProgressData} 
              onUpdateChapter={handleUpdateChapter}
              isLoading={isLoading}
            />
          </div>
          
          <div style={{ display: activeTab === 'practice-engine' ? 'block' : 'none' }}>
            <PracticeEngine 
              progressData={filteredProgressData} 
              onSaveTestResult={handleSaveTestResult}
              user={user}
              activeTab={activeTab}
            />
          </div>
          
          <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
            <Analytics progressData={filteredProgressData} />
          </div>
          
          <div style={{ display: activeTab === 'planner' ? 'block' : 'none' }}>
            <Planner 
              progressData={filteredProgressData}
              onToggleGoal={handleToggleGoal}
              onUpdateStudyTime={handleUpdateStudyTime}
              onRefreshProfile={fetchProfile}
            />
          </div>
          
          <div style={{ display: activeTab === 'community' ? 'block' : 'none' }}>
            <Community progressData={filteredProgressData} user={user} />
          </div>
        </div>
      </main>

      {/* Floating Toasts */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000 }}>
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`badge badge-${t.type === 'danger' ? 'danger' : t.type === 'warning' ? 'warning' : 'success'}`} 
            style={{ padding: '0.8rem 1.4rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
