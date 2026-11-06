import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CINEMATIC_SCENES } from '../../data/cinematicScenes';

// IMAX Space Documentary Cinematic Camera Controller
// Executes continuous spline/dolly tracking shots with Catmull-Rom interpolation,
// cinematic cubic easing, dynamic FOV adjustment, and user interactive takeover.

export function CinematicDirectorCamera({
  isFilmPlaying = true,
  currentSceneIndex = 0,
  sceneProgress = 0, // 0.0 to 1.0 within active scene
  bodyPositions = {},
  isUserInteracting = false
}) {
  const cameraRef = useRef();
  const controlsRef = useRef();
  const { size } = useThree();

  const currentScene = CINEMATIC_SCENES[currentSceneIndex] || CINEMATIC_SCENES[0];

  // Smooth cinematic ease (smoothstep acceleration & deceleration)
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  useFrame((_, delta) => {
    if (!cameraRef.current) return;

    // If user is actively manipulating OrbitControls in manual mode, do not override
    if (isUserInteracting && controlsRef.current) {
      controlsRef.current.update();
      return;
    }

    const tEase = easeInOutCubic(Math.min(1.0, Math.max(0.0, sceneProgress)));

    let targetCamPos = new THREE.Vector3();
    let targetLookAt = new THREE.Vector3();

    if (currentScene.focusBody && bodyPositions[currentScene.focusBody]) {
      // Dynamic tracking shot relative to moving celestial body
      const bodyCenter = new THREE.Vector3(...bodyPositions[currentScene.focusBody]);
      const startOff = new THREE.Vector3(...(currentScene.cameraStartOffset || [4, 2, 6]));
      const endOff = new THREE.Vector3(...(currentScene.cameraEndOffset || [2, 0.5, 3]));

      const curOffset = new THREE.Vector3().lerpVectors(startOff, endOff, tEase);
      targetCamPos.addVectors(bodyCenter, curOffset);
      targetLookAt.copy(bodyCenter);
    } else {
      // Fixed cinematic world dolly/tracking shot (e.g. Void, Sun, Asteroids, Finale)
      const pStart = new THREE.Vector3(...currentScene.cameraStart);
      const pEnd = new THREE.Vector3(...currentScene.cameraEnd);
      targetCamPos.lerpVectors(pStart, pEnd, tEase);

      const tStart = new THREE.Vector3(...currentScene.targetStart);
      const tEnd = new THREE.Vector3(...currentScene.targetEnd);
      targetLookAt.lerpVectors(tStart, tEnd, tEase);
    }

    // Smoothly dolly camera towards computed shot path
    const dollySpeed = isFilmPlaying ? Math.min(1.0, delta * 3.5) : Math.min(1.0, delta * 5.0);
    cameraRef.current.position.lerp(targetCamPos, dollySpeed);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt, dollySpeed);
      controlsRef.current.update();
    } else {
      cameraRef.current.lookAt(targetLookAt);
    }

    // Dynamic Cinematic Field of View smoothly transitioning between establishing & close-up shots
    if (cameraRef.current.fov !== currentScene.fov) {
      cameraRef.current.fov += (currentScene.fov - cameraRef.current.fov) * Math.min(1.0, delta * 2.0);
      cameraRef.current.updateProjectionMatrix();
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={currentScene.fov || 42}
        aspect={size.width / size.height}
        near={0.1}
        far={20000}
        position={currentScene.cameraStart || [0, 10, 80]}
      />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        enablePan={false}
        maxDistance={1200}
        minDistance={0.8}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </>
  );
}

