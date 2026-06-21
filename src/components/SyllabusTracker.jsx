import React, { useState } from 'react';
import { 
  CheckSquare, Square, RefreshCw, Atom, FlaskConical, Calculator, Dna, 
  TrendingUp, Terminal, BookOpen, CheckCircle2, Circle, Clock, Award, Check
} from 'lucide-react';

const subjectMeta = {
  Physics: { color: '#6366f1', lightColor: 'rgba(99, 102, 241, 0.1)', icon: Atom },
  Chemistry: { color: '#10b981', lightColor: 'rgba(16, 185, 129, 0.1)', icon: FlaskConical },
  Mathematics: { color: '#f59e0b', lightColor: 'rgba(245, 158, 11, 0.1)', icon: Calculator },
  Biology: { color: '#22c55e', lightColor: 'rgba(34, 197, 94, 0.1)', icon: Dna },
  Economics: { color: '#3b82f6', lightColor: 'rgba(59, 130, 246, 0.1)', icon: TrendingUp },
  'Computer Science': { color: '#f97316', lightColor: 'rgba(249, 115, 22, 0.1)', icon: Terminal }
};

const getSubjectMeta = (subjectName) => {
  return subjectMeta[subjectName] || { color: 'var(--primary)', lightColor: 'var(--primary-light)', icon: BookOpen };
};

export default function SyllabusTracker({ progressData, onUpdateChapter, isLoading }) {
  const subjectProgressList = progressData?.subjectProgress || [];
  
  // Set default subject dynamically to first available or Physics
  const initialSubject = subjectProgressList.length > 0 ? subjectProgressList[0].subjectName : 'Physics';
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);

  // Safeguard selectedSubject in case it was set to something that got deleted or not found
  const activeSubjectName = selectedSubject && subjectProgressList.some(s => s.subjectName === selectedSubject)
    ? selectedSubject
    : (subjectProgressList[0]?.subjectName || 'Physics');

  const subject = subjectProgressList.find(s => s.subjectName === activeSubjectName) || { chapters: [] };
  const chapters = subject.chapters || [];

  // Calculate completion percentages for current subject
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => c.status === 'Completed').length;
  const inProgressChapters = chapters.filter(c => c.status === 'InProgress').length;
  
  const completionPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  const inProgressPercentage = totalChapters > 0 ? Math.round((inProgressChapters / totalChapters) * 100) : 0;

  // Calculate overall statistics
  let overallTotal = 0;
  let overallCompleted = 0;
  let overallInProgress = 0;

  subjectProgressList.forEach(sub => {
    (sub.chapters || []).forEach(ch => {
      overallTotal++;
      if (ch.status === 'Completed') overallCompleted++;
      else if (ch.status === 'InProgress') overallInProgress++;
    });
  });

  const overallPercent = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  const handleStatusChange = async (chapterName, currentStatus) => {
    let nextStatus = 'Todo';
    if (currentStatus === 'Todo') nextStatus = 'InProgress';
    else if (currentStatus === 'InProgress') nextStatus = 'Completed';
    
    await onUpdateChapter(activeSubjectName, chapterName, nextStatus);
  };

  const activeMeta = getSubjectMeta(activeSubjectName);
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="page-transition" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Premium Header and Overall Progress Banner */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span style={{ 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            fontWeight: 700, 
            letterSpacing: '0.1em', 
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-light)',
            padding: '0.25rem 0.75rem',
            borderRadius: '50px',
            display: 'inline-block',
            marginBottom: '0.75rem'
          }}>
            Preparation Tracker
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckSquare size={32} style={{ color: 'var(--primary)' }} /> CBSE Class XII Syllabus Tracker
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px', marginBottom: '2rem' }}>
            Monitor your progress, review key subjects, and ensure comprehensive coverage of the CBSE syllabus. Click on subjects and chapters to log your learning state.
          </p>

          {/* Overall Tracker Dashboard */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)' 
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Completion</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.25rem 0' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{overallPercent}%</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>completed</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${overallPercent}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s ease-out' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Syllabus Stats</span>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{overallCompleted}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Done</span>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)' }}>{overallInProgress}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>In Progress</span>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)' }}>{overallTotal - overallCompleted - overallInProgress}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Subtle decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          opacity: 0.03,
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Dynamic Subject Cards Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Select a Subject
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '2rem' 
      }}>
        {subjectProgressList.map((sub) => {
          const meta = getSubjectMeta(sub.subjectName);
          const subTotal = sub.chapters.length;
          const subCompleted = sub.chapters.filter(c => c.status === 'Completed').length;
          const subPercent = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;
          const isActive = activeSubjectName === sub.subjectName;
          const Icon = meta.icon;

          return (
            <div
              key={sub.subjectName}
              onClick={() => setSelectedSubject(sub.subjectName)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '1.25rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: isActive ? `2px solid ${meta.color}` : '2px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                boxShadow: isActive ? `0 8px 24px -6px ${meta.color}40` : 'var(--shadow-sm)',
                transform: isActive ? 'translateY(-2px)' : 'none',
              }}
              className="subject-card-toggle"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  backgroundColor: isActive ? meta.lightColor : 'var(--bg-app)',
                  color: meta.color,
                  transition: 'var(--transition-smooth)'
                }}>
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: meta.color }}>
                  {subPercent}%
                </span>
              </div>
              
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {sub.subjectName}
              </span>
              
              <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${subPercent}%`, 
                  height: '100%', 
                  backgroundColor: meta.color,
                  borderRadius: '3px',
                  transition: 'width 0.4s ease-out'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Subject Dashboard Metrics */}
      <div 
        className="dashboard-grid syllabus-main-grid" 
        style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 2fr', 
          gap: '1.25rem',
          marginBottom: '1.5rem' 
        }}
      >
        {/* Highlight subject score card */}
        <div 
          className="card" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            border: `1px solid ${activeMeta.color}25`,
            background: `linear-gradient(135deg, var(--bg-card), ${activeMeta.lightColor})`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative watermark icon */}
          <ActiveIcon 
            size={110} 
            style={{ 
              position: 'absolute', 
              right: '-15px', 
              bottom: '-15px', 
              color: activeMeta.color, 
              opacity: 0.04,
              pointerEvents: 'none'
            }} 
          />
          
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.5rem' }}>
            {activeSubjectName} Progress
          </h4>
          <span style={{ fontSize: '3.75rem', fontWeight: 800, color: activeMeta.color, lineHeight: 1, fontFamily: 'var(--font-heading)' }}>
            {completionPercentage}%
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
            <Award size={15} style={{ color: activeMeta.color }} />
            <span>{completedChapters} of {totalChapters} chapters</span>
          </div>
        </div>

        {/* Status Breakdown card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.5rem 2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} style={{ color: activeMeta.color }} /> Subject Progress Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Completed */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                  Completed ({completedChapters})
                </span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>{completionPercentage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${completionPercentage}%`, height: '100%', backgroundColor: 'var(--success)', borderRadius: '4px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>
            </div>

            {/* In Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                  In Progress ({inProgressChapters})
                </span>
                <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{inProgressPercentage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${inProgressPercentage}%`, height: '100%', backgroundColor: 'var(--warning)', borderRadius: '4px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>
            </div>

            {/* Remaining */}
            {(() => {
              const todoChapters = totalChapters - completedChapters - inProgressChapters;
              const todoPercentage = totalChapters > 0 ? Math.round((todoChapters / totalChapters) * 100) : 0;
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                      Not Started ({todoChapters})
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{todoPercentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${todoPercentage}%`, height: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Chapters Checklist */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '1rem' 
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Chapters in {activeSubjectName}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Cycle chapter status by clicking cards (<strong>Todo</strong> → <strong>In Progress</strong> → <strong>Completed</strong>)
            </p>
          </div>
          {isLoading && <RefreshCw size={18} className="animate-spin" style={{ color: activeMeta.color }} />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {chapters.map((ch) => {
            let statusColor = 'var(--text-muted)';
            let statusLight = 'var(--bg-app)';
            let statusLabel = 'Todo';
            let StatusIcon = Circle;

            if (ch.status === 'InProgress') {
              statusColor = 'var(--warning)';
              statusLight = 'var(--warning-light)';
              statusLabel = 'In Progress';
              StatusIcon = Clock;
            } else if (ch.status === 'Completed') {
              statusColor = 'var(--success)';
              statusLight = 'var(--success-light)';
              statusLabel = 'Completed';
              StatusIcon = CheckCircle2;
            }

            return (
              <div 
                key={ch.chapterName}
                onClick={() => handleStatusChange(ch.chapterName, ch.status)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: ch.status === 'Completed' ? `1px solid var(--success-light)` : ch.status === 'InProgress' ? `1px solid var(--warning-light)` : '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
                className="chapter-list-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', justify_content: 'space-between', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{ color: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <StatusIcon size={20} />
                    </div>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: '0.95rem',
                      color: ch.status === 'Completed' ? 'var(--text-secondary)' : 'var(--text-primary)',
                      textDecoration: ch.status === 'Completed' ? 'line-through' : 'none',
                      opacity: ch.status === 'Completed' ? 0.75 : 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {ch.chapterName}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    {ch.masteryScore > 0 && (
                      <span 
                        className="badge" 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          backgroundColor: activeMeta.lightColor,
                          color: activeMeta.color,
                          border: `1px solid ${activeMeta.color}25`
                        }}
                      >
                        Mastery: {ch.masteryScore}%
                      </span>
                    )}
                    <span 
                      className="badge" 
                      style={{ 
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: statusLight,
                        color: statusColor,
                        border: `1px solid ${statusColor}25`
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Mastery progress track */}
                {ch.masteryScore > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', minWidth: '70px', fontWeight: 600 }}>Mastery Level</span>
                    <div style={{ flexGrow: 1, height: '4px', backgroundColor: 'var(--bg-app)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${ch.masteryScore}%`, 
                          height: '100%', 
                          backgroundColor: ch.masteryScore >= 80 ? 'var(--success)' : ch.masteryScore >= 50 ? 'var(--warning)' : 'var(--danger)',
                          borderRadius: '2px',
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
