import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SolarSystemEngine } from './components/cinematic/SolarSystemEngine';
import { CinematicUI } from './components/cinematic/CinematicUI';
import { LoadingScreen } from './components/LoadingScreen';
import { useAppStore } from './state/useAppStore';
import { ALL_CELESTIAL_BODIES } from './data/planetsData';

export default function App() {
  const {
    setSelectedBody,
    sim,
    updateSim,
    triggerCameraReset
  } = useAppStore();

  const [isCinematicTour, setIsCinematicTour] = useState(false);
  const [showOrbits, setShowOrbits] = useState(false); // Disabled by default for cinematic cleanliness

  // Keyboard Navigation: Space (Pause), O (Orbits), R (Reset), 0-9 (Planet shortcuts)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        updateSim('isPlaying', !sim.isPlaying);
      } else if (e.key === 'r' || e.key === 'R') {
        triggerCameraReset();
      } else if (e.key === 'o' || e.key === 'O') {
        setShowOrbits((prev) => !prev);
      } else if (e.key === '0') {
        setIsCinematicTour(false);
        setSelectedBody('overview');
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < ALL_CELESTIAL_BODIES.length) {
          setIsCinematicTour(false);
          setSelectedBody(ALL_CELESTIAL_BODIES[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sim.isPlaying, updateSim, triggerCameraReset, setSelectedBody]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none">
      {/* 3D WebGL Canvas Viewport with Filmic Tone Mapping */}
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          className="w-full h-full cursor-grab active:cursor-grabbing bg-black"
          gl={{
            antialias: true,
            alpha: false,
            logarithmicDepthBuffer: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2
          }}
        >
          <SolarSystemEngine
            isCinematicTour={isCinematicTour}
            showOrbits={showOrbits}
          />
        </Canvas>
      </Suspense>

      {/* Minimal, Sophisticated Cinematic Interface */}
      <CinematicUI
        isCinematicTour={isCinematicTour}
        setIsCinematicTour={setIsCinematicTour}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
      />
    </div>
  );
}
