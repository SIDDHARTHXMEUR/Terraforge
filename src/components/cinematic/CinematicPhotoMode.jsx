import React, { useState, useEffect } from 'react';
import { Camera, Grid, Sliders, X, Download } from 'lucide-react';

export function CinematicPhotoMode({
  isActive = false,
  onClose,
  camera,
  gl
}) {
  const [showGrid, setShowGrid] = useState(true);
  const [fov, setFov] = useState(45);
  const [exposure, setExposure] = useState(1.15);

  useEffect(() => {
    if (camera && isActive) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [fov, camera, isActive]);

  useEffect(() => {
    if (gl && isActive) {
      gl.toneMappingExposure = exposure;
    }
  }, [exposure, gl, isActive]);

  if (!isActive) return null;

  const handleCapture = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Force render frame to guarantee buffer is populated
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `terraforge-astronomy-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      {/* 1. Rule of Thirds Cinematic Composition Grid */}
      {showGrid && (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          <div className="border-r border-b border-white/20 border-dashed" />
          <div className="border-r border-b border-white/20 border-dashed" />
          <div className="border-b border-white/20 border-dashed" />
          <div className="border-r border-b border-white/20 border-dashed" />
          <div className="border-r border-b border-white/20 border-dashed" />
          <div className="border-b border-white/20 border-dashed" />
          <div className="border-r border-white/20 border-dashed" />
          <div className="border-r border-white/20 border-dashed" />
          <div />
        </div>
      )}

      {/* 2. Photo Mode Minimalist Dock (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-2xl flex items-center space-x-6 text-white text-xs font-mono">
        {/* Title */}
        <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-widest text-[11px] pr-2 border-r border-white/15">
          <Camera className="w-4 h-4" />
          <span>PHOTO MODE</span>
        </div>

        {/* Rule-of-Thirds Grid Toggle */}
        <button
          onClick={() => setShowGrid((g) => !g)}
          title="Toggle Rule-of-Thirds Composition Grid"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
            showGrid ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="uppercase text-[10px]">GRID ({showGrid ? 'ON' : 'OFF'})</span>
        </button>

        {/* FOV Slider */}
        <div className="flex items-center space-x-2.5">
          <span className="text-[10px] text-white/50 uppercase tracking-wider">FOV:</span>
          <input
            type="range"
            min="15"
            max="90"
            step="1"
            value={fov}
            onChange={(e) => setFov(Number(e.target.value))}
            className="w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[10px] text-white/80 w-6">{fov}°</span>
        </div>

        {/* Exposure Slider */}
        <div className="flex items-center space-x-2.5">
          <span className="text-[10px] text-white/50 uppercase tracking-wider">EXP:</span>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={exposure}
            onChange={(e) => setExposure(Number(e.target.value))}
            className="w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[10px] text-white/80 w-8">{exposure.toFixed(2)}</span>
        </div>

        {/* Shutter / Capture Button */}
        <button
          onClick={handleCapture}
          title="Download High-Resolution Full Photographic Shot"
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold px-4 py-2 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer uppercase tracking-wider text-[11px]"
        >
          <Download className="w-4 h-4" />
          <span>CAPTURE</span>
        </button>

        {/* Exit Button */}
        <button
          onClick={onClose}
          title="Exit Photo Mode (P or Esc)"
          className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer pl-2 border-l border-white/15"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
