import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CINEMATIC_SCENES } from '../../data/cinematicScenes';

// IMAX Space Documentary Cinematic Camera Controller
export function CinematicDirectorCamera({
  isFilmPlaying = true,
  currentSceneIndex = 0,
  sceneProgress = 0, // 0.0 to 1.0 within active scene
  bodyPositions = {},
  isUserInteracting = false
}) {
  const { camera } = useThree();
  const controlsRef = useRef();

  const currentScene = CINEMATIC_SCENES[currentSceneIndex] || CINEMATIC_SCENES[0];

  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  useFrame((_, delta) => {
    if (!camera) return;

    // If user is actively manipulating OrbitControls in manual mode, let controls handle camera
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
      const pStart = new THREE.Vector3(...(currentScene.cameraStart || [0, 4, 380]));
      const pEnd = new THREE.Vector3(...(currentScene.cameraEnd || [0, 1.5, 260]));
      targetCamPos.lerpVectors(pStart, pEnd, tEase);

      const tStart = new THREE.Vector3(...(currentScene.targetStart || [0, 0, 0]));
      const tEnd = new THREE.Vector3(...(currentScene.targetEnd || [0, 0, 0]));
      targetLookAt.lerpVectors(tStart, tEnd, tEase);
    }

    // Smoothly dolly camera towards computed shot path
    const dollySpeed = isFilmPlaying ? Math.min(1.0, delta * 3.5) : Math.min(1.0, delta * 5.0);
    camera.position.lerp(targetCamPos, dollySpeed);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt, dollySpeed);
      controlsRef.current.update();
    } else {
      camera.lookAt(targetLookAt);
    }

    // Dynamic Cinematic Field of View smoothly transitioning between establishing & close-up shots
    const targetFov = currentScene.fov || 42;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * Math.min(1.0, delta * 2.0);
      camera.updateProjectionMatrix();
    }
  });

  return (
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
  );
}
