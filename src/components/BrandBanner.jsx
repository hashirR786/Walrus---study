import React from 'react';

export default function BrandBanner({ size = 'large', style = {} }) {
  const isMobile = size === 'small';
  
  const bannerStyle = {
    backgroundColor: '#2A2D28',
    padding: isMobile ? '0.35rem 0.75rem' : '0.65rem 1rem',
    borderRadius: isMobile ? '8px' : '12px',
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0.5rem' : '0.75rem',
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    ...style
  };

  const iconSize = isMobile ? '28px' : '42px';
  const iconRadius = isMobile ? '6px' : '9px';

  return (
    <div style={bannerStyle} className="brand-banner">
      {/* Icon: Rounded square with white background */}
      <div style={{
        width: iconSize,
        height: iconSize,
        backgroundColor: '#ffffff',
        borderRadius: iconRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: isMobile ? '4px' : '6px',
        boxSizing: 'border-box'
      }}>
        {/* Minimal line-art walrus illustration, outline only, no fills */}
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          {/* Head Dome */}
          <path 
            d="M 28,54 C 28,22 72,22 72,54" 
            stroke="#2A2D28" 
            strokeWidth="6.5" 
            strokeLinecap="round" 
            fill="none"
          />
          {/* Muzzle (Mustache/whiskers loops) */}
          <path 
            d="M 28,54 A 11 11 0 0 0 50,54 A 11 11 0 0 0 72,54" 
            stroke="#2A2D28" 
            strokeWidth="6.5" 
            strokeLinecap="round" 
            fill="none"
          />
          {/* Left Tusk (Outline only) */}
          <path 
            d="M 43,54 L 43,76 C 43,79 45,79 45,76 L 47,54" 
            stroke="#2A2D28" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
          {/* Right Tusk (Outline only) */}
          <path 
            d="M 57,54 L 57,76 C 57,79 55,79 55,76 L 53,54" 
            stroke="#2A2D28" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
          {/* Eyes */}
          <circle cx="42.5" cy="37" r="3.5" fill="#2A2D28" />
          <circle cx="57.5" cy="37" r="3.5" fill="#2A2D28" />
        </svg>
      </div>

      {/* Typography: "Cram" and "by Walrus" */}
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.1' }}>
        <span style={{
          fontSize: isMobile ? '1.1rem' : '1.4rem',
          fontWeight: '800',
          color: '#FBF9F5', // Cream/off-white
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '-0.02em',
          textTransform: 'none'
        }}>
          Cram
        </span>
        <span style={{
          fontSize: isMobile ? '0.55rem' : '0.65rem',
          fontWeight: '500',
          color: '#FBF9F5', // Cream/off-white
          opacity: 0.4, // 40% opacity
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '0.04em'
        }}>
          by Walrus
        </span>
      </div>
    </div>
  );
}
