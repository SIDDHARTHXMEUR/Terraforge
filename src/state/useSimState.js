import { useState, useRef, useCallback, useEffect } from 'react';
import { PRESETS } from '../data/presets';

export function useSimState() {
  // Transform State
  const [transform, setTransform] = useState({
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
  });

  // Simulation Controls State
  const [sim, setSim] = useState({
    temp: PRESETS.earth.temp,
    cloudCoverage: PRESETS.earth.cloudCoverage,
    atmosphereIntensity: PRESETS.earth.atmosphereIntensity,
    rotationSpeed: PRESETS.earth.rotationSpeed,
    isPlaying: true
  });

  // Active Preset ID
  const [activePreset, setActivePreset] = useState('earth');

  // Active Drawer ('transform' | 'sim' | 'viva' | null)
  const [activeDrawer, setActiveDrawer] = useState(null);

  // True Scale Mode Toggle
  const [isTrueScale, setIsTrueScale] = useState(false);

  // Show Orbits & Rotation Axis Overlay Toggle (off by default)
  const [showOrbits, setShowOrbits] = useState(false);

  // Camera State
  const [cameraMode, setCameraMode] = useState('perspective');
  const [cameraResetCount, setCameraResetCount] = useState(0);
  const [cameraPunchCount, setCameraPunchCount] = useState(0);

  // Simulated Elapsed Days State
  const [elapsedDays, setElapsedDays] = useState(0);

  // Lerp Animation Ref
  const lerpAnimationRef = useRef(null);

  // Apply Preset with ~1.5s Lerp Interpolation
  const applyPreset = useCallback((presetKey) => {
    const target = PRESETS[presetKey];
    if (!target) return;

    setActivePreset(presetKey);

    if (lerpAnimationRef.current) {
      cancelAnimationFrame(lerpAnimationRef.current);
    }

    const duration = 1500;
    const startTime = performance.now();
    const startSim = { ...sim };

    const animateLerp = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setSim((prev) => ({
        ...prev,
        temp: startSim.temp + (target.temp - startSim.temp) * ease,
        cloudCoverage: startSim.cloudCoverage + (target.cloudCoverage - startSim.cloudCoverage) * ease,
        atmosphereIntensity: startSim.atmosphereIntensity + (target.atmosphereIntensity - startSim.atmosphereIntensity) * ease,
        rotationSpeed: startSim.rotationSpeed + (target.rotationSpeed - startSim.rotationSpeed) * ease,
      }));

      if (progress < 1) {
        lerpAnimationRef.current = requestAnimationFrame(animateLerp);
      } else {
        lerpAnimationRef.current = null;
      }
    };

    lerpAnimationRef.current = requestAnimationFrame(animateLerp);
  }, [sim]);

  useEffect(() => {
    return () => {
      if (lerpAnimationRef.current) {
        cancelAnimationFrame(lerpAnimationRef.current);
      }
    };
  }, []);

  const updateTransform = (key, value) => {
    setTransform((prev) => ({ ...prev, [key]: value }));
  };

  const updateSim = (key, value) => {
    setActivePreset('custom');
    setSim((prev) => ({ ...prev, [key]: value }));
  };

  const resetTransform = () => {
    setTransform((prev) => ({
      ...prev,
      posX: 0,
      posY: 0,
      posZ: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1
    }));
  };

  const toggleDrawer = (drawerName) => {
    setActiveDrawer((prev) => (prev === drawerName ? null : drawerName));
  };

  const toggleTrueScale = () => {
    setIsTrueScale((prev) => !prev);
  };

  const toggleShowOrbits = () => {
    setShowOrbits((prev) => !prev);
  };

  const toggleCameraMode = () => {
    setCameraMode((prev) => (prev === 'perspective' ? 'orthographic' : 'perspective'));
  };

  const triggerCameraReset = () => {
    setCameraResetCount((prev) => prev + 1);
    setElapsedDays(0);
  };

  return {
    transform,
    updateTransform,
    resetTransform,
    sim,
    updateSim,
    activePreset,
    applyPreset,
    activeDrawer,
    toggleDrawer,
    isTrueScale,
    toggleTrueScale,
    showOrbits,
    toggleShowOrbits,
    cameraMode,
    toggleCameraMode,
    cameraResetCount,
    triggerCameraReset,
    cameraPunchCount,
    elapsedDays,
    setElapsedDays
  };
}
