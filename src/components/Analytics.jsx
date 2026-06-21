import React from 'react';
import { 
  Activity, Flame, Clock, TrendingUp, AlertTriangle, CheckCircle2, 
  Sparkles, BookOpen, Award, CheckSquare, Atom, FlaskConical, 
  Calculator, Dna, LineChart, Terminal, ArrowRight, HelpCircle
} from 'lucide-react';

const subjectMeta = {
  Physics: { color: '#6366f1', lightColor: 'rgba(99, 102, 241, 0.1)', icon: Atom },
  Chemistry: { color: '#10b981', lightColor: 'rgba(16, 185, 129, 0.1)', icon: FlaskConical },
  Mathematics: { color: '#f59e0b', lightColor: 'rgba(245, 158, 11, 0.1)', icon: Calculator },
  Biology: { color: '#22c55e', lightColor: 'rgba(34, 197, 94, 0.1)', icon: Dna },
  Economics: { color: '#3b82f6', lightColor: 'rgba(59, 130, 246, 0.1)', icon: LineChart },
  'Computer Science': { color: '#f97316', lightColor: 'rgba(249, 115, 22, 0.1)', icon: Terminal }
};

const getSubjectMeta = (subjectName) => {
  return subjectMeta[subjectName] || { color: 'var(--primary)', lightColor: 'var(--primary-light)', icon: BookOpen };
};

export default function Analytics({ progressData }) {
  // 1. Gather stats from progressData
  const subjects = progressData?.subjectProgress || [];

  // Identify the top 3 dragging chapters
  const allChapters = [];
  subjects.forEach(sub => {
    sub.chapters.forEach(ch => {
      allChapters.push({
        subjectName: sub.subjectName,
        ...ch
      });
    });
  });

  const draggingChapters = allChapters
    .filter(ch => ch.status !== 'Completed' || ch.masteryScore < 80)
    .sort((a, b) => {
      if (a.masteryScore !== b.masteryScore) {
        return a.masteryScore - b.masteryScore;
      }
      const statusOrder = { 'Todo': 0, 'InProgress': 1, 'Completed': 2 };
      return (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
    })
    .slice(0, 3);

  let totalChapters = 0;
  let completedChapters = 0;
  let inProgressChapters = 0;
  let totalMasterySum = 0;
  let masteryCount = 0;

  subjects.forEach(sub => {
    sub.chapters.forEach(ch => {
      totalChapters++;
      if (ch.status === 'Completed') completedChapters++;
      else if (ch.status === 'InProgress') inProgressChapters++;
      
      if (ch.masteryScore > 0) {
        totalMasterySum += ch.masteryScore;
        masteryCount++;
      }
    });
  });

  const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  const averageMastery = masteryCount > 0 ? Math.round(totalMasterySum / masteryCount) : 70;

  // 2. Marks range predictor logic
  let predictedMin = 40;
  let predictedMax = 55;

  if (overallProgress > 80) {
    predictedMin = Math.round(80 + (averageMastery - 80) * 0.8);
    predictedMax = Math.round(predictedMin + 8);
  } else if (overallProgress > 50) {
    predictedMin = Math.round(65 + (overallProgress - 50) * 0.4);
    predictedMax = Math.round(predictedMin + 12);
  } else if (overallProgress > 20) {
    predictedMin = Math.round(50 + (overallProgress - 20) * 0.5);
    predictedMax = Math.round(predictedMin + 15);
  }
  
  if (predictedMax > 99) predictedMax = 99;
  if (predictedMin > 95) predictedMin = 95;

  // 3. Weekly study times computation (last 7 days bar chart representation)
  const studyDays = progressData?.studyTime || [];
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const studyChartData = last7Days.map(dateStr => {
    const record = studyDays.find(s => s.date === dateStr);
    const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
    return {
      day: dayName,
      minutes: record ? record.minutes : 0
    };
  });

  const maxMinutes = Math.max(...studyChartData.map(d => d.minutes), 30); // scale reference

  return (
    <div className="page-transition" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Title Header */}
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
            Analytics Engine
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={32} style={{ color: 'var(--primary)' }} /> Progress & Performance Analytics
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px', margin: 0 }}>
            Analyze your daily patterns, view predicted board metrics, and identify critical focus areas to maximize exam preparation efficiency.
          </p>
        </div>
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

      {/* Main KPI Row */}
      <div className="dashboard-grid analytics-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Streak card */}
        <div 
          className="card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.5rem',
            border: '1px solid rgba(217, 159, 89, 0.25)',
            background: 'linear-gradient(135deg, var(--bg-card), rgba(217, 159, 89, 0.08))',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--warning-light)', 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%',
            color: 'var(--warning)',
            boxShadow: '0 4px 12px rgba(217, 159, 89, 0.15)'
          }}>
            <Flame size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.2rem' }}>
              Daily Streak
            </h4>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              {progressData?.streak?.count || 0} Days
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {(progressData?.streak?.count || 0) > 0 ? "You're building momentum!" : "Start checking off chapters!"}
            </p>
          </div>
        </div>

        {/* Readiness Card */}
        <div 
          className="card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.5rem',
            border: '1px solid rgba(140, 130, 107, 0.25)',
            background: 'linear-gradient(135deg, var(--bg-card), rgba(140, 130, 107, 0.08))',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--primary-light)', 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%',
            color: 'var(--primary)',
            boxShadow: '0 4px 12px rgba(140, 130, 107, 0.15)'
          }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.2rem' }}>
              Exam Readiness
            </h4>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              {overallProgress}%
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Average Mastery: {averageMastery}%
            </p>
          </div>
        </div>

        {/* Predicted Marks Card */}
        <div 
          className="card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.5rem',
            border: '1px solid rgba(95, 117, 96, 0.25)',
            background: 'linear-gradient(135deg, var(--bg-card), rgba(95, 117, 96, 0.08))',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--success-light)', 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%',
            color: 'var(--success)',
            boxShadow: '0 4px 12px rgba(95, 117, 96, 0.15)'
          }}>
            <Clock size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.2rem' }}>
              Predicted Board Score
            </h4>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
              {predictedMin}% - {predictedMax}%
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Based on completion & mastery
            </p>
          </div>
        </div>
      </div>

      {/* Gaps / Readiness Analyzer Panel */}
      <div 
        className="card readiness-analyzer" 
        style={{ 
          marginBottom: '1.5rem', 
          padding: '2rem', 
          borderRadius: 'var(--radius-lg)', 
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid var(--warning)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justify_content: 'space-between', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
              <AlertTriangle size={22} style={{ color: 'var(--warning)' }} /> Board Exam Readiness Analyzer
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              We analyzed your syllabus tracker entries. Address these focus gaps to raise your marks prediction.
            </p>
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: '700', 
            color: 'var(--warning)', 
            backgroundColor: 'var(--warning-light)', 
            padding: '0.35rem 0.75rem', 
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            border: '1px solid rgba(217, 159, 89, 0.2)'
          }}>
            <Sparkles size={12} /> {draggingChapters.length} Priority Focus Areas
          </div>
        </div>

        {draggingChapters.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', backgroundColor: 'var(--success-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-light)' }}>
            <CheckCircle2 size={28} style={{ color: 'var(--success)' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--success)', margin: 0 }}>Syllabus Prep on Track!</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                All chapters are completed with high mastery levels. Maintain consistency and attempt mock tests!
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {draggingChapters.map((ch) => {
              const meta = getSubjectMeta(ch.subjectName);
              let actions = [];
              let planIcon = BookOpen;
              
              if (ch.status === 'Todo') {
                planIcon = BookOpen;
                actions = [
                  "Study the core NCERT chapter textbook and highlight principal formulas.",
                  "Go to Practice Engine and solve 5 basic conceptual flashcards."
                ];
              } else if (ch.status === 'InProgress') {
                planIcon = HelpCircle;
                actions = [
                  "Consult the Doubt Solver for clarification on complex proofs or topics.",
                  "Build conceptual depth by testing yourself under chapter mock tests."
                ];
              } else {
                planIcon = CheckSquare;
                actions = [
                  "Review incorrect responses in your history log to locate weak points.",
                  "Solve high-weightage CBSE board-standard mock sets to raise mastery above 85%."
                ];
              }

              return (
                <div 
                  key={`${ch.subjectName}-${ch.chapterName}`} 
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: 'var(--radius-md)', 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${meta.color}`,
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  className="analyzer-chapter-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: meta.color, letterSpacing: '0.05em' }}>
                        {ch.subjectName}
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: 'var(--text-primary)' }}>
                        {ch.chapterName}
                      </h4>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '50px',
                        backgroundColor: ch.status === 'Todo' ? 'var(--bg-app)' : ch.status === 'InProgress' ? 'var(--warning-light)' : 'var(--success-light)',
                        color: ch.status === 'Todo' ? 'var(--text-secondary)' : ch.status === 'InProgress' ? 'var(--warning)' : 'var(--success)',
                        border: `1px solid ${ch.status === 'InProgress' ? 'rgba(217, 159, 89, 0.2)' : 'transparent'}`
                      }}>
                        {ch.status === 'InProgress' ? 'In Progress' : ch.status}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ch.masteryScore}% Mastery
                      </span>
                    </div>
                  </div>

                  {/* Mastery Score Progress bar */}
                  <div style={{ height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: `${ch.masteryScore}%`, 
                      height: '100%', 
                      backgroundColor: ch.masteryScore < 40 ? 'var(--danger)' : ch.masteryScore < 80 ? 'var(--warning)' : 'var(--success)',
                      borderRadius: '10px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  {/* Action items list */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Recommended Action Plan
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {actions.map((act, aIdx) => (
                        <div key={aIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <div style={{ 
                            color: meta.color, 
                            backgroundColor: meta.lightColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {aIdx + 1}
                          </div>
                          <span style={{ lineHeight: '1.4' }}>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Main Dashboard Content */}
      <div 
        className="dashboard-grid analytics-main-grid" 
        style={{ 
          display: 'grid',
          gridTemplateColumns: '1.7fr 1.3fr', 
          gap: '1.25rem',
          marginBottom: '2rem' 
        }}
      >

        {/* Chapter Mastery Heatmap Grid */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Syllabus Heatmap
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            A comprehensive visual index of your chapters. Hover over elements to inspect details.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {subjects.map(sub => {
              const meta = getSubjectMeta(sub.subjectName);
              const SubIcon = meta.icon;
              return (
                <div key={sub.subjectName} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    <SubIcon size={14} style={{ color: meta.color }} />
                    <span>{sub.subjectName}</span>
                  </div>
                  
                  <div className="heatmap-container" style={{ padding: '0.2rem 0' }}>
                    {sub.chapters.map(ch => (
                      <div 
                        key={ch.chapterName}
                        className={`heatmap-cell ${ch.status.toLowerCase()}`}
                        style={{
                          backgroundColor: ch.status === 'Completed' ? meta.color : undefined
                        }}
                      >
                        <div className="heatmap-tooltip">
                          <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                            {ch.chapterName}
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            Status: <strong style={{ color: ch.status === 'Completed' ? 'var(--success)' : ch.status === 'InProgress' ? 'var(--warning)' : 'var(--text-muted)' }}>{ch.status}</strong>
                          </span>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                            Mastery Score: <strong>{ch.masteryScore}%</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2rem', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Not Started</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'var(--warning)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>In Progress</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'var(--primary)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Completed</span>
            </div>
          </div>
        </div>

        {/* Study Time graph */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} /> Study Activity (Min)
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
            Daily session minutes recorded during countdown exams or study hours over the last 7 days.
          </p>

          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end', 
            flex: 1, 
            height: '180px', 
            paddingBottom: '0.5rem', 
            borderBottom: '1px solid var(--border-color)',
            background: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 90%, var(--bg-card-hover) 100%)',
            borderRadius: '4px'
          }}>
            {/* Grid line background overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pointerEvents: 'none',
              zIndex: 1,
              opacity: 0.45
            }}>
              <div style={{ borderBottom: '1px dashed var(--border-color)', width: '100%', height: 0 }} />
              <div style={{ borderBottom: '1px dashed var(--border-color)', width: '100%', height: 0 }} />
              <div style={{ borderBottom: '1px dashed var(--border-color)', width: '100%', height: 0 }} />
              <div style={{ borderBottom: '1px dashed var(--border-color)', width: '100%', height: 0 }} />
            </div>

            {studyChartData.map(d => {
              const heightPct = Math.round((d.minutes / maxMinutes) * 100);
              const hasMinutes = d.minutes > 0;
              return (
                <div 
                  key={d.day} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    flex: 1, 
                    gap: '0.5rem',
                    position: 'relative',
                    zIndex: 2,
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}
                >
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    color: hasMinutes ? 'var(--primary)' : 'var(--text-muted)',
                    transition: 'color 0.2s'
                  }}>
                    {d.minutes}m
                  </span>
                  
                  <div 
                    style={{ 
                      width: '20px', 
                      height: `${Math.max(heightPct, 3)}px`, 
                      background: hasMinutes ? 'linear-gradient(to top, var(--primary-light), var(--primary))' : 'var(--bg-card-hover)',
                      border: hasMinutes ? '1px solid rgba(140, 130, 107, 0.4)' : '1px solid var(--border-color)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s',
                      boxShadow: hasMinutes ? '0 4px 10px rgba(140, 130, 107, 0.15)' : 'none'
                    }} 
                    className="study-bar-element"
                  />
                  
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
