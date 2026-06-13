import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Link as LinkIcon, ThumbsUp, Send, Library, Trash2, X, AlertTriangle, Download, ZoomIn } from 'lucide-react';
import { API_BASE } from '../config';

// Inline confirmation dialog component (replaces window.confirm)
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)', padding: '1.5rem', maxWidth: '380px', width: '90%',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 'var(--radius-sm)', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Community({ progressData, user }) {
  const [activeTab, setActiveTab] = useState('forum');

  // Forum states
  const [threads, setThreads] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadSubject, setNewThreadSubject] = useState('Physics');
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  // Shared Notes states
  const [sharedNotes, setSharedNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('Physics');
  const [newNoteDescription, setNewNoteDescription] = useState('');
  const [newNoteLink, setNewNoteLink] = useState('');
  const [newNoteImage, setNewNoteImage] = useState('');

  // Study Room
  const [roomTimer, setRoomTimer] = useState(1500);
  const [timerRunning, setTimerRunning] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Inline confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  // Lightbox
  const [lightboxImage, setLightboxImage] = useState(null); // { src, title }

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics'];
  const statuses = ['Studying', 'Solving PYQs', 'Reading Cheatsheet', 'Reviewing Syllabus', 'Revising notes'];

  // Helper: show inline confirmation instead of window.confirm
  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };
  const dismissConfirm = () => setConfirmDialog(null);

  // Sync Timer
  useEffect(() => {
    let interval;
    if (timerRunning && roomTimer > 0) {
      interval = setInterval(() => setRoomTimer(p => p - 1), 1000);
    } else if (roomTimer === 0) {
      setRoomTimer(1500);
    }
    return () => clearInterval(interval);
  }, [timerRunning, roomTimer]);

  // Load data on tab switch
  useEffect(() => {
    if (activeTab === 'forum') fetchThreads();
    else if (activeTab === 'notes') fetchNotes();
    else if (activeTab === 'study-room') {
      fetchOnlineUsers();
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // ── Doubt Forum ──────────────────────────────────────────────────────────────
  const fetchThreads = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/forum`);
      setThreads(await res.json());
    } catch { /* offline */ }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/student/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newThreadTitle,
          content: newThreadContent,
          subject: newThreadSubject,
          askedBy: user?.username || 'Student'
        })
      });
      const t = await res.json();
      setThreads(prev => [t, ...prev]);
      setNewThreadTitle('');
      setNewThreadContent('');
    } catch { alert('Failed to post question.'); }
  };

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedThread) return;
    try {
      const res = await fetch(`${API_BASE}/student/forum/${selectedThread._id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answeredBy: user?.username || 'Student', content: replyContent, isAI: false })
      });
      const updated = await res.json();
      setThreads(prev => prev.map(t => t._id === updated._id ? updated : t));
      setSelectedThread(updated);
      setReplyContent('');
    } catch { alert('Could not post answer.'); }
  };

  const handleUpvoteAnswer = async (answerId) => {
    if (!selectedThread) return;
    try {
      const res = await fetch(`${API_BASE}/student/forum/${selectedThread._id}/answer/${answerId}/upvote`, { method: 'POST' });
      const updated = await res.json();
      setThreads(prev => prev.map(t => t._id === updated._id ? updated : t));
      setSelectedThread(updated);
    } catch { console.error('Upvote failed'); }
  };

  const doDeleteThread = async (id) => {
    dismissConfirm();
    try {
      const res = await fetch(`${API_BASE}/student/forum/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setThreads(prev => prev.filter(t => t._id !== id));
        if (selectedThread?._id === id) setSelectedThread(null);
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.error || 'Server error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error during deletion.');
    }
  };

  const handleDeleteThread = (id, e) => {
    if (e) e.stopPropagation();
    showConfirm('Delete this doubt question? This cannot be undone.', () => doDeleteThread(id));
  };

  // ── Notes Sharing ────────────────────────────────────────────────────────────
  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/notes`);
      setSharedNotes(await res.json());
    } catch { /* offline */ }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select a valid image file.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setNewNoteImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleShareNote = async (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) { alert('Please provide a title.'); return; }
    try {
      const res = await fetch(`${API_BASE}/student/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNoteTitle, subject: newNoteSubject,
          description: newNoteDescription, link: newNoteLink,
          image: newNoteImage, author: user?.username || 'Student'
        })
      });
      if (res.ok) {
        const note = await res.json();
        setSharedNotes(prev => [note, ...prev]);
        setNewNoteTitle(''); setNewNoteDescription(''); setNewNoteLink(''); setNewNoteImage('');
        const fi = document.getElementById('note-file-input');
        if (fi) fi.value = '';
      } else alert('Failed to share note.');
    } catch { alert('Error sharing note.'); }
  };

  const doDeleteNote = async (id) => {
    dismissConfirm();
    try {
      const res = await fetch(`${API_BASE}/student/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSharedNotes(prev => prev.filter(n => n._id !== id));
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.error || 'Server error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error during deletion.');
    }
  };

  const handleDeleteNote = (id) => {
    showConfirm('Delete this shared note? This cannot be undone.', () => doDeleteNote(id));
  };

  // ── Study Room ───────────────────────────────────────────────────────────────
  const fetchOnlineUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/studyroom/users`);
      setOnlineUsers(await res.json());
    } catch { /* offline */ }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/studyroom/messages`);
      setMessages(await res.json());
    } catch { /* offline */ }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/student/studyroom/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: user?.username || 'Student', text: newMessageText })
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessageText('');
      }
    } catch { /* offline */ }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '950px', margin: '0 auto' }}>
      {/* Inline Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={dismissConfirm}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={28} /> Community & Collaboration Hub
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['forum', 'notes', 'study-room'].map(tab => (
            <button key={tab}
              className="btn-secondary"
              onClick={() => setActiveTab(tab)}
              style={{
                borderColor: activeTab === tab ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: activeTab === tab ? 'var(--primary-light)' : 'var(--bg-card)',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-primary)'
              }}
            >
              {tab === 'forum' ? 'Doubt Forum' : tab === 'notes' ? 'Share Notes' : 'Study Room'}
            </button>
          ))}
        </div>
      </div>

      {/* ── DOUBT FORUM ── */}
      {activeTab === 'forum' && (
        <div className="community-threads-grid" style={{ display: 'grid', gridTemplateColumns: selectedThread ? '1fr 1.2fr' : '1fr', gap: '1.5rem' }}>
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Ask the Community</h3>
              <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input type="text" className="input-control" placeholder="Brief question headline..." required
                  value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} />
                <textarea className="input-control" rows={3} placeholder="Describe your doubt in detail..." required
                  value={newThreadContent} onChange={e => setNewThreadContent(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <select className="input-control" style={{ padding: '0.4rem' }} value={newThreadSubject} onChange={e => setNewThreadSubject(e.target.value)}>
                    {['Physics','Chemistry','Mathematics','Biology','Economics'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Ask Doubt</button>
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {threads.map(t => (
                <div key={t._id}
                  className="card"
                  style={{ cursor: 'pointer', borderColor: selectedThread?._id === t._id ? 'var(--primary)' : 'var(--border-color)', backgroundColor: selectedThread?._id === t._id ? 'var(--primary-light)' : 'var(--bg-card)' }}
                  onClick={() => setSelectedThread(t)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className="badge badge-primary">{t.subject}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Asked by {t.askedBy}</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{t.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{t.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <MessageSquare size={14} /><span>{t.answers?.length || 0} solutions</span>
                    </div>
                    {t.askedBy === user?.username && (
                      <button onClick={e => handleDeleteThread(t._id, e)}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                        title="Delete Question">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {threads.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>No questions yet. Be the first to ask!</p>
              )}
            </div>
          </div>

          {selectedThread && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary">{selectedThread.subject}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => setSelectedThread(null)}
                      style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                      <X size={16} />
                    </button>
                    {selectedThread.askedBy === user?.username && (
                      <button onClick={e => handleDeleteThread(selectedThread._id, e)}
                        style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedThread.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{selectedThread.content}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>Posted by {selectedThread.askedBy}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                {selectedThread.answers?.length > 0 ? selectedThread.answers.map(ans => (
                  <div key={ans._id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', backgroundColor: ans.isAI ? 'var(--primary-light)' : 'var(--bg-app)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                      <span style={{ color: ans.isAI ? 'var(--primary)' : 'var(--text-primary)' }}>{ans.isAI ? '🤖 AI Tutor' : ans.answeredBy}</span>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => handleUpvoteAnswer(ans._id)}>
                        <ThumbsUp size={12} /> {ans.upvotes || 0}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', margin: 0 }}>{ans.content}</p>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No solutions yet. Be the first to help!</p>
                )}
              </div>

              <form onSubmit={handlePostAnswer} style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" className="input-control" placeholder="Write your solution..." style={{ flex: 1 }}
                  value={replyContent} onChange={e => setReplyContent(e.target.value)} />
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }}><Send size={18} /></button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── NOTES SHARING ── */}
      {activeTab === 'notes' && (
        <div className="community-notes-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.5rem' }}>
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Share a Note</h3>
            <form onSubmit={handleShareNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {[
                { label: 'Note Title *', el: <input type="text" className="input-control" placeholder="e.g. Wave Optics Notes" required value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} /> },
                { label: 'Subject *', el: (
                  <select className="input-control" value={newNoteSubject} onChange={e => setNewNoteSubject(e.target.value)}>
                    {['Physics','Chemistry','Mathematics','Biology','Economics'].map(s => <option key={s}>{s}</option>)}
                  </select>
                )},
                { label: 'Description', el: <textarea className="input-control" rows={2} placeholder="What do these notes cover?" value={newNoteDescription} onChange={e => setNewNoteDescription(e.target.value)} /> },
                { label: 'Attach Link', el: <input type="url" className="input-control" placeholder="https://drive.google.com/..." value={newNoteLink} onChange={e => setNewNoteLink(e.target.value)} /> },
              ].map(({ label, el }) => (
                <div key={label}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block', color: 'var(--text-secondary)' }}>{label}</label>
                  {el}
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', display: 'block', color: 'var(--text-secondary)' }}>Upload Image / Diagram</label>
                <input id="note-file-input" type="file" accept="image/*" className="input-control" style={{ padding: '0.3rem' }} onChange={handleImageChange} />
                {newNoteImage && (
                  <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                    <img src={newNoteImage} alt="Preview" style={{ width: '100%', maxHeight: '110px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    <button type="button" onClick={() => { setNewNoteImage(''); document.getElementById('note-file-input').value = ''; }}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Share Note</button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Shared Notes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '480px', overflowY: 'auto' }}>
              {sharedNotes.length > 0 ? sharedNotes.map(note => (
                <div key={note._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-primary" style={{ marginBottom: '0.25rem' }}>{note.subject}</span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{note.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shared by {note.author}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {note.link && (
                        <a href={note.link} target="_blank" rel="noopener noreferrer" className="btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                          <LinkIcon size={14} /> View
                        </a>
                      )}
                      {note.author === user?.username && (
                        <button onClick={() => handleDeleteNote(note._id)}
                          style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                          title="Delete Note">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {note.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{note.description}</p>}
                  {note.image && (
                    <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                      <img
                        src={note.image}
                        alt={note.title}
                        onClick={() => setLightboxImage({ src: note.image, title: note.title })}
                        style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', backgroundColor: 'rgba(0,0,0,0.03)', cursor: 'zoom-in', display: 'block' }}
                      />
                      {/* Hover overlay hint */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}>
                        <button
                          onClick={() => setLightboxImage({ src: note.image, title: note.title })}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                        >
                          <ZoomIn size={12} /> Enlarge
                        </button>
                        <a
                          href={note.image}
                          download={`${note.title || 'note'}.png`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', textDecoration: 'none', backdropFilter: 'blur(4px)' }}
                        >
                          <Download size={12} /> Download
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', padding: '2rem 0' }}>No notes shared yet. Upload yours above!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STUDY ROOM ── */}
      {activeTab === 'study-room' && (
        <div className="community-room-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: 'fit-content' }}>
            <Library size={36} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
            <h3>Virtual Study Room</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Synchronized Pomodoro timer with peers!</p>
            <div className="pomodoro-dial active" style={{ width: '150px', height: '150px', fontSize: '2rem' }}>{formatTimer(roomTimer)}</div>
            <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => setTimerRunning(p => !p)}>
              {timerRunning ? 'Pause Session' : 'Resume Session'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }} />
                Active Peers ({onlineUsers.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto' }}>
                {onlineUsers.length > 0 ? onlineUsers.map((peer, idx) => {
                  const isMe = peer.username === user?.username;
                  return (
                    <div key={peer._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: isMe ? 'var(--primary-light)' : 'var(--bg-app)' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{peer.username}{isMe ? ' (You)' : ''}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Focus: {subjects[idx % subjects.length]}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--success)' }}>{statuses[idx % statuses.length]}</span>
                      </div>
                    </div>
                  );
                }) : <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No peers online yet</p>}
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <MessageSquare size={18} /> Shared Messages
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                {messages.length > 0 ? messages.map((msg, i) => {
                  const isMe = msg.sender === user?.username;
                  return (
                    <div key={msg._id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '0.55rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: isMe ? 'var(--primary-light)' : 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                        <span>{isMe ? 'You' : msg.sender}</span>
                        <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', wordBreak: 'break-word' }}>{msg.text}</p>
                    </div>
                  );
                }) : <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', padding: '1.5rem 0' }}>No messages yet. Start the conversation!</p>}
              </div>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" className="input-control" placeholder="Share a message or ask a quick doubt..."
                  style={{ flex: 1 }} value={newMessageText} onChange={e => setNewMessageText(e.target.value)} />
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}><Send size={16} /></button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* ── LIGHTBOX MODAL ── */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.88)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem', backdropFilter: 'blur(6px)'
          }}
        >
          {/* Toolbar */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '900px', marginBottom: '0.75rem' }}
          >
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', opacity: 0.9 }}>{lightboxImage.title}</span>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <a
                href={lightboxImage.src}
                download={`${lightboxImage.title || 'note'}.png`}
                onClick={e => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                <Download size={14} /> Download
              </a>
              <button
                onClick={() => setLightboxImage(null)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {/* Image */}
          <img
            src={lightboxImage.src}
            alt={lightboxImage.title}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: 'calc(100vh - 120px)',
              objectFit: 'contain', borderRadius: '10px',
              boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
              userSelect: 'none'
            }}
          />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.75rem' }}>Click anywhere outside to close</p>
        </div>
      )}
    </div>
  );
}
