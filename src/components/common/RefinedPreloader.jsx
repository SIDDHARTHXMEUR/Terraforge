import React from 'react';

/**
 * Refined Preloader
 * - League Gothic cream wordmark + 1px progress line driven by real loading progress
 * - Fades out on the first rendered frame (transition: opacity 600ms)
 * - Never shows black or empty canvas
 */
export function RefinedPreloader({ progress = 100, isReady = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#04060B] select-none pointer-events-none transition-opacity duration-600 ease-out"
      style={{
        opacity: isReady ? 0 : 1,
        pointerEvents: isReady ? 'none' : 'auto',
        transitionDuration: '600ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      <div className="flex flex-col items-center">
        {/* League Gothic Wordmark */}
        <span className="font-wordmark text-4xl sm:text-5xl text-[#FFF8E7] tracking-[0.25em] uppercase">
          TERRAFORGE
        </span>

        {/* 1px Progress Line */}
        <div className="w-44 sm:w-56 h-[1px] bg-[#FFF8E7]/15 mt-6 relative overflow-hidden">
          <div
            className="h-full bg-[#FFF8E7] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
