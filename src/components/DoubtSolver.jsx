import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Camera, Image as ImageIcon, Send, RefreshCw, GraduationCap,
  Mic, MicOff, History, Plus, Trash2, ChevronLeft, X, Clock, SlidersHorizontal
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { API_BASE } from '../config';

const SUBJECTS_LIST = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics'];

const getChaptersForSubject = (subj, progressData) => {
  const defaultList = ['All Chapters'];

  if (progressData?.subjectProgress) {
    const foundSub = progressData.subjectProgress.find(
      s => s.subjectName.toLowerCase() === subj.toLowerCase()
    );
    if (foundSub && foundSub.chapters) {
      return [...defaultList, ...foundSub.chapters.map(c => c.chapterName)];
    }
  }

  const fallbackMap = {
    Physics: ['Electric Charges and Fields','Electrostatic Potential and Capacitance','Current Electricity','Moving Charges and Magnetism','Magnetism and Matter','Electromagnetic Induction','Alternating Current','Ray Optics and Optical Instruments','Wave Optics','Semiconductor Electronics: Materials, Devices & Simple Circuits'],
    Chemistry: ['Solutions','Electrochemistry','Chemical Kinetics','Coordination Compounds','Haloalkanes and Haloarenes','Alcohols, Phenols and Ethers','Biomolecules'],
    Mathematics: ['Relations and Functions','Matrices','Continuity and Differentiability','Integrals','Probability'],
    Biology: ['Sexual Reproduction in Flowering Plants','Human Reproduction','Reproductive Health','Principles of Inheritance and Variation'],
    Economics: ['Introduction to Macroeconomics & National Income Accounting','Money and Banking','Government Budget and the Economy']
  };

  return [...defaultList, ...(fallbackMap[subj] || [])];
};

const INITIAL_MESSAGE = {
  role: 'ai',
  content: 'Hi! I am your CBSE Academic Assistant. Choose a subject and chapter to begin. You can write your doubt, upload a question image, or speak your query.',
  timestamp: new Date().toISOString()
};

export default function DoubtSolver({ progressData, onActivityTriggered, user, activeTab, onScrollDirectionChange }) {
  // Load cached active chat from localStorage if available
  const [activeChatCache] = useState(() => {
    try {
      const cached = localStorage.getItem('walrus_active_chat');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [subject, setSubject] = useState(() => activeChatCache?.subject || SUBJECTS_LIST[0]);
  const [chapter, setChapter] = useState(() => activeChatCache?.chapter || 'All Chapters');
  const [mode, setMode] = useState(() => activeChatCache?.mode || 'Doubt Solver');
  const [studentInput, setStudentInput] = useState('');
  const [studentAttempt, setStudentAttempt] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [messages, setMessages] = useState(() => activeChatCache?.messages || [INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  // Image & OCR
  const [attachedImage, setAttachedImage] = useState(null);
  const [isOcrRunning, setIsOcrRunning] = useState(false);

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Session persistence
  const [currentSessionId, setCurrentSessionId] = useState(() => activeChatCache?.currentSessionId || null);
  const currentSessionIdRef = useRef(activeChatCache?.currentSessionId || null); // always-fresh ref to avoid stale closures
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  // Keep ref in sync
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Sync active session changes to localStorage cache
  useEffect(() => {
    try {
      const activeChat = {
        currentSessionId,
        messages,
        subject,
        chapter,
        mode
      };
      localStorage.setItem('walrus_active_chat', JSON.stringify(activeChat));
    } catch (err) {
      console.error('Failed to cache active chat:', err);
    }
  }, [currentSessionId, messages, subject, chapter, mode]);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // ── Load sessions list ──────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    if (!user?.username) return;
    try {
      const res = await fetch(`${API_BASE}/student/chat-sessions?username=${encodeURIComponent(user.username)}`);
      const data = await res.json();
      if (Array.isArray(data)) setSessions(data);
    } catch { /* offline */ }
  }, [user?.username]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    if (activeTab === 'doubt-solver') {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  // ── Restore active chat session from RedVER on mount ────────────────────────
  useEffect(() => {
    const restoreActiveChatFromRedVER = async () => {
      if (!user?.username) return;
      try {
        const res = await fetch(`${API_BASE}/student/chat-sessions/active?username=${encodeURIComponent(user.username)}`);
        const session = await res.json();
        if (session) {
          console.log("⚡ Restored active chat workspace from RedVER cache!");
          currentSessionIdRef.current = session._id;
          setCurrentSessionId(session._id);
          setSubject(session.subject || SUBJECTS_LIST[0]);
          setChapter(session.chapter || 'All Chapters');
          setMode(session.mode || 'Doubt Solver');
          setMessages([
            INITIAL_MESSAGE,
            ...session.messages.map(m => ({ ...m }))
          ]);
        }
      } catch (err) {
        console.warn("Could not restore active chat from RedVER:", err.message);
      }
    };
    restoreActiveChatFromRedVER();
  }, [user?.username]);

  // ── persistSession: called directly after each AI reply ──────────────────
  const persistSession = async (msgs, sessId, subj, chap, mod) => {
    if (!user?.username) return null;
    if (msgs.filter(m => m.role === 'user').length === 0) return null;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/student/chat-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          subject: subj, chapter: chap, mode: mod,
          messages: msgs.map(m => ({ role: m.role, content: m.content })),
          sessionId: sessId || undefined
        })
      });
      const saved = await res.json();
      if (saved._id) {
        currentSessionIdRef.current = saved._id;
        setCurrentSessionId(saved._id);
        setSessions(prev => {
          const exists = prev.find(s => s._id === saved._id);
          if (exists) return prev.map(s => s._id === saved._id ? { ...s, ...saved } : s);
          return [saved, ...prev];
        });
        return saved._id;
      }
    } catch (err) {
      console.error('Chat session save failed:', err);
    } finally {
      setIsSaving(false);
    }
    return null;
  };

  const isInitialRender = useRef(true);

  // ── Chapter sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const chapters = getChaptersForSubject(subject, progressData);
    setChapter(chapters[0] || 'All Chapters');
  }, [subject]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const viewport = chatEndRef.current?.closest('.chat-messages-viewport');
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY < 50) {
      setShowHeader(true);
      if (onScrollDirectionChange) onScrollDirectionChange(false);
      lastScrollY.current = currentScrollY;
      return;
    }
    const diff = currentScrollY - lastScrollY.current;
    if (Math.abs(diff) < 20) return;
    if (diff > 0) {
      setShowHeader(false);
      if (onScrollDirectionChange) onScrollDirectionChange(true);
    } else {
      setShowHeader(true);
      if (onScrollDirectionChange) onScrollDirectionChange(false);
    }
    lastScrollY.current = currentScrollY;
  };

  // ── Start a brand-new session ───────────────────────────────────────────────
  const startNewSession = () => {
    currentSessionIdRef.current = null;
    setCurrentSessionId(null);
    setMessages([INITIAL_MESSAGE]);
    setStudentInput('');
    setStudentAttempt('');
    setAttachedImage(null);
    setShowHistory(false);
    setShowHeader(true);

    if (user?.username) {
      fetch(`${API_BASE}/student/chat-sessions/active/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      }).catch(err => console.warn('Failed to clear active session cache in RedVER:', err));
    }
  };

  // ── Load a past session ─────────────────────────────────────────────────────
  const loadSession = (session) => {
    currentSessionIdRef.current = session._id;
    setCurrentSessionId(session._id);
    setSubject(session.subject || SUBJECTS_LIST[0]);
    setChapter(session.chapter || 'All Chapters');
    setMode(session.mode || 'Doubt Solver');
    setMessages([
      INITIAL_MESSAGE,
      ...session.messages.map(m => ({ ...m }))
    ]);
    setShowHistory(false);
    setShowHeader(true);

    if (user?.username) {
      fetch(`${API_BASE}/student/chat-sessions/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          session
        })
      }).catch(err => console.warn('Failed to update active session cache in RedVER:', err));
    }
  };

  // ── Delete a session ────────────────────────────────────────────────────────
  const deleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/student/chat-sessions/${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s._id !== id));
      if (currentSessionId === id) startNewSession();
    } catch { /* offline */ }
  };

  // ── OCR image processing ────────────────────────────────────────────────────
  const processImageFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setAttachedImage(e.target.result);
    reader.readAsDataURL(file);
    setIsOcrRunning(true);
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      const text = ret.data.text.trim();
      await worker.terminate();
      if (text) setStudentInput(prev => prev ? prev + '\n' + text : text);
      else alert('OCR did not detect readable text. Please check the image quality.');
    } catch (err) {
      alert('Failed to extract text from image: ' + err.message);
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleImageUpload = e => { processImageFile(e.target.files[0]); e.target.value = ''; };
  const handleRemoveImage = () => { setAttachedImage(null); setIsOcrRunning(false); };
  const handlePaste = e => {
    for (const item of (e.clipboardData?.items || [])) {
      if (item.type.startsWith('image/')) {
        processImageFile(item.getAsFile());
        e.preventDefault();
      }
    }
  };

  // ── Voice recording ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' };
      else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data?.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => await handleTranscribe(reader.result);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch { alert('Could not access microphone. Please check permissions.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async (base64Audio) => {
    setIsTranscribing(true);
    try {
      const res = await fetch(`${API_BASE}/ai/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio })
      });
      const data = await res.json();
      if (data.text) setStudentInput(prev => (prev ? prev + ' ' : '') + data.text);
      else if (data.error) throw new Error(data.error);
    } catch (err) {
      alert('Voice transcription failed: ' + err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!studentInput.trim() || isLoading || isOcrRunning) return;

    const currentInput = studentInput;
    const currentAttempt = studentAttempt;
    // Capture context at send-time (avoids stale closure from dropdowns)
    const snapSubject = subject;
    const snapChapter = chapter;
    const snapMode = mode;

    const userMsg = { role: 'user', content: currentInput, timestamp: new Date().toISOString() };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setStudentInput('');
    setStudentAttempt('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const chatHistory = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));

      const res = await fetch(`${API_BASE}/ai/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: snapSubject, chapter: snapChapter, mode: snapMode, studentInput: currentInput, studentAttempt: currentAttempt, chatHistory })
      });

      const data = await res.json();
      const aiMsg = { role: 'ai', content: data.response, timestamp: new Date().toISOString() };
      const finalMessages = [...withUser, aiMsg];
      setMessages(finalMessages);

      // Save immediately after AI reply — use ref for always-fresh sessionId
      await persistSession(finalMessages, currentSessionIdRef.current, snapSubject, snapChapter, snapMode);

      if (onActivityTriggered) onActivityTriggered(5);
    } catch (err) {
      console.error('Send message error:', err);
      const errMsg = { role: 'ai', content: 'Sorry, I failed to connect to the tutor service. Please check if your server is running.', timestamp: new Date().toISOString() };
      const finalMessages = [...withUser, errMsg];
      setMessages(finalMessages);
      // Still try to save even on error
      await persistSession(finalMessages, currentSessionIdRef.current, snapSubject, snapChapter, snapMode);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSessionDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Today ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', minHeight: 0, position: 'relative', backgroundColor: 'var(--bg-app)' }}>

      {/* ── History Sidebar ─────────────────────────────────────────────────── */}
      <div style={{
        width: showHistory ? '280px' : '0px',
        minWidth: showHistory ? '280px' : '0px',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        borderRight: showHistory ? '1px solid var(--border-color)' : 'none',
        backgroundColor: 'var(--bg-card)',
        display: 'flex', flexDirection: 'column'
      }}>
        {showHistory && (
          <>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} /> Past Sessions
              </h3>
              <button onClick={() => setShowHistory(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <ChevronLeft size={20} />
              </button>
            </div>

            <button onClick={startNewSession}
              style={{ margin: '0.75rem', padding: '0.6rem', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> New Session
            </button>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.5rem 0.5rem' }}>
              {sessions.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No saved sessions yet</p>
              )}
              {sessions.map(s => (
                <div key={s._id}
                  onClick={() => loadSession(s)}
                  style={{
                    padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1px solid ${currentSessionId === s._id ? 'var(--primary)' : 'transparent'}`,
                    backgroundColor: currentSessionId === s._id ? 'var(--primary-light)' : 'transparent',
                    transition: 'all 0.15s', position: 'relative'
                  }}
                  onMouseEnter={e => { if (currentSessionId !== s._id) e.currentTarget.style.backgroundColor = 'var(--bg-app)'; }}
                  onMouseLeave={e => { if (currentSessionId !== s._id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.3rem' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {s.title || `${s.subject} Session`}
                    </p>
                    <button onClick={e => deleteSession(s._id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0, padding: '2px', opacity: 0.7 }}
                      title="Delete session">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '50px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>{s.subject}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={10} /> {formatSessionDate(s.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Main Chat Area ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', position: 'relative' }}>

        {/* Header */}
        <header style={{ 
          padding: showHeader ? '1rem 1.5rem' : '0 1.5rem', 
          maxHeight: showHeader ? (showFilters ? '550px' : '220px') : '0px',
          opacity: showHeader ? 1 : 0,
          borderBottom: showHeader ? '1px solid var(--border-color)' : 'none', 
          backgroundColor: 'var(--bg-card)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: showHeader ? '0.75rem' : '0px', 
          flexShrink: 0, 
          zIndex: 5,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}>
          <div className="doubt-solver-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
              <GraduationCap size={24} /> AI CBSE Tutor &amp; Doubt Solver
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {isSaving && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><RefreshCw size={10} className="animate-spin" /> Saving…</span>}
              <button 
                onClick={() => setShowFilters(f => !f)} 
                className={`btn-secondary doubt-solver-settings-toggle-btn ${showFilters ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderColor: showFilters ? 'var(--primary)' : 'var(--border-color)', color: showFilters ? 'var(--primary)' : 'var(--text-primary)' }}
              >
                <SlidersHorizontal size={14} /> Settings
              </button>
              {user && (
                <button onClick={() => { setShowHistory(h => !h); if (!showHistory) fetchSessions(); }}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderColor: showHistory ? 'var(--primary)' : 'var(--border-color)', color: showHistory ? 'var(--primary)' : 'var(--text-primary)' }}>
                  <History size={15} /> History
                  {sessions.length > 0 && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50px', fontSize: '0.68rem', padding: '0 0.35rem', fontWeight: 700 }}>{sessions.length}</span>}
                </button>
              )}
              <button onClick={startNewSession} className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}>
                <Plus size={14} /> New Chat
              </button>
            </div>
          </div>

          {!showFilters && (
            <div className="doubt-solver-badges-row animate-fade-in" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '-0.1rem' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.65rem', fontWeight: 600 }}>{subject}</span>
              <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '0.2rem 0.65rem', fontWeight: 600 }}>{chapter}</span>
              <span className="badge badge-warning" style={{ fontSize: '0.72rem', padding: '0.2rem 0.65rem', fontWeight: 600 }}>{mode}</span>
            </div>
          )}

          <div className={`doubt-solver-grid ${showFilters ? 'show' : ''}`}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Subject</label>
              <select className="input-control" style={{ padding: '0.45rem 0.7rem', fontSize: '0.88rem', height: '2.1rem', backgroundColor: 'var(--bg-app)' }}
                value={subject} onChange={e => setSubject(e.target.value)}>
                {SUBJECTS_LIST.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>NCERT Chapter</label>
              <select className="input-control" style={{ padding: '0.45rem 0.7rem', fontSize: '0.88rem', height: '2.1rem', backgroundColor: 'var(--bg-app)' }}
                value={chapter} onChange={e => setChapter(e.target.value)}>
                {getChaptersForSubject(subject, progressData).map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Tutor Mode</label>
              <select className="input-control" style={{ padding: '0.45rem 0.7rem', fontSize: '0.88rem', height: '2.1rem', backgroundColor: 'var(--bg-app)' }}
                value={mode} onChange={e => setMode(e.target.value)}>
                <option value="Doubt Solver">Doubt Solver (Step-by-step)</option>
                <option value="Socratic">Socratic Mode (Hints Only)</option>
                <option value="Why am I wrong">"Why am I wrong?" Mode</option>
              </select>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="chat-messages-viewport" onScroll={handleScroll} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '2rem 1.5rem 150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {msg.role === 'ai' ? '🎓 CBSE Tutor Core' : (user?.username || 'Student')}
                  {msg.timestamp && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                <div className="markdown-body" style={msg.role === 'user' ? {
                  width: '100%', padding: '1.1rem 1.4rem',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  borderBottomRightRadius: '2px',
                  boxShadow: 'var(--shadow-sm)', lineHeight: '1.6'
                } : {
                  width: '100%', padding: '0.5rem 0',
                  backgroundColor: 'transparent',
                  color: 'var(--ai-text-primary)',
                  border: 'none',
                  boxShadow: 'none', lineHeight: '1.6'
                }}>
                  <MarkdownRenderer content={msg.content} isAi={msg.role === 'ai'} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>🎓 CBSE Tutor Core</div>
                <div style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Thinking based on NCERT syllabus guidelines…</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input area */}
        <footer style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '0.5rem 1.5rem 1.5rem', 
          backgroundColor: 'transparent', 
          borderTop: 'none', 
          zIndex: 10,
          pointerEvents: 'none' 
        }}>
          <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto', pointerEvents: 'auto' }}>
            {(attachedImage || isOcrRunning) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.65rem 1rem', marginBottom: '0.65rem' }}>
                {attachedImage && (
                  <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                    <img src={attachedImage} alt="Attached" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={handleRemoveImage}
                      style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', cursor: 'pointer' }}>
                      <X size={9} />
                    </button>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.83rem', fontWeight: 600 }}>{isOcrRunning ? 'Scanning question text…' : 'Question image attached'}</span>
                  <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{isOcrRunning ? 'Running OCR extraction…' : 'Text extracted! Ready to send.'}</p>
                </div>
                {isOcrRunning && <RefreshCw className="animate-spin" size={16} style={{ color: 'var(--primary)' }} />}
              </div>
            )}

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />

            <form onSubmit={handleSendMessage} onPaste={handlePaste}
              style={{ 
                borderRadius: mode === 'Why am I wrong' ? '24px' : '9999px', 
                boxShadow: 'var(--shadow-md)', 
                border: '1px solid var(--border-color)', 
                backgroundColor: 'var(--bg-card)', 
                padding: '0.35rem 0.5rem 0.35rem 0.75rem', 
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'center' 
              }}>

              <button type="button"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  transition: 'background-color 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => fileInputRef.current.click()} title="Upload question image">
                <Plus size={20} />
              </button>

              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '0.25rem' }}>
                <input type="text" className="input-control"
                  style={{ width: '100%', padding: '0.5rem 0.25rem', fontSize: '0.93rem', border: 'none', backgroundColor: 'transparent', boxShadow: 'none' }}
                  onPaste={handlePaste}
                  placeholder={isRecording ? '🔴 Recording… click mic to stop.' : isTranscribing ? '✍️ Transcribing…' : mode === 'Why am I wrong' ? 'Paste the question here…' : 'Type your doubt or question…'}
                  value={studentInput}
                  onChange={e => setStudentInput(e.target.value)}
                  disabled={isLoading || isRecording || isTranscribing}
                />
                {mode === 'Why am I wrong' && (
                  <input type="text" className="input-control"
                    style={{ width: '100%', padding: '0.4rem 0.25rem', fontSize: '0.82rem', border: 'none', borderTop: '1px solid var(--border-color)', backgroundColor: 'transparent', boxShadow: 'none' }}
                    placeholder="Optionally paste your attempted answer to analyze mistakes…"
                    value={studentAttempt}
                    onChange={e => setStudentAttempt(e.target.value)}
                    disabled={isLoading}
                  />
                )}
              </div>

              <button type="button"
                className={`mic-btn ${isRecording ? 'recording' : ''}`}
                style={{ 
                  background: isRecording ? 'var(--danger-light)' : 'none', 
                  border: 'none', 
                  color: isRecording ? 'var(--danger)' : 'var(--text-secondary)', 
                  cursor: 'pointer',
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  transition: 'background-color 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isRecording ? 'var(--danger-light)' : 'var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = isRecording ? 'var(--danger-light)' : 'transparent'}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isTranscribing}
                title={isRecording ? 'Stop recording' : 'Speak your doubt'}>
                {isTranscribing ? <RefreshCw className="animate-spin" size={15} /> : isRecording ? <MicOff size={17} /> : <Mic size={17} />}
              </button>

              <button type="submit" className="btn-primary"
                style={{ 
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  padding: 0 
                }}
                disabled={isLoading || !studentInput.trim()}>
                <Send size={14} />
              </button>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
}
