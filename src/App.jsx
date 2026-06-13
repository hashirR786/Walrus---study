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
  }
];

const OFFLINE_GOALS = [
  { taskName: 'Complete 1 Pomodoro study session', completed: false },
  { taskName: 'Ask the AI Doubt Solver a question', completed: false },
  { taskName: 'Update chapter completion checklist', completed: false }
];

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
  
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

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
      const res = await fetch(`http://localhost:5000/api/student/progress?userId=${userId}`, {
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
      const res = await fetch('http://localhost:5000/api/student/progress/chapter', {
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
      const res = await fetch('http://localhost:5000/api/student/progress/goal', {
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
      const res = await fetch('http://localhost:5000/api/student/progress/study-time', {
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
      await fetch('http://localhost:5000/api/student/tests', {
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

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/walrus.jpeg" alt="Walrus Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
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

        {activeTab === 'tutorial' && (
          <Tutorial setActiveTab={setActiveTab} />
        )}

        {activeTab === 'doubt-solver' && (
          <DoubtSolver 
            progressData={progressData} 
            onActivityTriggered={handleUpdateStudyTime}
            user={user}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            token={token}
            user={user}
            onUpdateUser={handleUpdateUser}
            addToast={addToast}
          />
        )}
        
        {activeTab === 'syllabus-tracker' && (
          <SyllabusTracker 
            progressData={progressData} 
            onUpdateChapter={handleUpdateChapter}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === 'practice-engine' && (
          <PracticeEngine 
            progressData={progressData} 
            onSaveTestResult={handleSaveTestResult}
          />
        )}
        
        {activeTab === 'analytics' && (
          <Analytics progressData={progressData} />
        )}
        
        {activeTab === 'planner' && (
          <Planner 
            progressData={progressData}
            onToggleGoal={handleToggleGoal}
            onUpdateStudyTime={handleUpdateStudyTime}
            onRefreshProfile={fetchProfile}
          />
        )}
        
        {activeTab === 'community' && (
          <Community progressData={progressData} user={user} />
        )}
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
