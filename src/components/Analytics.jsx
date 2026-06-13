import React from 'react';
import { Activity, Flame, Clock, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';


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
  // Get last 7 days strings
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
    <div className="glass-panel" style={{ maxWidth: '950px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={28} /> Progress & Performance Analytics
      </h2>

      {/* Main KPI Row */}
      <div className="dashboard-grid analytics-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2rem' }}>
        {/* Flame Streak card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--warning-light)', p: '0.75rem', padding: '0.75rem', borderRadius: '50%' }}>
            <Flame size={32} style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Daily Streak</h4>
            <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>{progressData?.streak?.count || 0} Days</span>
          </div>
        </div>

        {/* Readiness Score Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: '50%' }}>
            <TrendingUp size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Board Exam Readiness</h4>
            <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>{overallProgress}%</span>
          </div>
        </div>

        {/* Predicted Marks Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--success-light)', padding: '0.75rem', borderRadius: '50%' }}>
            <Clock size={32} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Predicted Board Marks</h4>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
              {predictedMin}% - {predictedMax}%
            </span>
          </div>
        </div>
      </div>

      {/* Gaps / Readiness Analyzer Panel */}
      <div className="card readiness-analyzer" style={{ 
        marginBottom: '2rem', 
        padding: '1.75rem', 
        borderRadius: 'var(--radius-lg)', 
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid var(--warning)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <AlertTriangle size={20} style={{ color: 'var(--warning)' }} /> Board Exam Readiness Analyzer
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              We detected the following critical gaps. Address these to maximize your readiness score.
            </p>
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: '600', 
            color: 'var(--warning)', 
            backgroundColor: 'var(--warning-light)', 
            padding: '0.25rem 0.6rem', 
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Sparkles size={12} /> {draggingChapters.length} Focus Gaps
          </div>
        </div>

        {draggingChapters.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--success-light)', borderRadius: 'var(--radius-md)' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--success)', margin: 0 }}>Syllabus Prep on Track!</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                All chapters are completed with high mastery. Maintain your schedule and run full test simulations.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {draggingChapters.map((ch) => {
              let actions = [];
              if (ch.status === 'Todo') {
                actions = [
                  "Review core NCERT syllabus text & summarize primary definitions.",
                  "Attempt 5 basic practice questions in the Practice Engine to initiate progress."
                ];
              } else if (ch.status === 'InProgress') {
                actions = [
                  "Use the AI Doubt Solver to clear any formula or conceptual roadblocks.",
                  "Schedule a chapter test under Simulator mode to benchmark your pacing."
                ];
              } else {
                actions = [
                  "Replay mistake book using spaced repetition intervals to address weak points.",
                  "Solve high-weightage CBSE board standard mock sets to push mastery above 85%."
                ];
              }

              return (
                <div key={`${ch.subjectName}-${ch.chapterName}`} style={{ 
                  padding: '1.2rem', 
                  borderRadius: 'var(--radius-md)', 
                  backgroundColor: 'var(--bg-card-hover)', 
                  border: '1px solid var(--border-color)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default'
                }}
                className="analyzer-chapter-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                        {ch.subjectName}
                      </span>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: '600', margin: '0.15rem 0 0 0' }}>
                        {ch.chapterName}
                      </h4>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: '600', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px',
                        backgroundColor: ch.status === 'Todo' ? 'var(--border-color)' : 'var(--warning-light)',
                        color: ch.status === 'Todo' ? 'var(--text-secondary)' : 'var(--warning)'
                      }}>
                        {ch.status === 'InProgress' ? 'In Progress' : ch.status}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {ch.masteryScore}% Mastery
                      </span>
                    </div>
                  </div>

                  {/* Mastery Score Progress bar */}
                  <div style={{ height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: `${ch.masteryScore}%`, 
                      height: '100%', 
                      backgroundColor: ch.masteryScore < 40 ? 'var(--danger)' : ch.masteryScore < 80 ? 'var(--warning)' : 'var(--success)',
                      borderRadius: '10px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>

                  {/* Action items list */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Recommended Action Plan:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {actions.map((act, aIdx) => (
                        <div key={aIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span style={{ 
                            color: 'var(--warning)', 
                            fontWeight: 'bold', 
                            fontSize: '0.85rem',
                            lineHeight: '1.2',
                            flexShrink: 0
                          }}>
                            {aIdx + 1}.
                          </span>
                          <span>{act}</span>
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

      <div className="dashboard-grid analytics-main-grid" style={{ gridTemplateColumns: '1.8fr 1.2fr', marginBottom: '2rem' }}>

        {/* Chapter Mastery Heatmap Grid */}
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Syllabus Heatmap (Chapter Mastery)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Grid of all chapters. Hover to view syllabus details; click chapter on tracker to change status.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {subjects.map(sub => (
              <div key={sub.subjectName}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {sub.subjectName}
                </div>
                <div className="heatmap-container">
                  {sub.chapters.map(ch => (
                    <div 
                      key={ch.chapterName}
                      className={`heatmap-cell ${ch.status.toLowerCase()}`}
                    >
                      <div className="heatmap-tooltip">
                        <strong>{ch.chapterName}</strong><br />
                        Status: {ch.status} | Mastery: {ch.masteryScore}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }} />
              <span>Todo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--warning)', opacity: 0.6 }} />
              <span>In Progress</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--success)' }} />
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Study Time graph */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={18} /> Daily Study Sessions (Minutes)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Weekly summary of minutes recorded during countdown practice sessions or study sessions.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flex: 1, height: '150px', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            {studyChartData.map(d => {
              const heightPct = Math.round((d.minutes / maxMinutes) * 100);
              return (
                <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: d.minutes > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {d.minutes}m
                  </span>
                  <div 
                    style={{ 
                      width: '24px', 
                      height: `${Math.max(heightPct, 4)}px`, 
                      backgroundColor: d.minutes > 0 ? 'var(--primary)' : 'var(--bg-card-hover)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }} 
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
