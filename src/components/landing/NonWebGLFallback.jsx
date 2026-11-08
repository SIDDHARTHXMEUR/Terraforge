import React from 'react';
import { CHAPTERS_DATA, computeChapterStats } from './ChapterOverlay';

export function NonWebGLFallback() {
  return (
    <div className="w-full min-h-screen bg-[#04060B] text-[#FFF8E7] px-6 py-12 select-text font-sans">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex items-center justify-between border-b border-cream-14 pb-6 mb-12">
        <span className="font-wordmark text-2xl tracking-[0.25em] uppercase text-[#FFF8E7]">
          TERRAFORGE
        </span>
        <a
          href="#/sim"
          className="font-sans text-xs uppercase tracking-[0.2em] text-[#FFF8E7]/70 hover:text-[#FFF8E7]"
        >
          SIMULATOR
        </a>
      </header>

      {/* Hero Block */}
      <div className="max-w-4xl mx-auto text-center py-16 border-b border-cream-14">
        <div className="font-sans text-[11px] uppercase tracking-[0.5em] text-[#FFF8E7]/60 mb-4">
          REAL-TIME SOLAR SYSTEM SIMULATOR
        </div>
        <h1 className="font-wordmark text-7xl sm:text-9xl uppercase tracking-[0.1em] text-[#FFF8E7] leading-none mb-4">
          TERRAFORGE
        </h1>
        <p className="font-sans text-sm sm:text-base tracking-[0.2em] text-[#FFF8E7]/80 uppercase mb-8">
          EVERY ORBIT. EVERY WORLD. IN REAL TIME.
        </p>
        <a
          href="#/sim"
          className="inline-block px-8 py-3 border border-white/40 hover:border-white font-sans text-xs uppercase tracking-widest transition-colors"
        >
          ENTER SIMULATOR &gt;
        </a>
      </div>

      {/* Chapters list with computed stats & textures */}
      <div className="max-w-5xl mx-auto py-12 space-y-24">
        {CHAPTERS_DATA.map((ch) => {
          const stats = computeChapterStats(ch);
          return (
            <div
              key={ch.id}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-cream-14 pb-16"
            >
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span
                    className="w-[2px] h-[14px] inline-block"
                    style={{ backgroundColor: ch.accent }}
                  />
                  <span className="font-sans text-[11px] uppercase tracking-[0.5em] text-[#FFF8E7]/60">
                    {ch.microLabel}
                  </span>
                </div>
                <h2 className="font-serif text-5xl uppercase tracking-[0.12em] text-[#FFF8E7] mb-4">
                  {ch.name}
                </h2>
                <p className="font-sans text-sm leading-relaxed text-[#FFF8E7]/80 max-w-md mb-6">
                  {stats.description}
                </p>
                <a
                  href={`#/sim/${ch.planetKey === 'sun' ? 'overview' : ch.planetKey}`}
                  className="font-sans text-xs uppercase tracking-widest text-[#FFF8E7]/70 hover:text-white border-b border-transparent hover:border-white/40 pb-1"
                >
                  EXPLORE {ch.name} &gt;
                </a>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-cream-14">
                  <div>
                    <div className="font-mono text-lg" style={{ color: ch.accent }}>{stats.distStr}</div>
                    <div className="font-sans text-[9px] uppercase tracking-wider text-[#FFF8E7]/60">DIST FROM SUN</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg" style={{ color: ch.accent }}>{stats.lightTimeStr}</div>
                    <div className="font-sans text-[9px] uppercase tracking-wider text-[#FFF8E7]/60">LIGHT TIME</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg" style={{ color: ch.accent }}>{stats.yearStr}</div>
                    <div className="font-sans text-[9px] uppercase tracking-wider text-[#FFF8E7]/60">YEAR LENGTH</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg uppercase" style={{ color: ch.accent }}>{stats.typeStr}</div>
                    <div className="font-sans text-[9px] uppercase tracking-wider text-[#FFF8E7]/60">PLANET TYPE</div>
                  </div>
                </div>
              </div>

              {/* Texture Image Fallback */}
              <div className="flex justify-center items-center">
                <img
                  src={ch.surfaceStrip?.image || `/assets/planets/${ch.planetKey === 'sun' ? 'sun/sun.jpg' : `${ch.planetKey}/${ch.planetKey}.jpg`}`}
                  alt={ch.name}
                  className="w-72 h-72 object-cover rounded-full border border-cream-14 shadow-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
