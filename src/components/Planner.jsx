import React, { useState, useEffect } from 'react';
import { Calendar, Play, Pause, RotateCcw, CheckSquare, Sparkles, RefreshCw, Volume2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { API_BASE } from '../config';

export default function Planner({ progressData, onToggleGoal, onUpdateStudyTime, onRefreshProfile }) {
  // Pomodoro states
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [mode, setMode] = useState('work'); // work, short-break, long-break
  
  // AI Schedule states
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState(() => {
    try {
      const cached = localStorage.getItem('walrus_study_schedule');
      if (cached) {
        const parsed = JSON.parse(cached);
        const today = new Date().toISOString().split('T')[0];
        if (parsed.examDate && parsed.examDate >= today) {
          return parsed.schedule || '';
        }
      }
    } catch {}
    return '';
  });

  const [examDate, setExamDate] = useState(() => {
    try {
      const cached = localStorage.getItem('walrus_study_schedule');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.examDate || '2027-03-01';
      }
    } catch {}
    return '2027-03-01';
  });

  const [targetScore, setTargetScore] = useState(() => {
    try {
      const cached = localStorage.getItem('walrus_study_schedule');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.targetScore || '95%';
      }
    } catch {}
    return '95%';
  });

  const [showGenerateForm, setShowGenerateForm] = useState(!schedule);

  // Pomodoro logic
  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer expired
            playBeepSound();
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, minutes, seconds]);

  const handleTimerComplete = () => {
    setTimerActive(false);
    if (mode === 'work') {
      // Award study minutes to the database progress tracking!
      onUpdateStudyTime(25);
      alert('Pomodoro study slot completed! 25 minutes logged to your progress.');
      setMode('short-break');
      setMinutes(5);
    } else {
      alert('Break completed! Let\'s focus.');
      setMode('work');
      setMinutes(25);
    }
    setSeconds(0);
  };

  // Play synthesized bell sound using browser AudioContext (works fully offline with no file assets)
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A note
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2); // Fade out

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn('AudioContext alert failed:', e);
    }
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setMinutes(mode === 'work' ? 25 : mode === 'short-break' ? 5 : 15);
    setSeconds(0);
  };

  const setTimerMode = (newMode, mins) => {
    setMode(newMode);
    setTimerActive(false);
    setMinutes(mins);
    setSeconds(0);
  };

  const handleGenerateSchedule = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (examDate && examDate < today) {
      alert('Target exam date cannot be in the past. Please select a future date.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/generate-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectProgress: progressData?.subjectProgress || [],
          examDate,
          targetScore
        })
      });
      const data = await res.json();
      setSchedule(data.schedule);
      
      // Cache the schedule details
      localStorage.setItem('walrus_study_schedule', JSON.stringify({
        schedule: data.schedule,
        examDate,
        targetScore
      }));
      setShowGenerateForm(false);
    } catch (err) {
      console.error(err);
      alert('Failed to generate study schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  // Expiration check effect
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (examDate && examDate < today && schedule) {
      setSchedule('');
      localStorage.removeItem('walrus_study_schedule');
      setShowGenerateForm(true);
    }
  }, [examDate, schedule]);

  return (
    <div className="glass-panel" style={{ maxWidth: '950px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar size={28} /> Study Planner & Pomodoro Workspace
      </h2>

      <div className="dashboard-grid planner-main-grid" style={{ gridTemplateColumns: '1.1fr 1.9fr' }}>
        {/* Left Column: Pomodoro & Daily Goals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Pomodoro Dial Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Pomodoro Study Timer</h3>
            
            {/* Timer mode buttons */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: mode === 'work' ? 'var(--primary-light)' : 'transparent', color: mode === 'work' ? 'var(--primary)' : 'var(--text-secondary)' }}
                onClick={() => setTimerMode('work', 25)}
              >
                Work (25m)
              </button>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: mode === 'short-break' ? 'var(--primary-light)' : 'transparent', color: mode === 'short-break' ? 'var(--primary)' : 'var(--text-secondary)' }}
                onClick={() => setTimerMode('short-break', 5)}
              >
                Short Break (5m)
              </button>
            </div>

            <div className={`pomodoro-dial ${timerActive ? 'active' : ''}`}>
              {minutes}:{seconds < 10 ? '0' + seconds : seconds}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setTimerActive(!timerActive)}>
                {timerActive ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button className="btn-secondary" onClick={handleResetTimer}>
                <RotateCcw size={18} />
              </button>
              <button className="btn-secondary" title="Test Alert Bell Sound" onClick={playBeepSound}>
                <Volume2 size={18} />
              </button>
            </div>
          </div>

          {/* Daily Goals checklist */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckSquare size={18} /> Daily Checklists
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(progressData?.dailyGoals || []).map((goal) => (
                <label 
                  key={goal.taskName} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    fontSize: '0.9rem', 
                    cursor: 'pointer',
                    textDecoration: goal.completed ? 'line-through' : 'none',
                    color: goal.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={(e) => onToggleGoal(goal.taskName, e.target.checked)}
                  />
                  <span>{goal.taskName}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI weekly study schedules */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} /> AI Syllabus Calendar Builder
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Get a weekly calendar study schedule automatically generated based on the exam dates and completed chapters.
          </p>

          {showGenerateForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                  <label>Target Exam Date</label>
                  <input 
                    type="date" 
                    className="input-control" 
                    value={examDate} 
                    onChange={(e) => setExamDate(e.target.value)} 
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                  <label>Target Percentage</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={targetScore} 
                    onChange={(e) => setTargetScore(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn-primary" onClick={handleGenerateSchedule} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isLoading ? <><RefreshCw className="animate-spin" size={16} /> Generating schedule…</> : 'Generate Study Schedule'}
                </button>
                {schedule && (
                  <button className="btn-secondary" onClick={() => setShowGenerateForm(false)} disabled={isLoading}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--primary-light)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  📅 <strong>Active Schedule Target:</strong> {examDate} &nbsp;·&nbsp; 🎯 <strong>Goal:</strong> {targetScore}
                </div>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  onClick={() => setShowGenerateForm(true)}
                >
                  Generate New Schedule
                </button>
              </div>
            </div>
          )}

          <div className="markdown-body" style={{ flex: 1, backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', maxHeight: '420px', overflowY: 'auto' }}>
            {schedule ? (
              <MarkdownRenderer content={schedule} />
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
                No calendar generated yet. Configure target settings and click Generate above!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
