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

// A lightweight, highly robust regex-based Markdown & Math renderer
export default function MarkdownRenderer({ content, isAi }) {
  if (!content) return null;

  const formatText = (text) => {
    if (!text) return '';
    
    let parts = [text];

    // 1. Parse Block/Inline Math Equations ($...$ and $$...$$)
    // We replace $$equation$$ with a block div, and $equation$ with an inline span
    // To make it look attractive, we apply KaTeX formulas
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
        return subPart;
      });

      return <span key={index}>{subParts}</span>;
    });
  };

  const lines = content.split(/\r?\n/);
  const elements = [];

  let paragraphLines = [];
  let listItems = [];
  let listType = null; // 'ul' or 'ol'
  let blockquoteLines = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      elements.push(
        <p key={`p-${elements.length}`} style={{ lineHeight: 1.6, color: isAi ? 'var(--ai-text-primary)' : 'var(--text-secondary)', marginBottom: '0.85rem' }}>
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
          key={`list-${elements.length}`} 
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
          key={`alert-${elements.length}`} 
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
        <h4 key={`h4-${elements.length}`} style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', color: isAi ? 'var(--ai-text-heading)' : 'var(--primary)' }}>
          {formatText(trimmed.replace(/^####\s*/, ''))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('###')) {
      flushAll();
      elements.push(
        <h3 key={`h3-${elements.length}`} style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.75rem', color: isAi ? 'var(--ai-text-heading)' : 'var(--primary)' }}>
          {formatText(trimmed.replace(/^###\s*/, ''))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('##')) {
      flushAll();
      elements.push(
        <h2 key={`h2-${elements.length}`} style={{ fontSize: '1.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginTop: '1rem', color: isAi ? 'var(--ai-text-heading)' : 'var(--text-primary)' }}>
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

  return (
    <div className="markdown-renderer" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {elements}
    </div>
  );
}
