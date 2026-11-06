import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SolarSystemEngine } from './components/cinematic/SolarSystemEngine';
import { InteractiveSimulatorHUD } from './components/cinematic/InteractiveSimulatorHUD';
import { LoadingScreen } from './components/LoadingScreen';

const KEY_TO_BODY = {
  '1': 'sun',
  '2': 'mercury',
  '3': 'venus',
  '4': 'earth',
  '5': 'mars',
  '6': 'asteroids',
  '7': 'jupiter',
  '8': 'saturn',
  '9': 'uranus',
  '0': 'neptune'
};

export default function App() {
  const [selectedBody, setSelectedBody] = useState('overview');
  const [isPaused, setIsPaused] = useState(false);
  const [timeMultiplier, setTimeMultiplier] = useState(1.0);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Global Keyboard Shortcuts for interactive navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'Escape') {
        setSelectedBody('overview');
      } else if (e.key === 'o' || e.key === 'O') {
        setShowOrbits((v) => !v);
      } else if (e.key === 'l' || e.key === 'L') {
        setShowLabels((v) => !v);
      } else if (e.key === 'r' || e.key === 'R') {
        setSelectedBody('overview');
      } else if (KEY_TO_BODY[e.key]) {
        setSelectedBody(KEY_TO_BODY[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetCamera = () => {
    setSelectedBody('overview');
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none">
      {/* 1. Interactive 3D WebGL Solar System Canvas */}
      <Canvas
        className="w-full h-full cursor-grab active:cursor-grabbing bg-black"
        gl={{
          antialias: true,
          alpha: false,
          logarithmicDepthBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15
        }}
        camera={{
          fov: 45,
          near: 0.1,
          far: 25000,
          position: [0, 140, 220]
        }}
        onPointerDown={() => setIsUserInteracting(true)}
        onPointerUp={() => setIsUserInteracting(false)}
      >
        <Suspense fallback={null}>
          <SolarSystemEngine
            selectedBody={selectedBody}
            timeMultiplier={timeMultiplier}
            isPaused={isPaused}
            showOrbits={showOrbits}
            showLabels={showLabels}
            onSelectBody={setSelectedBody}
            isUserInteracting={isUserInteracting}
          />
        </Suspense>
      </Canvas>

      {/* 2. Loading Gate */}
      <Suspense fallback={<LoadingScreen />}>
        {/* Drei texture preloader hook fallback */}
      </Suspense>

      {/* 3. Interactive Solar Simulator HUD */}
      <InteractiveSimulatorHUD
        selectedBody={selectedBody}
        onSelectBody={setSelectedBody}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        timeMultiplier={timeMultiplier}
        setTimeMultiplier={setTimeMultiplier}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        onResetCamera={handleResetCamera}
      />
    </div>
  );
}
