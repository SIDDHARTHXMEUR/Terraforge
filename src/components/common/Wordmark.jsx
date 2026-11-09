import React from 'react';

/**
 * Shared Wordmark Component
 * Bit-for-bit identical branding used by both Landing Page and Simulator HUD
 * League Gothic, cream #FFF8E7, letter-spacing 0.25em, subtle brighten on hover
 */
export function Wordmark({ className = '', href, onClick }) {
  const content = (
    <span className={`font-wordmark text-[20px] sm:text-[22px] tracking-[0.25em] text-[#FFF8E7] uppercase select-none transition-colors duration-200 hover:text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] ${className}`}>
      TERRAFORGE
    </span>
  );

  if (href || onClick) {
    return (
      <a
        href={href || '#/'}
        onClick={onClick}
        className="cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/40"
      >
        {content}
      </a>
    );
  }

  return content;
}
