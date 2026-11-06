import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SolarSystemEngine } from './components/cinematic/SolarSystemEngine';
import { CinematicFilmOverlay } from './components/cinematic/CinematicFilmOverlay';
import { LoadingScreen } from './components/LoadingScreen';
import { CINEMATIC_SCENES } from './data/cinematicScenes';
import { cosmicAudio } from './services/cosmicAudio';

export default function App() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [isFilmPlaying, setIsFilmPlaying] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const sceneTimerRef = useRef(0);
  const currentScene = CINEMATIC_SCENES[currentSceneIndex] || CINEMATIC_SCENES[0];

  // Continuous Film Master Timeline Loop
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isFilmPlaying && !isUserInteracting) {
        sceneTimerRef.current += delta;
        const duration = currentScene.duration || 12.0;
        const progress = sceneTimerRef.current / duration;

        if (progress >= 1.0) {
          // Advance smoothly to next cinematic scene
          sceneTimerRef.current = 0;
          setCurrentSceneIndex((prev) => {
            const nextIdx = (prev + 1) % CINEMATIC_SCENES.length;
            cosmicAudio.setSceneAudio(CINEMATIC_SCENES[nextIdx].id);
            return nextIdx;
          });
          setSceneProgress(0);
        } else {
          setSceneProgress(progress);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isFilmPlaying, isUserInteracting, currentScene.duration]);

  // Jump to specific scene
  const handleSelectScene = (idx) => {
    sceneTimerRef.current = 0;
    setCurrentSceneIndex(idx);
    setSceneProgress(0);
    cosmicAudio.setSceneAudio(CINEMATIC_SCENES[idx].id);
  };

  const handleNextScene = () => {
    const nextIdx = (currentSceneIndex + 1) % CINEMATIC_SCENES.length;
    handleSelectScene(nextIdx);
  };

  const handlePrevScene = () => {
    const prevIdx = (currentSceneIndex - 1 + CINEMATIC_SCENES.length) % CINEMATIC_SCENES.length;
    handleSelectScene(prevIdx);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFilmPlaying((p) => !p);
      } else if (e.key === 'ArrowRight') {
        handleNextScene();
      } else if (e.key === 'ArrowLeft') {
        handlePrevScene();
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < CINEMATIC_SCENES.length) {
          handleSelectScene(idx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSceneIndex]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none">
      {/* 1. 3D WebGL Canvas Viewport with ACES Filmic Tone Mapping */}
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
          fov: 42,
          near: 0.1,
          far: 20000,
          position: [0, 4, 380]
        }}
        onPointerDown={() => setIsUserInteracting(true)}
        onPointerUp={() => setIsUserInteracting(false)}
      >
        <Suspense fallback={null}>
          <SolarSystemEngine
            isFilmPlaying={isFilmPlaying}
            currentSceneIndex={currentSceneIndex}
            sceneProgress={sceneProgress}
            isUserInteracting={isUserInteracting}
          />
        </Suspense>
      </Canvas>

      {/* 2. Loading Screen positioned outside Canvas so Drei useProgress hooks can work smoothly */}
      <Suspense fallback={<LoadingScreen />}>
        {/* Helper loader gate */}
      </Suspense>

      {/* 3. Anamorphic Cinematic Film Overlay & Minimal Transport */}
      <CinematicFilmOverlay
        currentSceneIndex={currentSceneIndex}
        sceneProgress={sceneProgress}
        isFilmPlaying={isFilmPlaying}
        setIsFilmPlaying={setIsFilmPlaying}
        onSelectScene={handleSelectScene}
        onNextScene={handleNextScene}
        onPrevScene={handlePrevScene}
        isAudioMuted={isAudioMuted}
        setIsAudioMuted={setIsAudioMuted}
      />
    </div>
  );
}
