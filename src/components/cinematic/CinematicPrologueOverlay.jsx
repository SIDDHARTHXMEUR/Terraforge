import React, { useState, useEffect, useRef } from 'react';

const MANIFEST_URL = '/prologue/manifest.json';

const PROLOGUE_CLIPS = [
  {
    id: 'sun',
    file: 'sun.mp4',
    file720: 'sun_720p.mp4',
    title: 'SOL',
    credit: 'NASA / Goddard Space Flight Center / SDO AIA 304 Å',
    start: 1.0,
    end: 3.0
  },
  {
    id: 'earth',
    file: 'earth-night.mp4',
    file720: 'earth-night_720p.mp4',
    title: 'EARTH',
    credit: 'NASA Earth Observatory / Suomi NPP VIIRS Day-Night Band',
    start: 3.0,
    end: 5.0
  },
  {
    id: 'mars',
    file: 'mars.mp4',
    file720: 'mars_720p.mp4',
    title: 'MARS',
    credit: 'NASA / Goddard Space Flight Center / MAVEN IUVS',
    start: 5.0,
    end: 7.0
  },
  {
    id: 'jupiter',
    file: 'jupiter.mp4',
    file720: 'jupiter_720p.mp4',
    title: 'JUPITER',
    credit: 'NASA / ESA / Goddard Space Flight Center / Hubble Heritage Team',
    start: 7.0,
    end: 9.0
  },
  {
    id: 'saturn',
    file: 'saturn.mp4',
    file720: 'saturn_720p.mp4',
    title: 'SATURN',
    credit: 'NASA / JPL-Caltech / Goddard Space Flight Center / Cassini CIRS',
    start: 9.0,
    end: 11.0
  }
];

export function CinematicPrologueOverlay({
  isActive = true,
  onSkip
}) {
  const [elapsed, setElapsed] = useState(0);
  const [isFallbackMode, setIsFallbackMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isSaveData = navigator.connection?.saveData === true;
    const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const urlParams = new URLSearchParams(window.location.search);
    return isSaveData || isReducedMotion || urlParams.get('fallback') === '1';
  });
  const [videoPlayingMap, setVideoPlayingMap] = useState({});

  const videoRefs = useRef({});
  const probeResolvedRef = useRef(false);

  // Check user environment (saveData or prefers-reduced-motion or test query)
  useEffect(() => {
    const isSaveData = navigator.connection?.saveData === true;
    const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isFallbackParam = urlParams?.get('fallback') === '1';
    if (isSaveData || isReducedMotion || isFallbackParam) {
      setIsFallbackMode(true);
    }
  }, []);

  // Probe video availability on mount
  useEffect(() => {
    let isMounted = true;

    const probeVideo = (url) => {
      return new Promise((resolve) => {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.muted = true;
        const onCanPlay = () => { cleanup(); resolve(true); };
        const onError = () => { cleanup(); resolve(false); };
        const cleanup = () => {
          v.removeEventListener('loadeddata', onCanPlay);
          v.removeEventListener('canplay', onCanPlay);
          v.removeEventListener('error', onError);
          v.src = '';
        };
        v.addEventListener('loadeddata', onCanPlay);
        v.addEventListener('canplay', onCanPlay);
        v.addEventListener('error', onError);
        v.src = url;
        setTimeout(() => { cleanup(); resolve(false); }, 1800);
      });
    };

    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1280;

    Promise.all(
      PROLOGUE_CLIPS.slice(0, 3).map((c) => {
        const fileName = isSmallScreen && c.file720 ? c.file720 : c.file;
        return probeVideo(`/prologue/${fileName}`);
      })
    ).then((results) => {
      if (!isMounted) return;
      probeResolvedRef.current = true;
      const playable = results.filter(Boolean).length;
      if (playable < 3) {
        setIsFallbackMode(true);
      }
    }).catch(() => {
      if (isMounted) setIsFallbackMode(true);
    });

    const timeout = setTimeout(() => {
      if (isMounted && !probeResolvedRef.current) {
        setIsFallbackMode(true);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  // Skip trigger listeners (pointerdown, keydown, wheel)
  useEffect(() => {
    if (!isActive) return;

    const handleSkip = () => {
      if (onSkip) onSkip();
    };

    window.addEventListener('pointerdown', handleSkip);
    window.addEventListener('keydown', handleSkip);
    window.addEventListener('wheel', handleSkip, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleSkip);
      window.removeEventListener('keydown', handleSkip);
      window.removeEventListener('wheel', handleSkip);
    };
  }, [isActive, onSkip]);

  // Master Clock: 14.5s for reel mode, 5.0s for fallback mode
  useEffect(() => {
    if (!isActive) return;

    const startTime = performance.now();
    const maxDuration = isFallbackMode ? 5.0 : 14.5;

    const interval = setInterval(() => {
      const sec = (performance.now() - startTime) / 1000;
      setElapsed(sec);

      if (sec >= maxDuration) {
        clearInterval(interval);
        if (onSkip) onSkip();
      }
    }, 33);

    return () => clearInterval(interval);
  }, [isActive, isFallbackMode, onSkip]);

  // Expose state for telemetry / automated test verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__prologueElapsed = elapsed;
      window.__prologueIsActive = isActive;
      window.__prologueFallback = isFallbackMode;
    }
  }, [elapsed, isActive, isFallbackMode]);

  // Manage video playback across master clock beats
  useEffect(() => {
    if (isFallbackMode) return;

    PROLOGUE_CLIPS.forEach((clip) => {
      const el = videoRefs.current[clip.id];
      if (!el) return;

      const isCurrent = elapsed >= clip.start && elapsed < clip.end;

      if (isCurrent) {
        if (el.paused) {
          el.play().catch(() => {
            // Autoplay rejection: fall back immediately
            setIsFallbackMode(true);
          });
        }
      } else {
        if (!el.paused && elapsed > clip.end) {
          el.pause();
        }
      }
    });
  }, [elapsed, isFallbackMode]);

  if (!isActive) return null;

  // Active clip identification
  let activeClip = null;
  let clipLocalTime = 0;
  if (!isFallbackMode) {
    activeClip = PROLOGUE_CLIPS.find((c) => elapsed >= c.start && elapsed < c.end) || null;
    if (activeClip) {
      clipLocalTime = elapsed - activeClip.start;
    }
  }

  const isCurrentVideoPlaying = activeClip ? !!videoPlayingMap[activeClip.id] : false;

  // Caption alpha and blur transitions (0.35s in, 0.35s out)
  let captionOpacity = 0;
  let captionBlur = 6;
  if (activeClip && isCurrentVideoPlaying && !isFallbackMode) {
    if (clipLocalTime < 0.35) {
      captionOpacity = clipLocalTime / 0.35;
      captionBlur = (1 - captionOpacity) * 6;
    } else if (clipLocalTime > 1.65) {
      captionOpacity = Math.max(0, (2.0 - clipLocalTime) / 0.35);
      captionBlur = (1 - captionOpacity) * 6;
    } else {
      captionOpacity = 1;
      captionBlur = 0;
    }
  }

  // Wordmark Stage
  // Reel mode: 11.0s to 12.8s. Fallback mode: 1.2s to 4.4s
  const isWordmarkStage = isFallbackMode
    ? elapsed >= 1.2 && elapsed < 4.4
    : elapsed >= 11.0 && elapsed < 12.8;

  const wordmarkAlpha = isFallbackMode
    ? (elapsed < 2.0
        ? (elapsed - 1.2) / 0.8
        : (elapsed > 3.6 ? Math.max(0, (4.4 - elapsed) / 0.8) : 1.0))
    : (elapsed < 11.5
        ? (elapsed - 11.0) / 0.5
        : (elapsed > 12.2 ? Math.max(0, (12.8 - elapsed) / 0.6) : 1.0));

  // Letterbox retracts during live handoff
  const isHandingOff = isFallbackMode ? elapsed >= 3.5 : elapsed >= 12.5;
  const letterboxHeightVh = isFallbackMode
    ? (isHandingOff ? Math.max(0, (1.0 - (elapsed - 3.5) / 1.5) * 13) : 13)
    : (isHandingOff ? Math.max(0, (1.0 - (elapsed - 12.5) / 1.8) * 13) : 13);

  // Black curtain opacity:
  // Reel mode: starts opaque, fades out between 12.5s and 14.5s
  // Fallback mode: stars fade in between 0s and 1.5s
  const blackCurtainOpacity = isFallbackMode
    ? Math.max(0, 1.0 - elapsed / 1.5)
    : (isHandingOff ? Math.max(0, 1.0 - (elapsed - 12.5) / 1.5) : 1.0);

  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1280;

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-40 overflow-hidden font-sans"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${blackCurtainOpacity})`,
        transition: 'background-color 0.2s ease-out'
      }}
    >
      {/* 1. Stacked Video Reel Players with CSS Film Grade */}
      {!isFallbackMode && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            filter: 'contrast(1.12) saturate(0.88)'
          }}
        >
          {PROLOGUE_CLIPS.map((clip) => {
            const fileName = isSmallScreen && clip.file720 ? clip.file720 : clip.file;
            const isCurrent = elapsed >= clip.start && elapsed < clip.end;

            // Cross-dissolve opacity (0.4s fade-in, 0.4s fade-out)
            let videoOpacity = 0;
            if (isCurrent) {
              const localT = elapsed - clip.start;
              if (localT < 0.4) {
                videoOpacity = localT / 0.4;
              } else if (localT > 1.6) {
                videoOpacity = Math.max(0, (2.0 - localT) / 0.4);
              } else {
                videoOpacity = 1;
              }
            }

            return (
              <video
                key={clip.id}
                ref={(el) => { videoRefs.current[clip.id] = el; }}
                src={`/prologue/${fileName}`}
                preload="auto"
                muted
                playsInline
                onPlaying={() => setVideoPlayingMap((m) => ({ ...m, [clip.id]: true }))}
                onPause={() => setVideoPlayingMap((m) => ({ ...m, [clip.id]: false }))}
                onError={() => setVideoPlayingMap((m) => ({ ...m, [clip.id]: false }))}
                onTimeUpdate={(e) => {
                  if (e.target.currentTime > 0.05 && !videoPlayingMap[clip.id]) {
                    setVideoPlayingMap((m) => ({ ...m, [clip.id]: true }));
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
                style={{ opacity: videoOpacity }}
              />
            );
          })}

          {/* Subtle Vignette & Grain */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_50%,rgba(0,0,0,0.65)_100%)]" />
          <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:3px_3px]" />
        </div>
      )}

      {/* 2. Captions: SHOWS ONLY WHILE VIDEO FRAME IS ACTUALLY PLAYING (Zero black captions ever) */}
      {activeClip && isCurrentVideoPlaying && !isFallbackMode && (
        <div
          className="absolute z-40 pointer-events-none transition-all duration-300"
          style={{
            bottom: '15vh',
            left: '3.5rem',
            opacity: captionOpacity,
            filter: `blur(${captionBlur}px)`
          }}
        >
          <h2 className="font-serif text-3xl sm:text-5xl font-light tracking-[0.16em] text-white uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
            {activeClip.title}
          </h2>
          <div className="w-8 h-[1px] bg-[#4FD1C5] my-2 opacity-80" />
          <p className="font-sans text-[11px] sm:text-[12px] font-light tracking-[0.08em] text-white/80 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            {activeClip.credit}
          </p>
        </div>
      )}

      {/* 3. Wordmark Beat (League Gothic, Cream, Real-Time Solar System Simulator) */}
      {isWordmarkStage && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center pointer-events-none transition-opacity duration-500 px-4"
          style={{ opacity: wordmarkAlpha }}
        >
          <span className="text-[10px] sm:text-[11px] font-sans tracking-[0.4em] uppercase text-white/50 mb-3">
            REAL-TIME SOLAR SYSTEM SIMULATOR
          </span>
          <h1
            className="font-wordmark text-6xl sm:text-8xl md:text-9xl text-[#FFF8E7] uppercase leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]"
            style={{
              letterSpacing: `${0.08 + (isFallbackMode ? (elapsed - 1.2) * 0.03 : (elapsed - 11.0) * 0.04)}em`
            }}
          >
            TERRAFORGE
          </h1>
        </div>
      )}

      {/* 4. Letterbox Bars (2.39:1 Aspect Ratio) */}
      <div
        className="absolute top-0 inset-x-0 bg-black z-30 transition-all duration-700 ease-out pointer-events-none"
        style={{ height: `${letterboxHeightVh}vh` }}
      />
      <div
        className="absolute bottom-0 inset-x-0 bg-black z-30 transition-all duration-700 ease-out pointer-events-none"
        style={{ height: `${letterboxHeightVh}vh` }}
      />

      {/* 5. Plain-Text Skip Button (Top-Right) */}
      <div className="absolute top-6 right-8 z-50 pointer-events-auto">
        <button
          onClick={onSkip}
          className="text-white/40 hover:text-white transition-colors cursor-pointer font-mono text-[11px] tracking-[0.25em] uppercase px-3 py-1.5"
          title="Skip Intro (Click, Key or Scroll)"
        >
          SKIP
        </button>
      </div>
    </div>
  );
}
