import React, { useState, useEffect } from 'react';
import { GraduationCap, Timer, Award, Layers, CheckCircle2, AlertTriangle, BookOpen, RefreshCw, Zap, RotateCcw, Sparkles, AlertCircle, Plus, Trash2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics'];

const CHAPTERS_PRESET = {
  Physics: [
    'Electric Charges and Fields', 'Electrostatic Potential and Capacitance',
    'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter',
    'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves',
    'Ray Optics and Optical Instruments', 'Wave Optics',
    'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei',
    'Semiconductor Electronics'
  ],
  Chemistry: [
    'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry',
    'General Principles and Processes of Isolation of Elements',
    'p-Block Elements', 'd and f Block Elements', 'Coordination Compounds',
    'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers',
    'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules'
  ],
  Mathematics: [
    'Relations and Functions', 'Inverse Trigonometric Functions',
    'Matrices', 'Determinants',
    'Continuity and Differentiability', 'Application of Derivatives',
    'Integrals', 'Application of Integrals',
    'Differential Equations', 'Vector Algebra',
    'Three Dimensional Geometry', 'Linear Programming', 'Probability'
  ],
  Biology: [
    'Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants',
    'Human Reproduction', 'Reproductive Health',
    'Principles of Inheritance and Variation', 'Molecular Basis of Inheritance',
    'Evolution', 'Human Health and Disease',
    'Strategies for Enhancement in Food Production',
    'Microbes in Human Welfare', 'Biotechnology - Principles and Processes',
    'Biotechnology and its Applications', 'Organisms and Populations',
    'Ecosystem', 'Biodiversity and Conservation'
  ],
  Economics: [
    'National Income Accounting', 'Money and Banking',
    'Determination of Income and Employment', 'Government Budget and the Economy',
    'Balance of Payments', 'Introduction to Microeconomics',
    'Consumer Equilibrium and Demand', 'Producer Behaviour and Supply',
    'Forms of Market and Price Determination'
  ]
};

const SEEDED_FLASHCARDS = {
  Physics: [
    { q: "Define Electric Dipole Moment. State its SI unit.", a: "It is the product of magnitude of one charge and the distance between them: $p = q(2a)$. SI unit is Coulomb-meter ($C\\cdot m$)." },
    { q: "State Gauss's Law in electrostatics.", a: "The total electric flux through any closed surface is $1/\\varepsilon_0$ times the net charge enclosed: $\\Phi = \\oint E \\cdot dS = q_{enclosed}/\\varepsilon_0$." },
    { q: "What is Capacitive Reactance? Write its formula.", a: "The opposition offered by a capacitor to AC. $X_C = \\frac{1}{2\\pi f C}$." }
  ],
  Chemistry: [
    { q: "Define Faraday's First Law of Electrolysis.", a: "Mass deposited at an electrode is directly proportional to charge passed: $m = z\\cdot I \\cdot t$." },
    { q: "State Henry's Law.", a: "Solubility of a gas in a liquid is proportional to its partial pressure above the liquid: $p = K_H \\chi$." }
  ],
  Mathematics: [
    { q: "Define a Skew-symmetric Matrix.", a: "A square matrix $A$ where $A^T = -A$. All diagonal elements are zero." },
    { q: "Conditions for continuity at a point $c$.", a: "1. $f(c)$ is defined. 2. $\\lim_{x \\to c} f(x)$ exists. 3. $\\lim_{x \\to c} f(x) = f(c)$." }
  ],
  Biology: [
    { q: "What is a Nucleosome?", a: "A structural unit of eukaryotic chromosome: DNA coiled around a histone octamer (8 histone proteins)." }
  ],
  Economics: [
    { q: "Define double counting in GDP estimation.", a: "Counting the value of the same product more than once by including intermediate goods alongside final goods." }
  ]
};

const QUESTION_TYPES = [
  { key: 'Mixed',  label: 'Mixed (PYQ Style)', desc: 'MCQ + Short + Long answers — closest to real board paper' },
  { key: 'MCQ',   label: 'MCQ Only',           desc: '1-mark objective questions & Assertion-Reason' },
  { key: 'VSA',   label: 'Very Short Answer',  desc: '2-mark questions — definitions, short numericals' },
  { key: 'SA',    label: 'Short Answer',        desc: '3-mark questions — derivations, applications' },
  { key: 'LA',    label: 'Long Answer',         desc: '5-mark questions — full derivations, two-part questions' },
];

export default function PracticeEngine({ progressData, onSaveTestResult }) {
  const [activeSubTab, setActiveSubTab] = useState('mock-tests'); // mock-tests | quick-practice | flashcards
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [chapter, setChapter] = useState('All Chapters');

  // Mock test state
  const [isLoading, setIsLoading] = useState(false);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [testActive, setTestActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testDuration, setTestDuration] = useState(60);
  const [evaluation, setEvaluation] = useState(null);
  const [errorAnalysis, setErrorAnalysis] = useState(null);
  const [isAnalyzingErrors, setIsAnalyzingErrors] = useState(false);

  // Quick practice state
  const [qpSelectedChapters, setQpSelectedChapters] = useState([]);
  const [qpType, setQpType] = useState('Mixed');
  const [qpCount, setQpCount] = useState(10);
  const [qpLoading, setQpLoading] = useState(false);
  const [qpQuestions, setQpQuestions] = useState(null);
  const [qpAnswers, setQpAnswers] = useState({});
  const [qpRevealed, setQpRevealed] = useState({});

  // Flashcards state
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedBox, setSelectedBox] = useState('All'); // 'All', 1, 2, 3
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [fcChapter, setFcChapter] = useState('All Chapters');

  useEffect(() => {
    setChapter('All Chapters');
    setFcChapter('All Chapters');
    setSelectedBox('All');
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setQpSelectedChapters([]);
  }, [subject]);

  // Timer
  useEffect(() => {
    let timer;
    if (testActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && testActive) {
      setTestActive(false);
      handleSubmitTest();
    }
    return () => clearInterval(timer);
  }, [testActive, timeLeft]);

  // ── Mock Test ──────────────────────────────────────────────────────────────
  const handleStartTest = async () => {
    setIsLoading(true);
    setEvaluation(null);
    setErrorAnalysis(null);
    setStudentAnswers({});
    try {
      const res = await fetch('http://localhost:5000/api/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, chapter, duration: testDuration })
      });
      const paper = await res.json();
      setCurrentPaper(paper);
      setTimeLeft(testDuration * 60);
      setTestActive(true);
    } catch (err) {
      console.error(err);
      alert('Could not start mock test. Please ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!currentPaper) return;
    setTestActive(false);
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/evaluate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: currentPaper.subject, generatedPaper: currentPaper, answers: studentAnswers })
      });
      const result = await res.json();
      setEvaluation(result);
      if (onSaveTestResult) {
        await onSaveTestResult({
          subject: currentPaper.subject, chapter: currentPaper.chapter,
          testType: 'Mock', generatedPaper: currentPaper, answers: studentAnswers,
          score: result.score, totalMarks: result.totalMarks, feedback: result.feedback
        });
      }
    } catch (err) {
      console.error(err);
      alert('Error during evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeErrors = async () => {
    if (!currentPaper || !evaluation || !studentAnswers) return;
    setIsAnalyzingErrors(true);
    setErrorAnalysis(null);
    try {
      const res = await fetch('http://localhost:5000/api/ai/analyze-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: currentPaper.subject,
          generatedPaper: currentPaper,
          answers: studentAnswers,
          evaluation: evaluation
        })
      });
      const data = await res.json();
      setErrorAnalysis(data);
    } catch (err) {
      console.error(err);
      alert('Could not run AI error analysis. Please check your backend connection.');
    } finally {
      setIsAnalyzingErrors(false);
    }
  };

  // ── Quick Practice ─────────────────────────────────────────────────────────
  const toggleQpChapter = (ch) => {
    setQpSelectedChapters(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleGenerateQuickPractice = async () => {
    setQpLoading(true);
    setQpQuestions(null);
    setQpAnswers({});
    setQpRevealed({});
    try {
      const res = await fetch('http://localhost:5000/api/ai/quick-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          chapters: qpSelectedChapters.length > 0 ? qpSelectedChapters : [],
          questionType: qpType,
          count: qpCount
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQpQuestions(data);
    } catch (err) {
      console.error(err);
      alert('Could not generate questions: ' + err.message);
    } finally {
      setQpLoading(false);
    }
  };

  // ── Flashcards ─────────────────────────────────────────────────────────────
  const userId = progressData?.userId || 'default-student';

  const fetchFlashcards = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/student/flashcards?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data && data.length > 0) {
        setAllFlashcards(data);
      } else {
        // Fallback to seeded baseline cards
        const seeded = [];
        Object.keys(SEEDED_FLASHCARDS).forEach(sub => {
          SEEDED_FLASHCARDS[sub].forEach((c, idx) => {
            seeded.push({
              _id: `seed-${sub}-${idx}`,
              userId,
              subject: sub,
              chapter: 'All Chapters',
              question: c.q,
              answer: c.a,
              box: 1,
              nextReviewDate: new Date()
            });
          });
        });
        setAllFlashcards(seeded);
      }
    } catch (err) {
      console.warn('Backend offline, loading flashcards from offline cache:', err.message);
      const cached = localStorage.getItem(`walrus_flashcards_${userId}`);
      if (cached) {
        setAllFlashcards(JSON.parse(cached));
      } else {
        // Fallback to seeded baseline cards
        const seeded = [];
        Object.keys(SEEDED_FLASHCARDS).forEach(sub => {
          SEEDED_FLASHCARDS[sub].forEach((c, idx) => {
            seeded.push({
              _id: `seed-${sub}-${idx}`,
              userId,
              subject: sub,
              chapter: 'All Chapters',
              question: c.q,
              answer: c.a,
              box: 1,
              nextReviewDate: new Date()
            });
          });
        });
        setAllFlashcards(seeded);
      }
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [userId, activeSubTab]);

  useEffect(() => {
    if (allFlashcards.length > 0) {
      localStorage.setItem(`walrus_flashcards_${userId}`, JSON.stringify(allFlashcards));
    }
  }, [allFlashcards, userId]);

  // Compute filtered list of flashcards
  const filteredFlashcards = allFlashcards.filter(card => {
    if (card.subject !== subject) return false;
    if (fcChapter !== 'All Chapters' && card.chapter !== fcChapter) return false;
    if (selectedBox !== 'All' && card.box !== Number(selectedBox)) return false;
    return true;
  });

  // Clamping page/card index to within limits on list length change
  useEffect(() => {
    if (currentCardIndex >= filteredFlashcards.length) {
      setCurrentCardIndex(0);
    }
  }, [filteredFlashcards.length, currentCardIndex]);

  const subjectAndChapterCards = allFlashcards.filter(card => {
    if (card.subject !== subject) return false;
    if (fcChapter !== 'All Chapters' && card.chapter !== fcChapter) return false;
    return true;
  });

  const getBoxCount = (boxNum) => {
    if (boxNum === 'All') return subjectAndChapterCards.length;
    return subjectAndChapterCards.filter(c => c.box === boxNum).length;
  };

  const handleFlashcardReview = async (cardId, passed) => {
    if (!cardId) return;
    
    // Check if card is a seed/offline-only card
    const isLocalOnly = cardId.startsWith('seed-') || cardId.startsWith('offline-') || cardId.startsWith('mock-ai-');
    
    // Optimistic / Local UI update
    setAllFlashcards(prev => {
      const updated = prev.map(card => {
        if (card._id === cardId) {
          let nextBox = card.box;
          let daysToAdd = 1;
          if (passed) {
            nextBox = Math.min(card.box + 1, 3);
            daysToAdd = nextBox === 2 ? 3 : nextBox === 3 ? 7 : 1;
          } else {
            nextBox = 1;
            daysToAdd = 1;
          }
          const nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + daysToAdd);
          return { ...card, box: nextBox, nextReviewDate: nextReview };
        }
        return card;
      });
      localStorage.setItem(`walrus_flashcards_${userId}`, JSON.stringify(updated));
      return updated;
    });

    if (!isLocalOnly) {
      try {
        const res = await fetch('http://localhost:5000/api/student/flashcards/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId, passed })
        });
        if (!res.ok) throw new Error('Failed to submit review');
        const updatedCard = await res.json();
        setAllFlashcards(prev => prev.map(c => c._id === cardId ? updatedCard : c));
      } catch (err) {
        console.warn('Backend offline, sync skipped for card review:', err.message);
      }
    }

    setIsFlipped(false);
    setTimeout(() => {
      if (currentCardIndex + 1 < filteredFlashcards.length) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        setCurrentCardIndex(0);
      }
    }, 150);
  };

  const handleDeleteCard = async (cardId) => {
    if (!cardId) return;

    // Optimistic UI delete
    const updated = allFlashcards.filter(c => c._id !== cardId);
    setAllFlashcards(updated);
    if (currentCardIndex >= updated.length) {
      setCurrentCardIndex(Math.max(0, updated.length - 1));
    }

    const isLocalOnly = cardId.startsWith('seed-') || cardId.startsWith('offline-') || cardId.startsWith('mock-ai-');
    if (!isLocalOnly) {
      try {
        const res = await fetch(`http://localhost:5000/api/student/flashcards/${cardId}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete card');
      } catch (err) {
        console.warn('Backend offline, sync skipped for card deletion:', err.message);
      }
    }
  };

  const handleAddCustomCard = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert('Please enter both question and answer.');
      return;
    }

    const newCardPayload = {
      userId,
      subject,
      chapter: fcChapter === 'All Chapters' ? chaptersForSubject[0] || 'General' : fcChapter,
      question: newQuestion,
      answer: newAnswer
    };

    try {
      const res = await fetch('http://localhost:5000/api/student/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCardPayload)
      });
      if (!res.ok) throw new Error('Failed to save card');
      const savedCard = await res.json();
      setAllFlashcards(prev => [savedCard, ...prev]);
    } catch (err) {
      console.warn('Backend offline, card created locally:', err.message);
      const offlineCard = {
        _id: `offline-${Date.now()}`,
        ...newCardPayload,
        box: 1,
        nextReviewDate: new Date()
      };
      setAllFlashcards(prev => [offlineCard, ...prev]);
    }

    setNewQuestion('');
    setNewAnswer('');
    setIsModalOpen(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleAiGenerateCards = async () => {
    const activeCh = fcChapter === 'All Chapters' ? chaptersForSubject[0] || 'General' : fcChapter;
    setIsGeneratingCards(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subject,
          chapter: activeCh
        })
      });
      if (!res.ok) throw new Error('Failed to generate');
      const newCards = await res.json();
      if (Array.isArray(newCards)) {
        setAllFlashcards(prev => [...newCards, ...prev]);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        alert(`Successfully generated ${newCards.length} high-yield flashcards for ${activeCh}!`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.warn('AI generation offline fallback:', err.message);
      const mockAiCards = [
        {
          _id: `mock-ai-${Date.now()}-1`,
          userId,
          subject,
          chapter: activeCh,
          question: `Explain the fundamental concept of **${activeCh}** under CBSE syllabus.`,
          answer: `Under NCERT guidelines, this topic covers the core mathematical relation: $$f(x) = \\int g(x) dx$$ or physical law. Ensure to mention correct SI units.`,
          box: 1,
          nextReviewDate: new Date()
        },
        {
          _id: `mock-ai-${Date.now()}-2`,
          userId,
          subject,
          chapter: activeCh,
          question: `State a key formula or definition for **${activeCh}**.`,
          answer: `The formula is given by: $$E = mc^2$$ or equivalent. This is a high-yield Board topic carrying $2-3$ marks.`,
          box: 1,
          nextReviewDate: new Date()
        },
        {
          _id: `mock-ai-${Date.now()}-3`,
          userId,
          subject,
          chapter: activeCh,
          question: `What is a common student pitfall in exams regarding **${activeCh}**?`,
          answer: `Students often forget to write the SI units or draw labeled diagrams. CBSE marking schemes reserve $0.5$ to $1$ mark for proper diagram representation.`,
          box: 1,
          nextReviewDate: new Date()
        },
        {
          _id: `mock-ai-${Date.now()}-4`,
          userId,
          subject,
          chapter: activeCh,
          question: `State Henry's/Gauss's or equivalent textbook laws for **${activeCh}**.`,
          answer: `State the physical law verbatim from the NCERT textbook, for example: $PV = nRT$.`,
          box: 1,
          nextReviewDate: new Date()
        },
        {
          _id: `mock-ai-${Date.now()}-5`,
          userId,
          subject,
          chapter: activeCh,
          question: `Explain an application of **${activeCh}** in everyday life.`,
          answer: `Common applications are studied in class 12, such as transformers, motors, cell division, or national income accounting.`,
          box: 1,
          nextReviewDate: new Date()
        }
      ];
      setAllFlashcards(prev => [...mockAiCards, ...prev]);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      alert(`Backend offline. Generated 5 NCERT study flashcards locally for ${activeCh}!`);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const chaptersForSubject = CHAPTERS_PRESET[subject] || [];

  return (
    <div className="glass-panel" style={{ maxWidth: '950px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={28} /> Practice &amp; Exam Engine
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'mock-tests',      label: 'CBSE Mock Paper' },
            { key: 'quick-practice',  label: '⚡ Quick Practice' },
            { key: 'flashcards',      label: 'Flashcards' }
          ].map(tab => (
            <button key={tab.key} className="btn-secondary" onClick={() => setActiveSubTab(tab.key)}
              style={{
                borderColor: activeSubTab === tab.key ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: activeSubTab === tab.key ? 'var(--primary-light)' : 'var(--bg-card)',
                color: activeSubTab === tab.key ? 'var(--primary)' : 'var(--text-primary)'
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {SUBJECTS.map(sub => (
          <button key={sub} className="btn-secondary"
            style={{
              padding: '0.5rem 1rem', fontSize: '0.85rem',
              backgroundColor: subject === sub ? 'var(--primary)' : 'var(--bg-card)',
              color: subject === sub ? '#fff' : 'var(--text-primary)',
              borderColor: subject === sub ? 'var(--primary)' : 'var(--border-color)'
            }}
            onClick={() => { setSubject(sub); setEvaluation(null); setCurrentPaper(null); setQpQuestions(null); }}>
            {sub}
          </button>
        ))}
      </div>

      {/* ── TAB: MOCK TEST ─────────────────────────────────────────────────── */}
      {activeSubTab === 'mock-tests' && (
        <div>
          {!testActive && !evaluation && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <Layers size={48} style={{ color: 'var(--primary)', marginBottom: '1rem', margin: '0 auto' }} />
              <h3>Build CBSE Mock Test Paper</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0.5rem auto 2rem' }}>
                Generate a full-length board-pattern paper covering MCQs, short answers, long answers and case studies — tailored to your selected chapter.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <div className="input-group" style={{ minWidth: '200px', textAlign: 'left' }}>
                  <label>Chapter Scope</label>
                  <select className="input-control" value={chapter} onChange={e => setChapter(e.target.value)}>
                    <option value="All Chapters">All Chapters (Full Syllabus)</option>
                    {chaptersForSubject.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ minWidth: '200px', textAlign: 'left' }}>
                  <label>Duration &amp; Marks</label>
                  <select className="input-control" value={testDuration} onChange={e => setTestDuration(parseInt(e.target.value))}>
                    <option value={30}>30 min — 15 marks (MCQ Sprint)</option>
                    <option value={60}>60 min — 25 marks (Unit Test)</option>
                    <option value={120}>120 min — 50 marks (Half Paper)</option>
                    <option value={180}>180 min — 80 marks (Full Board Sim)</option>
                  </select>
                </div>
              </div>

              {/* Live paper structure preview */}
              {(() => {
                const SECTION_INFO = {
                  'A (MCQ)': 'Multiple Choice Questions & Assertion–Reason pairs. Pick one correct option from four choices. Each carries 1 mark with no negative marking.',
                  'B (VSA)': 'Very Short Answer questions. Write a precise answer in 2–3 sentences or solve a short numerical. Each carries 2 marks.',
                  'C (SA)':  'Short Answer questions. Explain a concept, derive a formula, or solve a problem with full steps. Each carries 3 marks.',
                  'D (LA)':  'Long Answer / Derivation questions. Detailed 2-part questions covering full derivations, diagrams, and numerical applications. Each carries 5 marks.',
                  'E (Case)':'Case Study / Source-based questions. Read a short passage or diagram and answer related sub-questions. Each set carries 4 marks.',
                };
                const durationMeta = {
                  30:  { marks: 15, label: 'MCQ Sprint',       sections: [{ name: 'A (MCQ)', count: 15, each: 1 }] },
                  60:  { marks: 25, label: 'Unit Test',        sections: [{ name: 'A (MCQ)', count: 5, each: 1 }, { name: 'B (VSA)', count: 4, each: 2 }, { name: 'C (SA)', count: 4, each: 3 }] },
                  120: { marks: 50, label: 'Half Paper',       sections: [{ name: 'A (MCQ)', count: 10, each: 1 }, { name: 'B (VSA)', count: 5, each: 2 }, { name: 'C (SA)', count: 5, each: 3 }, { name: 'D (LA)', count: 3, each: 5 }] },
                  180: { marks: 80, label: 'Full Board Paper', sections: [{ name: 'A (MCQ)', count: 20, each: 1 }, { name: 'B (VSA)', count: 6, each: 2 }, { name: 'C (SA)', count: 7, each: 3 }, { name: 'D (LA)', count: 3, each: 5 }, { name: 'E (Case)', count: 3, each: 4 }] },
                };
                const meta = durationMeta[testDuration];
                if (!meta) return null;
                return (
                  <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                    <p style={{ margin: '0 0 0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>📋 Paper Structure — {meta.label} · {meta.marks} Marks Total</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {meta.sections.map(sec => (
                        <div key={sec.name} style={{ position: 'relative', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}
                          className="section-info-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            Section {sec.name}
                            <span
                              className="section-info-trigger"
                              title={SECTION_INFO[sec.name]}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '14px', height: '14px', borderRadius: '50%',
                                background: 'var(--primary)', color: '#fff',
                                fontSize: '9px', fontWeight: 700, cursor: 'default',
                                lineHeight: 1, flexShrink: 0, userSelect: 'none',
                                opacity: 0.75
                              }}
                            >i</span>
                          </div>
                          <div style={{ fontWeight: 400, color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {sec.count} Qs × {sec.each}m = {sec.count * sec.each}m
                          </div>
                          {/* Tooltip bubble */}
                          <div className="section-info-tooltip" style={{
                            position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            borderRadius: '8px', padding: '0.6rem 0.8rem',
                            fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 400,
                            width: '220px', lineHeight: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                            pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s ease',
                            zIndex: 50, textAlign: 'left',
                            whiteSpace: 'normal'
                          }}>
                            {SECTION_INFO[sec.name]}
                            {/* Arrow */}
                            <span style={{
                              position: 'absolute', top: '100%', left: '50%',
                              transform: 'translateX(-50%)',
                              width: 0, height: 0,
                              borderLeft: '6px solid transparent',
                              borderRight: '6px solid transparent',
                              borderTop: '6px solid var(--border-color)'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <button className="btn-primary" onClick={handleStartTest} disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {isLoading ? <><RefreshCw className="animate-spin" size={16} /> Generating paper…</> : `Generate ${testDuration}-Min Mock Exam`}
              </button>
            </div>
          )}

          {testActive && currentPaper && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>{currentPaper.title}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {currentPaper.chapter} &nbsp;·&nbsp; Total: {currentPaper.totalMarks} marks
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-light)', padding: '0.5rem 1rem', borderRadius: '50px' }}>
                  <Timer size={18} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>{formatTime(timeLeft)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
                {Object.keys(currentPaper.sections || {}).map(secName => {
                  const questions = currentPaper.sections[secName] || [];
                  if (questions.length === 0) return null;
                  return (
                    <div key={secName} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        Section {secName} &mdash; {
                          secName === 'A' ? `MCQ & Assertion-Reason (1 mark each) · ${questions.length} questions` :
                          secName === 'B' ? `Very Short Answer (2 marks each) · ${questions.length} questions` :
                          secName === 'C' ? `Short Answer (3 marks each) · ${questions.length} questions` :
                          secName === 'D' ? `Long Answer / Derivation (5 marks each) · ${questions.length} questions` :
                                           `Case Study (4 marks each) · ${questions.length} questions`
                        }
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {questions.map(q => (
                          <div key={q.id}>
                            <p style={{ fontWeight: 500, marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                              <span style={{ color: 'var(--primary)', fontWeight: 700, minWidth: '2rem' }}>{q.id}.</span>
                              <span style={{ whiteSpace: 'pre-wrap' }}>{q.question}</span>
                              <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>[{q.marks}m]</span>
                            </p>
                            {q.options ? (
                              <div className="practice-options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingLeft: '2rem' }}>
                                {q.options.map(opt => (
                                  <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', border: `1px solid ${studentAnswers[q.id] === opt ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', backgroundColor: studentAnswers[q.id] === opt ? 'var(--primary-light)' : 'transparent' }}>
                                    <input type="radio" name={q.id} value={opt} checked={studentAnswers[q.id] === opt}
                                      onChange={e => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })} />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <textarea className="input-control" rows={secName === 'D' ? 8 : 4}
                                placeholder="Type your step-by-step CBSE marking answer here…"
                                style={{ width: '100%', fontSize: '0.9rem' }}
                                value={studentAnswers[q.id] || ''}
                                onChange={e => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => { setTestActive(false); setCurrentPaper(null); }}>Quit Test</button>
                <button className="btn-primary" onClick={handleSubmitTest} disabled={isLoading}>
                  {isLoading ? 'Grading…' : 'Submit Paper for Assessment'}
                </button>
              </div>
            </div>
          )}

          {evaluation && currentPaper && (
            <div className="card" style={{ borderLeft: '6px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3>CBSE Grading Assessment Report</h3>
                <button className="btn-secondary" onClick={() => { setEvaluation(null); setCurrentPaper(null); }}>Back to Simulator</button>
              </div>
              <div className="dashboard-grid practice-evaluation-grid" style={{ gridTemplateColumns: '1fr 2fr', marginBottom: '1.5rem' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Award size={40} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score</span>
                  <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)' }}>{evaluation.score}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>out of {evaluation.totalMarks} marks</span>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    <span style={{ fontWeight: 600 }}>Performance: {Math.round((evaluation.score / evaluation.totalMarks) * 100)}%</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Score logged to update your syllabus heatmap accuracy tracker.
                  </p>
                </div>
              </div>
              <div className="markdown-body" style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <MarkdownRenderer content={evaluation.feedback} />
              </div>

              {/* AI Error Analyst addition */}
              {!errorAnalysis ? (
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    className="btn-primary" 
                    onClick={handleAnalyzeErrors} 
                    disabled={isAnalyzingErrors}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
                  >
                    {isAnalyzingErrors ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        <span>Analyzing Conceptual Errors…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Run AI Error Analysis & Action Plan</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', textAlign: 'left' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '1.1rem', fontWeight: 700 }}>
                    <AlertCircle size={20} /> Identified Gaps & Weak Areas
                  </h4>
                  
                  {/* Weak Topics Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {errorAnalysis.weakTopics?.map((topic, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                          color: '#ef4444', 
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '0.35rem 0.8rem', 
                          borderRadius: '50px', 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        ⚠️ {topic}
                      </span>
                    ))}
                  </div>

                  {/* Detailed Analysis */}
                  <div className="markdown-body" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', borderLeft: '4px solid #ef4444' }}>
                    <MarkdownRenderer content={errorAnalysis.detailedAnalysis} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: QUICK PRACTICE ────────────────────────────────────────────── */}
      {activeSubTab === 'quick-practice' && (
        <div>
          {!qpQuestions && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Zap size={28} style={{ color: 'var(--primary)' }} />
                <div>
                  <h3 style={{ margin: 0 }}>Quick Practice / PYQ Drill</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pick your chapters, question type and count. Get targeted CBSE-quality questions instantly.</p>
                </div>
              </div>

              {/* Chapter multi-select */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Select Chapters (leave all unchecked = Full Syllabus)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {chaptersForSubject.map(ch => {
                    const sel = qpSelectedChapters.includes(ch);
                    return (
                      <button key={ch} onClick={() => toggleQpChapter(ch)}
                        style={{
                          padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '50px',
                          border: `1px solid ${sel ? 'var(--primary)' : 'var(--border-color)'}`,
                          backgroundColor: sel ? 'var(--primary)' : 'var(--bg-app)',
                          color: sel ? '#fff' : 'var(--text-primary)',
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}>
                        {ch}
                      </button>
                    );
                  })}
                </div>
                {qpSelectedChapters.length > 0 && (
                  <button onClick={() => setQpSelectedChapters([])}
                    style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                    Clear selection (use full syllabus)
                  </button>
                )}
              </div>

              {/* Question type */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Question Type</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {QUESTION_TYPES.map(t => (
                    <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.6rem 0.9rem', border: `1px solid ${qpType === t.key ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-sm)', backgroundColor: qpType === t.key ? 'var(--primary-light)' : 'var(--bg-app)' }}>
                      <input type="radio" name="qpType" value={t.key} checked={qpType === t.key} onChange={() => setQpType(t.key)} />
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.label}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{t.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span>Number of Questions</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{qpCount}</span>
                </label>
                <input type="range" min={5} max={25} step={5} value={qpCount} onChange={e => setQpCount(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>5 (Quick)</span><span>10</span><span>15</span><span>20</span><span>25 (Marathon)</span>
                </div>
              </div>

              <button className="btn-primary" onClick={handleGenerateQuickPractice} disabled={qpLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                {qpLoading ? <><RefreshCw className="animate-spin" size={16} /> Generating {qpCount} questions…</> : <><Zap size={16} /> Generate {qpCount} Practice Questions</>}
              </button>
            </div>
          )}

          {qpQuestions && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{subject} — {qpQuestions.questionType} Practice</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {qpQuestions.chapters} · {qpQuestions.questions.length} questions · {qpQuestions.totalMarks} marks total
                  </p>
                </div>
                <button className="btn-secondary" onClick={() => { setQpQuestions(null); setQpAnswers({}); setQpRevealed({}); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RotateCcw size={14} /> New Set
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {qpQuestions.questions.map((q, idx) => {
                  const isMCQ = !!q.options;
                  const isRevealed = qpRevealed[q.id];
                  return (
                    <div key={q.id} className="card" style={{ border: `1px solid ${isRevealed ? 'var(--success)' : 'var(--border-color)'}` }}>
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, minWidth: '2rem', fontSize: '0.95rem' }}>Q{idx + 1}.</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 500, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{q.question}</p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>[{q.marks} mark{q.marks > 1 ? 's' : ''}]</span>
                        </div>
                      </div>

                      {isMCQ ? (
                        <div className="practice-options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', paddingLeft: '2.75rem', marginBottom: '0.75rem' }}>
                          {q.options.map(opt => {
                            const isCorrect = opt === q.answer;
                            const isSelected = qpAnswers[q.id] === opt;
                            let bg = 'transparent', border = 'var(--border-color)', color = 'var(--text-primary)';
                            if (isRevealed && isCorrect) { bg = 'rgba(34,197,94,0.15)'; border = 'var(--success)'; color = 'var(--success)'; }
                            else if (isRevealed && isSelected && !isCorrect) { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; color = '#ef4444'; }
                            else if (!isRevealed && isSelected) { bg = 'var(--primary-light)'; border = 'var(--primary)'; }
                            return (
                              <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: isRevealed ? 'default' : 'pointer', padding: '0.45rem 0.65rem', border: `1px solid ${border}`, borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', backgroundColor: bg, color }}>
                                <input type="radio" name={q.id} value={opt} disabled={isRevealed} checked={isSelected}
                                  onChange={() => setQpAnswers({ ...qpAnswers, [q.id]: opt })} />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <textarea className="input-control" rows={4}
                          placeholder="Write your answer here…"
                          style={{ width: '100%', fontSize: '0.9rem', marginBottom: '0.75rem' }}
                          value={qpAnswers[q.id] || ''}
                          onChange={e => setQpAnswers({ ...qpAnswers, [q.id]: e.target.value })} />
                      )}

                      {!isRevealed && (
                        <button onClick={() => setQpRevealed({ ...qpRevealed, [q.id]: true })}
                          style={{ border: '1px solid var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.85rem', fontSize: '0.82rem', cursor: 'pointer', marginLeft: '2.75rem' }}>
                          {isMCQ ? 'Show Answer' : 'I\'m done — Show Model Answer'}
                        </button>
                      )}

                      {isRevealed && q.answer && (
                        <div style={{ marginLeft: '2.75rem', padding: '0.6rem 0.9rem', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.87rem', color: 'var(--text-primary)' }}>
                          <span style={{ fontWeight: 700, color: 'var(--success)' }}>✅ Correct Answer: </span>{q.answer}
                        </div>
                      )}
                      {isRevealed && !q.answer && (
                        <div style={{ marginLeft: '2.75rem', padding: '0.6rem 0.9rem', backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', fontSize: '0.87rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>📝 Model Answer: </span>Refer NCERT for this topic. Key points: define the concept clearly, include formula with units, and draw diagram if applicable.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: FLASHCARDS ────────────────────────────────────────────────── */}
      {activeSubTab === 'flashcards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header & Controls bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={22} style={{ color: 'var(--primary)' }} /> Spaced Repetition Study Deck
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Active Subject: <strong style={{ color: 'var(--primary)' }}>{subject}</strong>
              </p>
            </div>
            
            {/* Control actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Chapter:</label>
                <select className="input-control" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', minWidth: '180px' }} value={fcChapter} onChange={e => { setFcChapter(e.target.value); setCurrentCardIndex(0); setIsFlipped(false); }}>
                  <option value="All Chapters">All Chapters</option>
                  {chaptersForSubject.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>

              <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => setIsModalOpen(true)}>
                <Plus size={16} /> Add Card
              </button>

              <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={handleAiGenerateCards} disabled={isGeneratingCards}>
                {isGeneratingCards ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> AI Generate Cards
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Leitner Box Filters Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { id: 'All', label: 'All Cards', desc: 'Full Deck' },
              { id: 1, label: 'Box 1: Daily', desc: 'Immediate Focus' },
              { id: 2, label: 'Box 2: 3-Days', desc: 'Short Term' },
              { id: 3, label: 'Box 3: Weekly', desc: 'Long Term / Mastered' }
            ].map(box => {
              const active = selectedBox === box.id;
              const count = getBoxCount(box.id);
              return (
                <div key={box.id} onClick={() => { setSelectedBox(box.id); setCurrentCardIndex(0); setIsFlipped(false); }}
                  style={{
                    backgroundColor: active ? 'var(--primary-light)' : 'var(--bg-card)',
                    border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: active ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                  }}
                  className="card-glowing">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: active ? 'var(--primary)' : 'var(--text-primary)' }}>{box.label}</span>
                    <span style={{
                      backgroundColor: count > 0 ? (active ? 'var(--primary)' : 'var(--border-color)') : 'transparent',
                      color: count > 0 ? (active ? '#fff' : 'var(--text-secondary)') : 'var(--text-secondary)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '50px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>{count}</span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{box.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Card Showcase Area */}
          <div style={{ maxWidth: '600px', width: '100%', margin: '1rem auto' }}>
            {filteredFlashcards.length > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Box: <strong style={{ color: 'var(--primary)' }}>Box {filteredFlashcards[currentCardIndex]?.box || 1}</strong>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Card {currentCardIndex + 1} of {filteredFlashcards.length}
                  </span>
                </div>
                
                <div className={`flashcard-box ${isFlipped ? 'flipped' : ''}`} style={{ height: '240px', position: 'relative' }}>
                  <div className="flashcard-inner">
                    {/* Front of Card */}
                    <div className="flashcard-front" style={{ padding: '2rem 1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => setIsFlipped(true)}>
                      <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '0.5rem' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} 
                          title="Delete Card"
                          onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to delete this card?')) handleDeleteCard(filteredFlashcards[currentCardIndex]?._id); }}>
                          <Trash2 size={16} style={{ transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--danger)'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'} />
                        </button>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                          <MarkdownRenderer content={filteredFlashcards[currentCardIndex]?.question} />
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em' }}>
                        👉 CLICK TO FLIP &amp; REVEAL ANSWER
                      </span>
                    </div>

                    {/* Back of Card */}
                    <div className="flashcard-back" style={{ padding: '2rem 1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => setIsFlipped(false)}>
                      <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '0.5rem' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          title="Delete Card"
                          onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to delete this card?')) handleDeleteCard(filteredFlashcards[currentCardIndex]?._id); }}>
                          <Trash2 size={16} style={{ transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--danger)'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'} />
                        </button>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflowY: 'auto' }}>
                        <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          <MarkdownRenderer content={filteredFlashcards[currentCardIndex]?.answer} />
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.05em' }}>
                        👈 CLICK TO FLIP BACK
                      </span>
                    </div>
                  </div>
                </div>

                {/* Leitner Actions */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <button className="btn-secondary" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem' }}
                    onClick={() => handleFlashcardReview(filteredFlashcards[currentCardIndex]?._id, false)}>
                    <AlertTriangle size={16} /> Got it Wrong (Box 1)
                  </button>
                  <button className="btn-primary" style={{ backgroundColor: 'var(--success)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem' }}
                    onClick={() => handleFlashcardReview(filteredFlashcards[currentCardIndex]?._id, true)}>
                    <CheckCircle2 size={16} /> Got it Right (Box Up)
                  </button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <BookOpen size={40} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <h4 style={{ margin: 0 }}>No cards found here</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {selectedBox === 'All' 
                      ? `There are no study cards for ${subject} ${fcChapter !== 'All Chapters' ? `- ${fcChapter}` : ''} yet.`
                      : `No cards inside Box ${selectedBox} for this scope.`}
                  </p>
                </div>
                {selectedBox === 'All' ? (
                  <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1.2rem' }} onClick={handleAiGenerateCards}>
                    <Sparkles size={14} /> Generate 5 AI Flashcards
                  </button>
                ) : (
                  <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }} onClick={() => setSelectedBox('All')}>
                    View All Cards
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Modal Custom Form */}
          {isModalOpen && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div className="card" style={{ maxWidth: '450px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>Add Custom Study Card</h4>
                  <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setIsModalOpen(false)}>&times;</button>
                </div>
                <form onSubmit={handleAddCustomCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Subject</label>
                    <input className="input-control" value={subject} disabled style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }} />
                  </div>
                  
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Chapter</label>
                    <select className="input-control" value={fcChapter === 'All Chapters' ? chaptersForSubject[0] || 'General' : fcChapter} 
                      onChange={e => setFcChapter(e.target.value)}>
                      {chaptersForSubject.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Question</label>
                    <textarea className="input-control" rows={3} placeholder="e.g., State Faraday's First Law of Electrolysis." required value={newQuestion} onChange={e => setNewQuestion(e.target.value)} />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Answer / Explanation</label>
                    <textarea className="input-control" rows={3} placeholder="e.g., Mass deposited at an electrode is proportional to charge passed: $m = z\\cdot I \\cdot t$." required value={newAnswer} onChange={e => setNewAnswer(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn-primary">Save Flashcard</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
