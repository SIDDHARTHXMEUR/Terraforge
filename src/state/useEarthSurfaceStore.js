import { create } from 'zustand';

export const EARTH_LANDMARKS = [
  { id: 'nyc', name: 'New York', lat: 40.7128, lon: -74.0060, desc: 'Manhattan, Hudson River & Central Park' },
  { id: 'london', name: 'London', lat: 51.5074, lon: -0.1278, desc: 'Thames, Big Ben & Greenwich Meridian' },
  { id: 'tokyo', name: 'Tokyo', lat: 35.6762, lon: 139.6503, desc: 'Tokyo Bay, Shinjuku & Kanto Plain' },
  { id: 'dubai', name: 'Dubai', lat: 25.2048, lon: 55.2708, desc: 'Burj Khalifa, Palm Jumeirah & Arabian Coast' }
];

export const useEarthSurfaceStore = create((set, get) => ({
  // True when camera is below the surface altitude threshold (~5.2 units distance)
  isSurfaceMode: false,
  setIsSurfaceMode: (isSurface) => set({ isSurfaceMode: isSurface }),

  // Real-time calculated altitude in kilometers above Earth's surface
  altitudeKm: 12000,
  setAltitudeKm: (km) => set({ altitudeKm: Math.max(0.01, km) }),

  // Current surface focus point (lat/lon)
  focusedLocation: { lat: 40.7128, lon: -74.0060, name: 'New York' },
  setFocusedLocation: (loc) => set({ focusedLocation: loc }),

  // Tier 2 3D Tiles State:
  // 'dormant'     -> in orbit, no requests made
  // 'requesting'  -> descending below threshold, checking root tileset once
  // 'active'      -> root tileset loaded and active
  // 'unavailable' -> token missing, forbidden, quota exhausted, or network error
  tier2Status: 'dormant',
  setTier2Status: (status) => set({ tier2Status: status }),
  tier2ErrorReason: '',
  setTier2ErrorReason: (reason) => set({ tier2ErrorReason: reason }),

  // Strict session gate: root 3D tileset requested strictly ONCE per session
  hasRequestedTier2Session: false,
  markTier2Requested: () => set({ hasRequestedTier2Session: true }),

  // Programmatic smooth flight requests (e.g. clicking landmark or double clicking surface)
  flyToTarget: null,
  triggerFlyTo: (target) => set({ flyToTarget: { ...target, timestamp: Date.now() } }),
  clearFlyTo: () => set({ flyToTarget: null }),

  // Return to orbit trigger counter
  returnToOrbitCounter: 0,
  triggerReturnToOrbit: () => set((s) => ({ returnToOrbitCounter: s.returnToOrbitCounter + 1, isSurfaceMode: false }))
}));
