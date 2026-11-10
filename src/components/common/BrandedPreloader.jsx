import React from 'react';
import { Wordmark } from './Wordmark';

/**
 * Universal Branded Preloader Component
 * League Gothic wordmark + 1px progress line driven by real loaded steps
 */
export function BrandedPreloader({
  progress = 0,
  isVisible = true,
  statusText = '',
  className = ''
}) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-700 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } ${className}`}
    >
      <div className="flex flex-col items-center select-none">
        {/* Universal League Gothic Wordmark */}
        <Wordmark className="text-[22px] tracking-[0.3em]" />

        {/* 1px Minimalist Progress Line */}
        <div className="w-48 h-[1px] bg-white/10 relative overflow-hidden mt-6">
          <div
            className="h-full bg-cream transition-all duration-300 ease-out"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        {/* Subtle status label */}
        {statusText && (
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40 mt-3">
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
}

export default BrandedPreloader;
