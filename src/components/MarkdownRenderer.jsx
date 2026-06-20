import React from 'react';

// KaTeX Renderer Subcomponent for safe LaTeX rendering
const KatexRenderer = ({ formula, displayMode }) => {
  const containerRef = React.useRef(null);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (containerRef.current) {
      if (window.katex) {
        try {
          window.katex.render(formula, containerRef.current, {
            displayMode,
            throwOnError: false,
          });
          setHasError(false);
        } catch (err) {
          console.error('KaTeX rendering error:', err);
          setHasError(true);
        }
      } else {
        setHasError(true);
      }
    }
  }, [formula, displayMode]);

  if (hasError || !window.katex) {
    return displayMode ? (
      <div 
        className="math-block fallback" 
        style={{ 
          margin: '1.25rem 0', 
          textAlign: 'center', 
          fontFamily: '"Times New Roman", Times, serif', 
          fontSize: '1.25rem',
          fontStyle: 'italic',
          padding: '0.75rem',
          backgroundColor: 'var(--bg-card-hover)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          overflowX: 'auto'
        }}
      >
        {formula}
      </div>
    ) : (
      <span 
        className="math-inline fallback"
        style={{ 
          fontFamily: '"Times New Roman", Times, serif', 
          fontSize: '1.1rem', 
          fontStyle: 'italic',
          padding: '0 0.2rem',
          fontWeight: '500'
        }}
      >
        {formula}
      </span>
    );
  }

  return <span ref={containerRef} />;
};

// ChatGPT-style dark code block component
const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayLang = language
    ? language.charAt(0).toUpperCase() + language.slice(1)
    : 'Code';

  return (
    <div style={{
      backgroundColor: '#0d0d0d',
      borderRadius: '0.6rem',
      border: '1px solid #333',
      overflow: 'hidden',
      margin: '0.75rem 0',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #2a2a2a',
        padding: '0.5rem 1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Dot decorations */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f57', display: 'inline-block' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#febc2e', display: 'inline-block' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#28c840', display: 'inline-block' }} />
          </div>
          <span style={{
            color: '#aaa',
            fontSize: '0.78rem',
            fontWeight: 600,
            fontFamily: 'monospace',
            marginLeft: '0.5rem',
            textTransform: 'lowercase'
          }}>
            {language ? `<> ${displayLang}` : '<> code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          title="Copy code"
          style={{
            background: 'none',
            border: '1px solid #333',
            borderRadius: '0.3rem',
            color: copied ? '#28c840' : '#aaa',
            cursor: 'pointer',
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '0.2rem 0.55rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
        >
          {copied ? (
            <>
              <span>✓</span> Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      {/* Code body */}
      <pre style={{
        margin: 0,
        padding: '1.1rem 1.2rem',
        overflowX: 'auto',
        backgroundColor: '#0d0d0d',
        color: '#e0e0e0',
        fontSize: '0.85rem',
        lineHeight: 1.7,
        fontFamily: '"Fira Code", "Cascadia Code", "Consolas", "Source Code Pro", monospace',
        whiteSpace: 'pre',
        wordBreak: 'normal',
      }}>
        <code style={{ color: '#e0e0e0', fontFamily: 'inherit' }}>
          {code}
        </code>
      </pre>
    </div>
  );
};

// A lightweight, highly robust regex-based Markdown & Math renderer
export default function MarkdownRenderer({ content, isAi }) {
  if (!content) return null;

  const formatText = (text) => {
    if (!text) return '';
    
    let parts = [text];

    // 1. Parse Block/Inline Math Equations ($...$ and $$...$$)
    const mathRegex = /(\$\$.*?\$\$|\$.*?\$)/g;
    
    return text.split(mathRegex).map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2).trim();
        return (
          <div 
            key={index} 
            className="math-block" 
            style={{ 
              margin: '1.25rem 0', 
              textAlign: 'center', 
              padding: '0.75rem',
              backgroundColor: 'var(--bg-card-hover)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              overflowX: 'auto'
            }}
          >
            <KatexRenderer formula={formula} displayMode={true} />
          </div>
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1).trim();
        return (
          <KatexRenderer key={index} formula={formula} displayMode={false} />
        );
      }

      // 2. Parse Bold (**text**)
      const boldRegex = /(\*\*.*?\*\*)/g;
      const subParts = part.split(boldRegex).map((subPart, subIndex) => {
        if (subPart.startsWith('**') && subPart.endsWith('**')) {
          return <strong key={subIndex} style={{ color: isAi ? 'var(--ai-text-bold)' : 'var(--text-primary)', fontWeight: '700' }}>{subPart.slice(2, -2)}</strong>;
        }
        // 3. Parse inline code (`code`)
        const inlineCodeRegex = /(`[^`]+`)/g;
        const codeParts = subPart.split(inlineCodeRegex).map((codePart, codeIdx) => {
          if (codePart.startsWith('`') && codePart.endsWith('`')) {
            return (
              <code
                key={codeIdx}
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#e0e0e0',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  padding: '0.1rem 0.4rem',
                  fontSize: '0.85em',
                  fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace'
                }}
              >
                {codePart.slice(1, -1)}
              </code>
            );
          }
          return codePart;
        });
        return <span key={subIndex}>{codeParts}</span>;
      });

      return <span key={index}>{subParts}</span>;
    });
  };

  // ── Pre-pass: split content into raw text segments and fenced code blocks ──
  // This allows the line-by-line parser below to only deal with non-code text.
  const segments = [];
  const fenceRegex = /^```(\w*)\s*$([\s\S]*?)^```\s*$/gm;
  let lastIndex = 0;
  let match;

  while ((match = fenceRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'code', language: match[1] || '', code: match[2].trimEnd() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) });
  }

  // If no fenced code blocks were found, treat entire content as text
  if (segments.length === 0) {
    segments.push({ type: 'text', content });
  }

  // ── Parse each text segment line-by-line ──
  const parseTextSegment = (textContent, keyOffset = 0) => {
    const elements = [];
    const lines = textContent.split(/\r?\n/);
    
    let paragraphLines = [];
    let listItems = [];
    let listType = null;
    let blockquoteLines = [];

    const flushParagraph = () => {
      if (paragraphLines.length > 0) {
        elements.push(
          <p key={`p-${keyOffset}-${elements.length}`} style={{ lineHeight: 1.6, color: isAi ? 'var(--ai-text-primary)' : 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            {formatText(paragraphLines.join(' '))}
          </p>
        );
        paragraphLines = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag 
            key={`list-${keyOffset}-${elements.length}`} 
            style={{ 
              paddingLeft: '1.25rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.4rem', 
              margin: '0.5rem 0',
              listStyleType: listType === 'ol' ? 'decimal' : 'disc' 
            }}
          >
            {listItems.map((item, idx) => (
              <li key={idx} style={{ lineHeight: 1.5, color: isAi ? 'var(--ai-text-primary)' : 'var(--text-secondary)' }}>
                {formatText(item)}
              </li>
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
      }
    };

    const flushBlockquote = () => {
      if (blockquoteLines.length > 0) {
        let alertType = 'note';
        let cleanLines = [];
        blockquoteLines.forEach(line => {
          const cleanLine = line.replace(/^>\s*/, '').trim();
          if (cleanLine.startsWith('[!NOTE]')) {
            alertType = 'note';
          } else if (cleanLine.startsWith('[!TIP]')) {
            alertType = 'tip';
          } else if (cleanLine.startsWith('[!WARNING]') || cleanLine.startsWith('[!CAUTION]')) {
            alertType = 'warning';
          } else if (cleanLine.startsWith('[!BOARD-EXAM]') || cleanLine.includes('Board Exam Alert')) {
            alertType = 'board-exam';
          } else {
            cleanLines.push(cleanLine);
          }
        });

        let alertBg = 'var(--primary-light)';
        let alertBorder = 'var(--primary)';
        let alertHeader = 'Note';

        if (alertType === 'tip') {
          alertBg = 'var(--success-light)';
          alertBorder = 'var(--success)';
          alertHeader = '💡 Study Tip';
        } else if (alertType === 'warning') {
          alertBg = 'var(--danger-light)';
          alertBorder = 'var(--danger)';
          alertHeader = '⚠️ Alert';
        } else if (alertType === 'board-exam') {
          alertBg = 'var(--warning-light)';
          alertBorder = 'var(--warning)';
          alertHeader = '🔥 Board Exam Focus';
        }

        elements.push(
          <div 
            key={`alert-${keyOffset}-${elements.length}`} 
            style={{
              backgroundColor: alertBg,
              borderLeft: `4px solid ${alertBorder}`,
              padding: '1rem',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              margin: '0.5rem 0',
              fontSize: '0.9rem'
            }}
          >
            <div style={{ fontWeight: 700, color: alertBorder, marginBottom: '0.25rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              {alertHeader}
            </div>
            <p style={{ margin: 0, color: isAi ? 'var(--ai-text-primary)' : 'var(--text-primary)', lineHeight: 1.5 }}>
              {formatText(cleanLines.join(' '))}
            </p>
          </div>
        );
        blockquoteLines = [];
      }
    };

    const flushAll = () => {
      flushParagraph();
      flushList();
      flushBlockquote();
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushAll();
        continue;
      }

      if (trimmed.startsWith('>')) {
        if (paragraphLines.length > 0 || listItems.length > 0) {
          flushParagraph();
          flushList();
        }
        blockquoteLines.push(line);
        continue;
      }

      if (trimmed.startsWith('####')) {
        flushAll();
        elements.push(
          <h4 key={`h4-${keyOffset}-${elements.length}`} style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', color: isAi ? 'var(--ai-text-heading)' : 'var(--primary)' }}>
            {formatText(trimmed.replace(/^####\s*/, ''))}
          </h4>
        );
        continue;
      }

      if (trimmed.startsWith('###')) {
        flushAll();
        elements.push(
          <h3 key={`h3-${keyOffset}-${elements.length}`} style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.75rem', color: isAi ? 'var(--ai-text-heading)' : 'var(--primary)' }}>
            {formatText(trimmed.replace(/^###\s*/, ''))}
          </h3>
        );
        continue;
      }

      if (trimmed.startsWith('##')) {
        flushAll();
        elements.push(
          <h2 key={`h2-${keyOffset}-${elements.length}`} style={{ fontSize: '1.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginTop: '1rem', color: isAi ? 'var(--ai-text-heading)' : 'var(--text-primary)' }}>
            {formatText(trimmed.replace(/^##\s*/, ''))}
          </h2>
        );
        continue;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (paragraphLines.length > 0 || blockquoteLines.length > 0) {
          flushParagraph();
          flushBlockquote();
        }
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(trimmed.replace(/^[-*]\s*/, ''));
        continue;
      }

      const matchOrdered = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (matchOrdered) {
        if (paragraphLines.length > 0 || blockquoteLines.length > 0) {
          flushParagraph();
          flushBlockquote();
        }
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(matchOrdered[2]);
        continue;
      }

      if (blockquoteLines.length > 0 || listItems.length > 0) {
        flushBlockquote();
        flushList();
      }
      paragraphLines.push(trimmed);
    }

    flushAll();
    return elements;
  };

  // ── Build final element list ──
  const finalElements = [];
  segments.forEach((seg, segIdx) => {
    if (seg.type === 'code') {
      finalElements.push(
        <CodeBlock key={`code-${segIdx}`} language={seg.language} code={seg.code} />
      );
    } else {
      const parsed = parseTextSegment(seg.content, segIdx * 1000);
      finalElements.push(...parsed);
    }
  });

  return (
    <div className="markdown-renderer" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {finalElements}
    </div>
  );
}
