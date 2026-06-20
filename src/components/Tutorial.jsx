import React, { useState } from 'react';
import { 
  MessageSquare, 
  CheckSquare, 
  GraduationCap, 
  Activity, 
  Calendar, 
  Users, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  Clock, 
  Award,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export default function Tutorial({ setActiveTab, user }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('walrus_tutorial_steps');
      return saved ? JSON.parse(saved) : {
        goals: false,
        syllabus: false,
        doubt: false,
        test: false
      };
    } catch {
      return { goals: false, syllabus: false, doubt: false, test: false };
    }
  });

  const toggleStep = (stepKey) => {
    const updated = { ...completedSteps, [stepKey]: !completedSteps[stepKey] };
    setCompletedSteps(updated);
    localStorage.setItem('walrus_tutorial_steps', JSON.stringify(updated));
  };

  const features = [
    {
      id: 'doubt-solver',
      title: '🤖 AI Doubt Solver',
      subtitle: 'Ask academic questions and get instant structured answers',
      description: 'Your 24/7 personal tutor. Resolves complex equations, formulas, and conceptual doubts across CBSE subjects.',
      icon: MessageSquare,
      color: 'var(--primary)',
      proTips: [
        '📸 Photo Upload: Upload screenshots or photos of your textbook questions to extract text via OCR.',
        '🎙️ Voice Query: Speak your query if you don\'t want to type it.',
        '🧩 Step-by-Step: The solver gives structured formulas, code blocks, and logical reasoning.'
      ],
      ctaText: 'Solve a Doubt Now',
      tabId: 'doubt-solver'
    },
    {
      id: 'syllabus-tracker',
      title: '📋 Syllabus Tracker',
      subtitle: 'Stay on top of your CBSE Board Exam syllabus',
      description: 'Monitor your completion across Physics, Chemistry, Mathematics, Biology, Economics, and Computer Science.',
      icon: CheckSquare,
      color: 'var(--success)',
      proTips: [
        '🔄 Simple Updates: Mark chapters as "Todo", "In Progress", or "Completed".',
        '📊 Mastery Score: Taking practice tests automatically updates your chapter mastery score.',
        '🎓 Target Focus: Prioritize chapters with low scores or "In Progress" status.'
      ],
      ctaText: 'Track Syllabus',
      tabId: 'syllabus-tracker'
    },
    {
      id: 'practice-engine',
      title: '⚡ Practice Engine',
      subtitle: 'Generate customized practice tests on-demand',
      description: 'Create interactive quizzes tailored to specific subjects and chapters to find knowledge gaps.',
      icon: GraduationCap,
      color: 'var(--warning)',
      proTips: [
        '🎛️ Customize: Select subject, target chapter, and number of questions.',
        '📈 Smart Feedback: Review explanations immediately after finishing a test.',
        '🏆 Mastery Boost: Achieving >80% score marks the chapter as "Completed" in your tracker.'
      ],
      ctaText: 'Generate a Test',
      tabId: 'practice-engine'
    },
    {
      id: 'planner',
      title: '⏱️ Planner & Productivity',
      subtitle: 'Beat procrastination with target setting & focus tools',
      description: 'Track daily goals, log study sessions, and run the built-in Pomodoro focus timer.',
      icon: Calendar,
      color: 'var(--danger)',
      proTips: [
        '🍅 Pomodoro Timer: Start a 25-minute focus interval to log study minutes.',
        '🔥 Streaks: Consistently log study sessions to maintain and build your daily study streak.',
        '🎯 Goal Tasks: Check off daily goals like "Ask a Doubt" or "Update Syllabus" for bonus points.'
      ],
      ctaText: 'Open Planner',
      tabId: 'planner'
    },
    {
      id: 'analytics',
      title: '📊 Analytics Dashboard',
      subtitle: 'Data-driven insights to optimize your preparation',
      description: 'See your real-world progress visualised over time, showing exactly where you are ready and where you need work.',
      icon: Activity,
      color: '#4f46e5',
      proTips: [
        '📅 Study Time: View chart summaries of study duration patterns.',
        '🕸️ Coverage Map: Compare chapter statuses across all 6 key subjects.',
        '💡 Data Focus: Identify subjects that require more time or practice.'
      ],
      ctaText: 'View Dashboard',
      tabId: 'analytics'
    },
    {
      id: 'community',
      title: '👥 Community Hub',
      subtitle: 'Collaborate and study with fellow students',
      description: 'Join discussion threads, post academic questions, share study resources, and upvote helpful answers.',
      icon: Users,
      color: '#0d9488',
      proTips: [
        '💬 Ask the Group: Ask community-wide questions that tutors or top-performing students can answer.',
        '📁 Resource Share: Share note links, CBSE sample papers, or study guides.',
        '👍 Upvote & Earn: Upvote high-quality answers to highlight them for others.'
      ],
      ctaText: 'Visit Community',
      tabId: 'community'
    }
  ];

  const currentFeature = features[activeSlide];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div className="card tutorial-banner" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
          <Sparkles size={240} style={{ color: 'var(--primary)' }} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Sparkles size={16} /> Welcome to Walrus{user?.username ? `, ${user.username}` : ''}!
        </div>
        <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
          Your Quick Start Study Guide
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxHeight: '300px', maxWidth: '700px', lineHeight: '1.5' }}>
          Walrus is an integrated learning environment designed to help you prepare systematically for CBSE exams. Learn, practice, track, and collaborate in one single interface.
        </p>
      </div>

      <div className="tutorial-grid">
        {/* Left Side: interactive checklist */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} /> First Day Study Checklist
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Complete these 4 tasks to unlock your profile potential and understand the flow.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div 
              onClick={() => toggleStep('goals')}
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.85rem', 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: completedSteps.goals ? 'var(--primary-light)' : 'var(--bg-app)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                border: '1px solid',
                borderColor: completedSteps.goals ? 'var(--primary)' : 'transparent'
              }}
            >
              <input 
                type="checkbox" 
                checked={completedSteps.goals} 
                onChange={() => {}} 
                style={{ marginTop: '0.2rem', pointerEvents: 'none' }} 
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: completedSteps.goals ? 'line-through' : 'none', color: completedSteps.goals ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  1. Start a Focus Session
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Go to the Planner tab, start a 25-minute Pomodoro timer, or update your study duration.
                </p>
              </div>
            </div>

            <div 
              onClick={() => toggleStep('syllabus')}
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.85rem', 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: completedSteps.syllabus ? 'var(--primary-light)' : 'var(--bg-app)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                border: '1px solid',
                borderColor: completedSteps.syllabus ? 'var(--primary)' : 'transparent'
              }}
            >
              <input 
                type="checkbox" 
                checked={completedSteps.syllabus} 
                onChange={() => {}} 
                style={{ marginTop: '0.2rem', pointerEvents: 'none' }} 
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: completedSteps.syllabus ? 'line-through' : 'none', color: completedSteps.syllabus ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  2. Mark Chapter Progress
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Go to the Syllabus Tracker and mark any Physics or Chemistry chapter as "In Progress" or "Completed".
                </p>
              </div>
            </div>

            <div 
              onClick={() => toggleStep('doubt')}
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.85rem', 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: completedSteps.doubt ? 'var(--primary-light)' : 'var(--bg-app)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                border: '1px solid',
                borderColor: completedSteps.doubt ? 'var(--primary)' : 'transparent'
              }}
            >
              <input 
                type="checkbox" 
                checked={completedSteps.doubt} 
                onChange={() => {}} 
                style={{ marginTop: '0.2rem', pointerEvents: 'none' }} 
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: completedSteps.doubt ? 'line-through' : 'none', color: completedSteps.doubt ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  3. Resolve an Academic Doubt
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Ask the AI Doubt Solver a question (e.g. "Explain Snell's law derivation").
                </p>
              </div>
            </div>

            <div 
              onClick={() => toggleStep('test')}
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.85rem', 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: completedSteps.test ? 'var(--primary-light)' : 'var(--bg-app)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                border: '1px solid',
                borderColor: completedSteps.test ? 'var(--primary)' : 'transparent'
              }}
            >
              <input 
                type="checkbox" 
                checked={completedSteps.test} 
                onChange={() => {}} 
                style={{ marginTop: '0.2rem', pointerEvents: 'none' }} 
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: completedSteps.test ? 'line-through' : 'none', color: completedSteps.test ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  4. Test Your Preparation
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Generate and complete a mini practice quiz under the Practice Engine.
                </p>
              </div>
            </div>
          </div>

          {Object.values(completedSteps).filter(Boolean).length === 4 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: 'var(--success-light)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              animation: 'pulse 2s infinite'
            }}>
              <Award size={24} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Perfect Score!</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>You are fully boarded. Time to achieve your study targets.</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Feature Tour */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '400px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={20} style={{ color: 'var(--primary)' }} /> Platform Tour & Pro Tips
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Select a tab below to learn about the modules.
            </p>
          </div>

          {/* Quick tab switcher */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <button
                  key={feat.id}
                  onClick={() => setActiveSlide(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: activeSlide === index ? feat.color : 'var(--border-color)',
                    backgroundColor: activeSlide === index ? feat.color : 'transparent',
                    color: activeSlide === index ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Icon size={14} />
                  {feat.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              );
            })}
          </div>

          {/* Featured slide detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
            <div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: '700', color: currentFeature.color }}>
                {currentFeature.title}
              </h4>
              <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {currentFeature.subtitle}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                {currentFeature.description}
              </p>
            </div>

            <div style={{ 
              backgroundColor: 'var(--bg-app)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1rem',
              borderLeft: `4px solid ${currentFeature.color}`
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pro Tips:
              </span>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem', paddingLeft: '0.2rem', listStyle: 'none' }}>
                {currentFeature.proTips.map((tip, idx) => (
                  <li key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => setActiveTab(currentFeature.tabId)}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: currentFeature.color,
                marginTop: 'auto',
                padding: '0.8rem'
              }}
            >
              {currentFeature.ctaText} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
