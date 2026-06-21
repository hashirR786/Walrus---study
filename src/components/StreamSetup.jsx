import React, { useState } from 'react';
import { Sparkles, BookOpen, FlaskConical, Calculator, Leaf, TrendingUp, MonitorDot, ArrowRight, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';

const STREAMS = [
  {
    id: 'pcmb',
    label: 'Science — PCMB',
    emoji: '🧪',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    description: 'Physics • Chemistry • Math • Biology',
    color: '#5f7560',
    lightBg: 'rgba(95, 117, 96, 0.08)',
  },
  {
    id: 'pcmc',
    label: 'Science — PCMC',
    emoji: '💻',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science'],
    description: 'Physics • Chemistry • Math • CS',
    color: '#4f46e5',
    lightBg: 'rgba(79, 70, 229, 0.08)',
  },
  {
    id: 'pcb',
    label: 'Science — PCB',
    emoji: '🧬',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    description: 'Physics • Chemistry • Biology',
    color: '#d99f59',
    lightBg: 'rgba(217, 159, 89, 0.08)',
  },
  {
    id: 'commerce',
    label: 'Commerce / Eco-Math',
    emoji: '📈',
    subjects: ['Economics', 'Mathematics'],
    description: 'Economics • Mathematics',
    color: '#b05a5a',
    lightBg: 'rgba(176, 90, 90, 0.08)',
  },
  {
    id: 'general',
    label: 'General — All Subjects',
    emoji: '📚',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Computer Science'],
    description: 'All 6 CBSE XII subjects',
    color: '#8c826b',
    lightBg: 'rgba(140, 130, 107, 0.08)',
  },
];

export default function StreamSetup({ user, token, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ stream: selected }),
      });
      if (res.ok) {
        const updated = await res.json();
        onComplete({ ...user, ...updated, stream: selected });
      }
    } catch (err) {
      // If offline, still allow proceeding
      onComplete({ ...user, stream: selected });
    } finally {
      setSaving(false);
    }
  };

  const selectedStream = STREAMS.find(s => s.id === selected);

  return (
    <div className="stream-setup-overlay" data-theme="dark">
      <div className="stream-setup-card">

        {/* Header */}
        <div className="stream-setup-header">
          <div className="stream-setup-icon-ring">
            <Sparkles size={26} />
          </div>
          <h1 className="stream-setup-title">Welcome to Walrus, {user?.username}!</h1>
          <p className="stream-setup-subtitle">
            Choose your <strong>study stream</strong> so we can personalise your syllabus,
            practice engine, and analytics just for you.
          </p>
        </div>

        {/* Stream Cards Grid */}
        <div className="stream-setup-grid">
          {STREAMS.map(stream => {
            const isActive = selected === stream.id;
            return (
              <button
                key={stream.id}
                className={`stream-option-card ${isActive ? 'active' : ''}`}
                style={{
                  '--stream-color': stream.color,
                  '--stream-bg': stream.lightBg,
                  borderColor: isActive ? stream.color : 'rgba(255,255,255,0.07)',
                  backgroundColor: isActive ? stream.lightBg : 'rgba(255,255,255,0.03)',
                }}
                onClick={() => setSelected(stream.id)}
              >
                <span className="stream-option-emoji">{stream.emoji}</span>
                <div>
                  <div className="stream-option-label">{stream.label}</div>
                  <div className="stream-option-subjects">{stream.description}</div>
                </div>
                {isActive && (
                  <CheckCircle2
                    size={18}
                    className="stream-check-icon"
                    style={{ color: stream.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Info Banner */}
        {selectedStream && (
          <div
            className="stream-selected-banner"
            style={{
              backgroundColor: `rgba(${selectedStream.color === '#5f7560' ? '95,117,96' : selectedStream.color === '#4f46e5' ? '79,70,229' : selectedStream.color === '#d99f59' ? '217,159,89' : selectedStream.color === '#b05a5a' ? '176,90,90' : '140,130,107'}, 0.1)`,
              borderColor: `${selectedStream.color}33`,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{selectedStream.emoji}</span>
            <span style={{ fontSize: '0.88rem', color: '#eae6db' }}>
              You'll study: <strong style={{ color: selectedStream.color }}>{selectedStream.description}</strong>
            </span>
          </div>
        )}

        {/* CTA Button */}
        <button
          className="stream-setup-cta"
          onClick={handleSave}
          disabled={!selected || saving}
          style={{
            opacity: selected ? 1 : 0.45,
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? (
            <span>Saving…</span>
          ) : (
            <>
              <span>Continue to Dashboard</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <p className="stream-setup-hint">
          You can change this any time from your <strong>Profile Preferences</strong>.
        </p>
      </div>
    </div>
  );
}
