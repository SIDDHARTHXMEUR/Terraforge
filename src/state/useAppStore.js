import { create } from 'zustand';
import { PRESETS } from '../data/presets';
import { PLANETS_DATA } from '../data/planetsData';

export const useAppStore = create((set, get) => ({
  // Active Navigation View
  activeView: 'explorer',
  setActiveView: (view) => set({ activeView: view }),

  // Selected Celestial Body ('overview' | 'sun' | 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune')
  selectedBody: 'overview',
  setSelectedBody: (bodyId) => {
    set({ selectedBody: bodyId });
  },

  // Explorer Viewing Mode
  viewMode: 'scientific', // 'cinematic' | 'scientific' | 'educational' | 'mission'
  setViewMode: (mode) => set({ viewMode: mode }),

  // Time acceleration multiplier
  timeSpeed: 1.0,
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),

  // Preserved 3D Simulation Controls (Earth/Climate)
  sim: {
    temp: PRESETS.earth.temp,
    cloudCoverage: PRESETS.earth.cloudCoverage,
    atmosphereIntensity: PRESETS.earth.atmosphereIntensity,
    rotationSpeed: PRESETS.earth.rotationSpeed,
    isPlaying: true
  },
  updateSim: (key, value) => set((state) => ({
    activePreset: 'custom',
    sim: { ...state.sim, [key]: value }
  })),

  // Preserved Transform Controls
  transform: {
    posX: 0,
    posY: 0,
    posZ: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    composite: false,
    showAxes: false,
    gizmoMode: 'translate',
    showGizmo: true
  },
  updateTransform: (key, value) => set((state) => ({
    transform: { ...state.transform, [key]: value }
  })),
  resetTransform: () => set((state) => ({
    transform: {
      ...state.transform,
      posX: 0,
      posY: 0,
      posZ: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1
    }
  })),

  // Preserved Presets
  activePreset: 'earth',
  applyPreset: (presetKey) => {
    const target = PRESETS[presetKey];
    if (!target) return;
    set((state) => ({
      activePreset: presetKey,
      sim: {
        ...state.sim,
        temp: target.temp,
        cloudCoverage: target.cloudCoverage,
        atmosphereIntensity: target.atmosphereIntensity,
        rotationSpeed: target.rotationSpeed
      }
    }));
  },

  // UI Drawers & Overlays
  activeDrawer: null,
  toggleDrawer: (name) => set((state) => ({
    activeDrawer: state.activeDrawer === name ? null : name
  })),

  isTrueScale: false,
  toggleTrueScale: () => set((state) => ({ isTrueScale: !state.isTrueScale })),

  showOrbits: true,
  toggleShowOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),

  cameraMode: 'perspective',
  toggleCameraMode: () => set((state) => ({
    cameraMode: state.cameraMode === 'perspective' ? 'orthographic' : 'perspective'
  })),

  cameraResetCount: 0,
  triggerCameraReset: () => set((state) => ({
    cameraResetCount: state.cameraResetCount + 1,
    elapsedDays: 0
  })),

  elapsedDays: 0,
  setElapsedDays: (days) => set({ elapsedDays: days }),

  // User Settings & API Credentials
  nasaApiKey: localStorage.getItem('terraforge_nasa_api_key') || 'DEMO_KEY',
  setNasaApiKey: (key) => {
    localStorage.setItem('terraforge_nasa_api_key', key);
    set({ nasaApiKey: key });
  },

  geminiApiKey: localStorage.getItem('terraforge_gemini_api_key') || '',
  setGeminiApiKey: (key) => {
    localStorage.setItem('terraforge_gemini_api_key', key);
    set({ geminiApiKey: key });
  },

  units: 'metric', // 'metric' | 'imperial'
  toggleUnits: () => set((state) => ({
    units: state.units === 'metric' ? 'imperial' : 'metric'
  })),

  // Simulation Lab Records & History
  simulationHistory: [],
  addSimulationRecord: (record) => set((state) => ({
    simulationHistory: [
      { id: Date.now().toString(), timestamp: new Date().toISOString(), ...record },
      ...state.simulationHistory.slice(0, 49) // Keep last 50
    ]
  }))
}));

