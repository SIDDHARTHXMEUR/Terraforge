import React from 'react';

/**
 * Universal TERRAFORGE Wordmark Component
 * Standardized: League Gothic, cream #FFF8E7, 18px, tracking 0.25em
 */
export function Wordmark({ className = '', onClick }) {
  const Component = onClick ? 'button' : 'span';
  return (
    <Component
      onClick={onClick}
      className={`font-wordmark text-[18px] tracking-[0.25em] text-[#FFF8E7] uppercase select-none leading-none ${className}`}
      style={{
        fontFamily: "'League Gothic', sans-serif",
        letterSpacing: '0.25em',
        color: '#FFF8E7',
        fontSize: '18px'
      }}
    >
      TERRAFORGE
    </Component>
  );
}

export default Wordmark;
