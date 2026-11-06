import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Film
} from 'lucide-react';
import { CINEMATIC_SCENES } from '../../data/cinematicScenes';
import { cosmicAudio } from '../../services/cosmicAudio';

export function CinematicFilmOverlay({
  currentSceneIndex = 0,
  sceneProgress = 0,
  isFilmPlaying = true,
  setIsFilmPlaying,
  onSelectScene,
  onNextScene,
  onPrevScene,
  isAudioMuted = true,
  setIsAudioMuted
}) {
  const [uiVisible, setUiVisible] = useState(true);
  const [userActivityTimer, setUserActivityTimer] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentScene = CINEMATIC_SCENES[currentSceneIndex] || CINEMATIC_SCENES[0];

  // Auto-hide UI during film playback when idle
  useEffect(() => {
    let timeout;
    const handleActivity = () => {
      setUiVisible(true);
      clearTimeout(timeout);
      if (isFilmPlaying) {
        timeout = setTimeout(() => {
          setUiVisible(false);
        }, 3500);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isFilmPlaying]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    cosmicAudio.setMuted(nextMuted);
    if (!nextMuted) {
      cosmicAudio.setSceneAudio(currentScene.id);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between overflow-hidden">
      {/* 1. Cinematic Letterbox Borders (Top & Bottom Anamorphic Ratio) */}
      <div className="w-full h-8 sm:h-12 bg-black/95 z-20 pointer-events-auto flex items-center justify-between px-6 transition-opacity duration-700">
        <div className="flex items-center space-x-3">
          <Film className="w-4 h-4 text-cyan-400 opacity-80" />
          <span className="text-[11px] uppercase tracking-[0.28em] font-mono font-medium text-white/90">
            TERRAFORGE <span className="text-white/40">|</span> SOLAR SYSTEM ODYSSEY
          </span>
        </div>

        {/* Minimal status indicator */}
        <div className="flex items-center space-x-4">
          <div className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
            SCENE {currentScene.number} / {CINEMATIC_SCENES.length}
          </div>
          <button
            onClick={toggleFullscreen}
            className="text-white/50 hover:text-white transition-colors"
            title="Toggle IMAX Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Scene Title & Scientific Documentary Narration Card (Fades in per scene) */}
      <div className="flex-1 flex flex-col justify-end pb-24 sm:pb-28 px-8 sm:px-16 max-w-4xl">
        <div
          className={`transition-all duration-1000 transform ${
            uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Act / Scene Number */}
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-xs font-mono font-bold tracking-[0.3em] text-cyan-400 uppercase">
              ACT {currentScene.number}
            </span>
            <span className="w-12 h-[1px] bg-white/20"></span>
            <span className="text-[11px] font-mono tracking-wider text-white/50 uppercase">
              {currentScene.subtitle}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.2em] text-white uppercase mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            {currentScene.title}
          </h1>

          {/* Scientific Narration Subtext */}
          <p className="text-xs sm:text-sm text-gray-300/85 font-light leading-relaxed max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            {currentScene.narration}
          </p>
        </div>
      </div>

      {/* 3. Bottom Cinematic Film Strip & Playback Transport (Fades when idle) */}
      <div
        className={`w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-6 pb-6 px-6 pointer-events-auto transition-opacity duration-700 ${
          uiVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Timeline Progress Bar across entire 12-scene odyssey */}
        <div className="w-full max-w-5xl mx-auto mb-4">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden flex">
            {CINEMATIC_SCENES.map((sc, idx) => {
              const isPast = idx < currentSceneIndex;
              const isCurrent = idx === currentSceneIndex;
              const widthPct = `${(1 / CINEMATIC_SCENES.length) * 100}%`;

              return (
                <div
                  key={sc.id}
                  style={{ width: widthPct }}
                  className="h-full border-r border-black/40 relative cursor-pointer"
                  onClick={() => onSelectScene(idx)}
                  title={`Jump to Scene ${sc.number}: ${sc.title}`}
                >
                  <div
                    className={`h-full transition-all duration-150 ${
                      isPast
                        ? 'bg-cyan-500/80'
                        : isCurrent
                        ? 'bg-cyan-400'
                        : 'bg-transparent hover:bg-white/20'
                    }`}
                    style={isCurrent ? { width: `${Math.min(100, Math.max(0, sceneProgress * 100))}%` } : {}}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Playback Controls & Scene Quick Jumps */}
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
          {/* Left: Previous / Play / Next Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onPrevScene}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Previous Scene (Left Arrow)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFilmPlaying(!isFilmPlaying)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center space-x-2 text-xs font-mono uppercase tracking-wider backdrop-blur-md transition-all shadow-lg"
              title="Play / Pause Journey (Space)"
            >
              {isFilmPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                  <span>Pause Film</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                  <span>Resume Film</span>
                </>
              )}
            </button>

            <button
              onClick={onNextScene}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Next Scene (Right Arrow)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Scene Quick Jump Pills */}
          <div className="hidden lg:flex items-center space-x-1.5 overflow-x-auto py-1">
            {CINEMATIC_SCENES.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => onSelectScene(idx)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono tracking-wider uppercase transition-all ${
                  idx === currentSceneIndex
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,242,254,0.2)]'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {sc.title}
              </button>
            ))}
          </div>

          {/* Right: Audio Ambience & UI Visibility */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full border transition-all ${
                isAudioMuted
                  ? 'border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                  : 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10 shadow-[0_0_12px_rgba(0,242,254,0.2)]'
              }`}
              title={isAudioMuted ? 'Enable Cosmic Sound Atmosphere' : 'Mute Sound'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setUiVisible(!uiVisible)}
              className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Toggle HUD (H)"
            >
              {uiVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

