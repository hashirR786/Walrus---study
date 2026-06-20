import React, { useState } from 'react';
import { BookOpen, FileText, Download, Sparkles, RefreshCw } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

import { API_BASE } from '../config';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Computer Science'];

const CHAPTERS_PRESET = {
  Physics: ['Electric Charges and Fields', 'Electrostatic Potential and Capacitance', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Ray Optics and Wave Optics'],
  Chemistry: ['Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Coordination Compounds'],
  Mathematics: ['Relations and Functions', 'Matrices', 'Continuity and Differentiability', 'Integrals'],
  Biology: ['Human Reproduction', 'Principles of Inheritance', 'Molecular Basis of Inheritance'],
  Economics: ['National Income Accounting', 'Money and Banking', 'Government Budget'],
  'Computer Science': [
    'Exception Handling',
    'File Handling',
    'Stack',
    'Queue',
    'Searching',
    'Sorting',
    'Database Concepts',
    'Structured Query Language (SQL)',
    'Computer Networks',
    'Data Communication and Network Security',
    'Interface Python with SQL (MySQL Connectivity)'
  ]
};

export default function Resources({ onActivityTriggered }) {
  const [activeTab, setActiveTab] = useState('textbooks'); // textbooks, formulas
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [chapter, setChapter] = useState('');
  
  // AI Notes states
  const [isLoading, setIsLoading] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState('');

  const handleGenerateNotes = async () => {
    if (!chapter) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, chapter })
      });
      const data = await res.json();
      setGeneratedNotes(data.notes);
      
      if (onActivityTriggered) {
        onActivityTriggered(3); // Award 3 minutes study time
      }
    } catch (err) {
      console.error(err);
      alert('Could not generate notes. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const textbooksMock = [
    { title: `${subject} NCERT Textbook Part I`, size: '14.2 MB' },
    { title: `${subject} NCERT Textbook Part II`, size: '12.8 MB' },
    { title: `${subject} NCERT Exemplar Problems`, size: '8.4 MB' },
    { title: `${subject} Marking Scheme Blueprint`, size: '2.1 MB' }
  ];

  return (
    <div className="glass-panel" style={{ maxWidth: '950px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={28} /> Study & Resource Hub
        </h2>

        {/* Inner Tabs switcher */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn-secondary ${activeTab === 'textbooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('textbooks')}
            style={{ 
              borderColor: activeTab === 'textbooks' ? 'var(--primary)' : 'var(--border-color)',
              backgroundColor: activeTab === 'textbooks' ? 'var(--primary-light)' : 'var(--bg-card)',
              color: activeTab === 'textbooks' ? 'var(--primary)' : 'var(--text-primary)'
            }}
          >
            NCERT PDFs & Exemplars
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'formulas' ? 'active' : ''}`}
            onClick={() => setActiveTab('formulas')}
            style={{ 
              borderColor: activeTab === 'formulas' ? 'var(--primary)' : 'var(--border-color)',
              backgroundColor: activeTab === 'formulas' ? 'var(--primary-light)' : 'var(--bg-card)',
              color: activeTab === 'formulas' ? 'var(--primary)' : 'var(--text-primary)'
            }}
          >
            AI Formula & Revision Notes
          </button>
        </div>
      </div>

      {/* Global Subject toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {SUBJECTS.map(sub => (
          <button
            key={sub}
            className="btn-secondary"
            style={{ 
              padding: '0.5rem 1rem', 
              fontSize: '0.85rem',
              backgroundColor: subject === sub ? 'var(--primary)' : 'var(--bg-card)',
              color: subject === sub ? '#fff' : 'var(--text-primary)',
              borderColor: subject === sub ? 'var(--primary)' : 'var(--border-color)'
            }}
            onClick={() => { 
              setSubject(sub); 
              setGeneratedNotes('');
              const chapters = CHAPTERS_PRESET[sub] || [];
              setChapter(chapters[0] || '');
            }}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* SECTION 1: NCERT DOWNLOADS LIST */}
      {activeTab === 'textbooks' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Official NCERT Textbook Documents</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Download PDFs direct from official servers. Ingested chapters are fully vectorized for tutor grounding.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {textbooksMock.map((doc, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={24} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{doc.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF • {doc.size}</span>
                  </div>
                </div>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => alert('Downloading file from ncert.nic.in ...')}>
                  <Download size={14} /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: AI FORMULA GENERATOR */}
      {activeTab === 'formulas' && (
        <div className="resources-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Configure Revision Sheet</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Select Chapter</label>
                <select className="input-control" value={chapter} onChange={(e) => setChapter(e.target.value)}>
                  {(CHAPTERS_PRESET[subject] || []).map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
              <button className="btn-primary" onClick={handleGenerateNotes} disabled={isLoading}>
                {isLoading ? <RefreshCw className="animate-spin" size={16} /> : 'Generate Revision Note'}
              </button>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} /> NCERT-Grounded Formula Sheet
            </h3>

            <div className="markdown-body" style={{ flex: 1, minHeight: '300px', maxHeight: '500px', overflowY: 'auto', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
              {generatedNotes ? (
                <MarkdownRenderer content={generatedNotes} />
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No notes generated yet. Select a chapter and click Generate!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
