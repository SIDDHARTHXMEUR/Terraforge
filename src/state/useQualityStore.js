import { create } from 'zustand';

let lastDprChangeTime = 0;

export const useQualityStore = create((set, get) => ({
  preset: 'auto', // 'auto' | 'high' | 'low'
  dpr: typeof window !== 'undefined' && window.devicePixelRatio ? Math.min(1.5, window.devicePixelRatio) : 1.0,
  effectiveQuality: 'high', // 'high' | 'low'
  fps: 60,

  setPreset: (preset) => {
    let dpr = 1.0;
    let eff = 'low';
    if (preset === 'high') {
      dpr = 1.5;
      eff = 'high';
    } else if (preset === 'low') {
      dpr = 1.0;
      eff = 'low';
    } else {
      // auto default
      dpr = 1.5;
      eff = 'high';
    }
    set({ preset, dpr, effectiveQuality: eff });
  },

  reportFps: (currentFps) => {
    const { preset, effectiveQuality } = get();
    set({ fps: currentFps });

    if (preset !== 'auto') return;

    // Hysteresis: at most one change per 2s, and none during a flight
    const now = performance.now();
    if (now - lastDprChangeTime < 2000) return;
    if (typeof window !== 'undefined' && window.__isTransitioning) return;

    if (currentFps < 32 && effectiveQuality === 'high') {
      lastDprChangeTime = now;
      // Auto-throttle to low quality
      set({ dpr: 1.0, effectiveQuality: 'low' });
    } else if (currentFps > 54 && effectiveQuality === 'low') {
      lastDprChangeTime = now;
      // Auto-restore to high quality
      set({ dpr: 1.5, effectiveQuality: 'high' });
    }
  }
}));
