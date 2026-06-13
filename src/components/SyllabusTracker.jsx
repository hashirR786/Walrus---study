import React, { useState } from 'react';
import { CheckSquare, Square, RefreshCw } from 'lucide-react';

export default function SyllabusTracker({ progressData, onUpdateChapter, isLoading }) {
  const [selectedSubject, setSelectedSubject] = useState('Physics');

  const subject = progressData?.subjectProgress?.find(s => s.subjectName === selectedSubject) || { chapters: [] };
  const chapters = subject.chapters;

  // Calculate completion percentages
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => c.status === 'Completed').length;
  const inProgressChapters = chapters.filter(c => c.status === 'InProgress').length;
  
  const completionPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  const inProgressPercentage = totalChapters > 0 ? Math.round((inProgressChapters / totalChapters) * 100) : 0;

  const handleStatusChange = async (chapterName, currentStatus) => {
    let nextStatus = 'Todo';
    if (currentStatus === 'Todo') nextStatus = 'InProgress';
    else if (currentStatus === 'InProgress') nextStatus = 'Completed';
    
    await onUpdateChapter(selectedSubject, chapterName, nextStatus);
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CheckSquare size={28} /> CBSE Syllabus Checklist Tracker
      </h2>

      {/* Subject Toggles */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {(progressData?.subjectProgress || []).map((sub) => (
          <button
            key={sub.subjectName}
            className={`btn-secondary ${selectedSubject === sub.subjectName ? 'active' : ''}`}
            style={{ 
              borderColor: selectedSubject === sub.subjectName ? 'var(--primary)' : 'var(--border-color)',
              backgroundColor: selectedSubject === sub.subjectName ? 'var(--primary-light)' : 'var(--bg-card)',
              color: selectedSubject === sub.subjectName ? 'var(--primary)' : 'var(--text-primary)'
            }}
            onClick={() => setSelectedSubject(sub.subjectName)}
          >
            {sub.subjectName}
          </button>
        ))}
      </div>

      {/* Progress Cards */}
      <div className="dashboard-grid syllabus-main-grid" style={{ gridTemplateColumns: '1fr 2fr', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Completion</h4>
          <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)' }}>{completionPercentage}%</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{completedChapters} of {totalChapters} chapters completed</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Subject Status Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Completed ({completedChapters})</span>
                <span>{completionPercentage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${completionPercentage}%`, height: '100%', backgroundColor: 'var(--success)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>In Progress ({inProgressChapters})</span>
                <span>{inProgressPercentage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${inProgressPercentage}%`, height: '100%', backgroundColor: 'var(--warning)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Checklist */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3>Chapters in {selectedSubject}</h3>
          {isLoading && <RefreshCw size={16} className="animate-spin text-muted" />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {chapters.map((ch) => {
            let statusColor = 'var(--text-muted)';
            let statusLabel = 'Todo';
            let StatusIcon = Square;

            if (ch.status === 'InProgress') {
              statusColor = 'var(--warning)';
              statusLabel = 'In Progress';
            } else if (ch.status === 'Completed') {
              statusColor = 'var(--success)';
              statusLabel = 'Completed';
              StatusIcon = CheckSquare;
            }

            return (
              <div 
                key={ch.chapterName}
                className="nav-item"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  cursor: 'pointer'
                }}
                onClick={() => handleStatusChange(ch.chapterName, ch.status)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <StatusIcon size={20} style={{ color: statusColor }} />
                  <span style={{ fontWeight: ch.status === 'Completed' ? 500 : 400 }}>{ch.chapterName}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {ch.masteryScore > 0 && (
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                      Mastery: {ch.masteryScore}%
                    </span>
                  )}
                  <span 
                    className="badge" 
                    style={{ 
                      backgroundColor: ch.status === 'Completed' ? 'var(--success-light)' : ch.status === 'InProgress' ? 'var(--warning-light)' : 'var(--bg-card-hover)',
                      color: statusColor
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
