import React, { useState, useEffect, useRef } from 'react';

const MANIFEST_URL = '/prologue/manifest.json';

// Built-in fallback clip metadata in case manifest.json is unreachable
const DEFAULT_CLIPS = [
  {
    id: 'sun',
    file: 'sun.mp4',
    file720: 'sun_720p.mp4',
    poster: '/assets/planets/sun/sdo_aia_304_2k.jpg',
    title: 'SOL',
    credit: 'NASA / SDO AIA 304 Å Telemetry',
    start: 1.0,
    duration: 2.0
  },
  {
    id: 'earth',
    file: 'earth-night.mp4',
    file720: 'earth-night_720p.mp4',
    poster: '/assets/planets/earth/earth_albedo.jpg',
    title: 'EARTH',
    credit: 'NASA Earth Observatory / ISS Expedition Crew',
    start: 3.0,
    duration: 2.0
  },
  {
    id: 'mars',
    file: 'mars.mp4',
    file720: 'mars_720p.mp4',
    poster: '/assets/planets/mars/mars.jpg',
    title: 'MARS',
    credit: 'NASA / JPL-Caltech / MSSS / Mars Global Surveyor',
    start: 5.0,
    duration: 2.0
  },
  {
    id: 'jupiter',
    file: 'jupiter.mp4',
    file720: 'jupiter_720p.mp4',
    poster: '/assets/planets/jupiter/jupiter.jpg',
    title: 'JUPITER',
    credit: 'NASA / JPL-Caltech / SwRI / MSSS / JunoCam',
    start: 7.0,
    duration: 2.0
  },
  {
    id: 'saturn',
    file: 'saturn.mp4',
    file720: 'saturn_720p.mp4',
    poster: '/assets/planets/saturn/saturn.jpg',
    title: 'SATURN',
    credit: 'NASA / JPL-Caltech / Space Science Institute / Cassini',
    start: 9.0,
    duration: 2.0
  }
];

export function CinematicPrologueOverlay({
  isActive = true,
  onSkip
}) {
  const [elapsed, setElapsed] = useState(0);
  const [clips, setClips] = useState(DEFAULT_CLIPS);
  const [videoPlayableCount, setVideoPlayableCount] = useState(0);
  const [usePostersOnly, setUsePostersOnly] = useState(false);

  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const currentSlotRef = useRef('A');
  const lastClipIndexRef = useRef(-1);

  // Check user environment (saveData or prefers-reduced-motion)
  useEffect(() => {
    const isSaveData = navigator.connection?.saveData === true;
    const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (isSaveData || isReducedMotion) {
      setUsePostersOnly(true);
    }
  }, []);

  // Fetch manifest and probe clip availability
  useEffect(() => {
    let isMounted = true;
    fetch(MANIFEST_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (!isMounted) return;
        const list = data?.clips?.length ? data.clips : DEFAULT_CLIPS;
        setClips(list);

        // Probe availability of clips
        let playable = 0;
        const isSmallScreen = window.innerWidth < 1280;

        await Promise.all(
          list.map(async (c) => {
            const fileName = isSmallScreen && c.file720 ? c.file720 : c.file;
            try {
              const headRes = await fetch(`/prologue/${fileName}`, { method: 'HEAD' });
              if (headRes.ok) playable++;
            } catch {
              // Video file not present on disk
            }
          })
        );

        if (isMounted) {
          setVideoPlayableCount(playable);
          // If fewer than 3 clips load, fall back cleanly
          if (playable < 3) {
            setUsePostersOnly(true);
          }
        }
      })
      .catch(() => {
        if (isMounted) setUsePostersOnly(true);
      });

    return () => {
      isMounted = false;
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

  // Master Clock: 14.5s ceiling (always ends $\le$ 15s)
  useEffect(() => {
    if (!isActive) return;

    const startTime = performance.now();
    const interval = setInterval(() => {
      const sec = (performance.now() - startTime) / 1000;
      setElapsed(sec);

      if (sec >= 14.5) {
        clearInterval(interval);
        if (onSkip) onSkip();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isActive, onSkip]);

  // Determine current active beat and clip
  // Beats:
  // 0 - 1.0s: Black with 2.39:1 letterbox bars
  // 1.0 - 3.0s: Sun (Clip 0)
  // 3.0 - 5.0s: Earth (Clip 1)
  // 5.0 - 7.0s: Mars (Clip 2)
  // 7.0 - 9.0s: Jupiter (Clip 3)
  // 9.0 - 11.0s: Saturn (Clip 4)
  // 11.0 - 12.5s: Fade to black, TERRAFORGE wordmark
  // 12.5 - 14.5s: Live overview fades in, letterbox opens
  let activeClipIndex = -1;
  let clipLocalTime = 0;

  if (elapsed >= 1.0 && elapsed < 3.0) {
    activeClipIndex = 0;
    clipLocalTime = elapsed - 1.0;
  } else if (elapsed >= 3.0 && elapsed < 5.0) {
    activeClipIndex = 1;
    clipLocalTime = elapsed - 3.0;
  } else if (elapsed >= 5.0 && elapsed < 7.0) {
    activeClipIndex = 2;
    clipLocalTime = elapsed - 5.0;
  } else if (elapsed >= 7.0 && elapsed < 9.0) {
    activeClipIndex = 3;
    clipLocalTime = elapsed - 7.0;
  } else if (elapsed >= 9.0 && elapsed < 11.0) {
    activeClipIndex = 4;
    clipLocalTime = elapsed - 9.0;
  }

  const currentClip = activeClipIndex >= 0 && activeClipIndex < clips.length ? clips[activeClipIndex] : null;

  // Manage cross-dissolve between two stacked video elements
  useEffect(() => {
    if (usePostersOnly || !currentClip || activeClipIndex === lastClipIndexRef.current) return;
    lastClipIndexRef.current = activeClipIndex;

    const isSmallScreen = window.innerWidth < 1280;
    const fileName = isSmallScreen && currentClip.file720 ? currentClip.file720 : currentClip.file;
    const nextSlot = currentSlotRef.current === 'A' ? 'B' : 'A';
    const activeEl = currentSlotRef.current === 'A' ? videoRefA.current : videoRefB.current;
    const nextEl = nextSlot === 'A' ? videoRefA.current : videoRefB.current;

    if (nextEl) {
      nextEl.src = `/prologue/${fileName}`;
      nextEl.currentTime = 0;
      nextEl.play().catch(() => {
        // Autoplay policy or missing file: fall back smoothly
      });
      nextEl.style.opacity = '1';
    }
    if (activeEl) {
      activeEl.style.opacity = '0';
    }
    currentSlotRef.current = nextSlot;
  }, [activeClipIndex, currentClip, usePostersOnly]);

  if (!isActive) return null;

  // Caption alpha and blur transitions (0.3s enter, 0.3s exit)
  let captionOpacity = 0;
  let captionBlur = 6;
  if (currentClip) {
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

  // Wordmark Stage (11.0s to 12.5s)
  const isWordmarkStage = elapsed >= 11.0 && elapsed < 12.8;
  const wordmarkAlpha = isWordmarkStage
    ? (elapsed < 11.5
        ? (elapsed - 11.0) / 0.5
        : (elapsed > 12.2 ? Math.max(0, (12.8 - elapsed) / 0.6) : 1.0))
    : 0;

  // Letterbox retracts during hand-off (12.5s to 14.5s)
  const isHandingOff = elapsed >= 12.5;
  const letterboxHeightVh = isHandingOff
    ? Math.max(0, (1.0 - (elapsed - 12.5) / 1.8) * 11)
    : 11; // 2.39:1 aspect ratio bars

  // Black curtain opacity: starts opaque, fades out between 12.5s and 14.5s
  const blackCurtainOpacity = isHandingOff
    ? Math.max(0, 1.0 - (elapsed - 12.5) / 1.5)
    : 1.0;

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-40 overflow-hidden font-sans"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${blackCurtainOpacity})`,
        transition: 'background-color 0.2s ease-out'
      }}
    >
      {/* 1. Stacked Video Reel Players with CSS Film Grade */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          filter: 'contrast(1.12) saturate(0.88)'
        }}
      >
        {/* Slot A */}
        <video
          ref={videoRefA}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none opacity-0"
        />
        {/* Slot B */}
        <video
          ref={videoRefB}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none opacity-0"
        />

        {/* Poster Image Fallback (When clips are missing, saveData, or reduced motion) */}
        {usePostersOnly && currentClip && (
          <div
            key={currentClip.id}
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out"
            style={{
              backgroundImage: `url('${currentClip.poster}')`,
              transform: `scale(${1.0 + clipLocalTime * 0.025})`,
              opacity: captionOpacity
            }}
          />
        )}

        {/* Subtle Vignette & Grain */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_50%,rgba(0,0,0,0.65)_100%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:3px_3px]" />
      </div>

      {/* 2. Captions: Serif Name + Inter Credit Line (Bottom-Left, Above Letterbox) */}
      {currentClip && (
        <div
          className="absolute bottom-[14vh] left-8 sm:left-14 z-40 pointer-events-none transition-all duration-300"
          style={{
            opacity: captionOpacity,
            filter: `blur(${captionBlur}px)`
          }}
        >
          <h2 className="font-serif text-3xl sm:text-5xl font-light tracking-[0.16em] text-white uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
            {currentClip.title}
          </h2>
          <div className="w-6 h-[1px] bg-[#4FD1C5] my-2 opacity-80" />
          <p className="font-sans text-[11px] sm:text-[12px] font-light tracking-[0.08em] text-white/70">
            {currentClip.credit}
          </p>
        </div>
      )}

      {/* 3. Wordmark Beat (11.0s to 12.5s) */}
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
              letterSpacing: `${0.08 + (elapsed - 11.0) * 0.04}em`
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
