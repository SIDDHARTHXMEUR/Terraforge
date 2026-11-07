import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// =============================================================================
// TERRAFORGE: DIRECTED NOLAN-STYLE CINEMATIC OPENING (26 Seconds)
// Live 3D choreographed space camera sequence:
// 1. Stage 1 (0-7s): Gigantic dark limb of Saturn filling 85% of frame with razor-thin crescent
// 2. Stage 2 (7-15s): Massive orange-red thermonuclear Sun rises over the curved horizon
// 3. Stage 3 (15-21s): Parallax sweep along the ring plane with deep shadows
// 4. Stage 4 (21-26s): Majestic title reveal, letterbox retracts, instant interactive handover
// =============================================================================

export function CinematicPrologueDirector({
  isActive = true,
  onComplete,
  bodyPositions = {}
}) {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const isTerminatedRef = useRef(false);

  // Instant skip / interactive handover on any input
  useEffect(() => {
    if (!isActive) return;

    const handleUserInterrupt = () => {
      if (!isTerminatedRef.current) {
        isTerminatedRef.current = true;
        if (onComplete) onComplete();
      }
    };

    window.addEventListener('pointerdown', handleUserInterrupt);
    window.addEventListener('wheel', handleUserInterrupt);
    window.addEventListener('keydown', handleUserInterrupt);

    return () => {
      window.removeEventListener('pointerdown', handleUserInterrupt);
      window.removeEventListener('wheel', handleUserInterrupt);
      window.removeEventListener('keydown', handleUserInterrupt);
    };
  }, [isActive, onComplete]);

  useFrame((_, delta) => {
    if (!isActive || isTerminatedRef.current) return;

    timeRef.current += delta;
    const t = timeRef.current;

    // Saturn real-time position
    const satPos = bodyPositions.saturn || [-132, 0, 98];
    const satVec = new THREE.Vector3(...satPos);

    // Dynamic solar orientation vectors relative to Saturn
    const toSun = new THREE.Vector3(0, 0, 0).sub(satVec).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(up, toSun).normalize();

    if (t < 7.0) {
      // -----------------------------------------------------------------------
      // STAGE 1 (0 - 7s): The Sunlit Crescent & Terminator of Saturn
      // Camera is positioned along the terminator framing the sunlit crescent,
      // atmospheric banding, crisp ring shadows on the globe, and ring-lit nightside.
      // -----------------------------------------------------------------------
      const p = t / 7.0;
      const ease = p * p * (3.0 - 2.0 * p);

      const angleStart = (68.0 * Math.PI) / 180;
      const angleEnd   = (56.0 * Math.PI) / 180;

      const dirStart = new THREE.Vector3()
        .addScaledVector(toSun, Math.cos(angleStart))
        .addScaledVector(tangent, Math.sin(angleStart))
        .normalize();

      const dirEnd = new THREE.Vector3()
        .addScaledVector(toSun, Math.cos(angleEnd))
        .addScaledVector(tangent, Math.sin(angleEnd))
        .normalize();

      const startCam = new THREE.Vector3().copy(satVec)
        .addScaledVector(dirStart, 25.5)
        .addScaledVector(up, 4.5);

      const endCam = new THREE.Vector3().copy(satVec)
        .addScaledVector(dirEnd, 28.0)
        .addScaledVector(up, 7.2);

      camera.position.lerpVectors(startCam, endCam, ease);

      const startTgt = new THREE.Vector3().copy(satVec).addScaledVector(toSun, 3.2);
      const endTgt   = new THREE.Vector3().copy(satVec).addScaledVector(toSun, 2.0);
      camera.lookAt(new THREE.Vector3().lerpVectors(startTgt, endTgt, ease));
    } else if (t < 15.0) {
      // -----------------------------------------------------------------------
      // STAGE 2 (7 - 15s): The Solar Dawn — Thermonuclear Sun Rises Over Saturn
      // Camera dollys around the limb as the brilliant Sun crests over the horizon.
      // -----------------------------------------------------------------------
      const p = (t - 7.0) / 8.0;
      const ease = p * p * (3.0 - 2.0 * p);

      const angleEnd = (56.0 * Math.PI) / 180;
      const dirStage1End = new THREE.Vector3()
        .addScaledVector(toSun, Math.cos(angleEnd))
        .addScaledVector(tangent, Math.sin(angleEnd))
        .normalize();

      const startCam = new THREE.Vector3().copy(satVec)
        .addScaledVector(dirStage1End, 28.0)
        .addScaledVector(up, 7.2);

      const dawnDir = new THREE.Vector3()
        .addScaledVector(toSun, Math.cos((24.0 * Math.PI) / 180))
        .addScaledVector(tangent, Math.sin((24.0 * Math.PI) / 180))
        .normalize();

      const endCam = new THREE.Vector3().copy(satVec)
        .addScaledVector(dawnDir, 52.0)
        .addScaledVector(up, 22.0);

      camera.position.lerpVectors(startCam, endCam, ease);

      const startTgt = new THREE.Vector3().copy(satVec).addScaledVector(toSun, 2.0);
      const endTgt   = new THREE.Vector3(0, 0, 0); // Sun at origin
      camera.lookAt(new THREE.Vector3().lerpVectors(startTgt, endTgt, ease));
    } else if (t < 21.5) {
      // -----------------------------------------------------------------------
      // STAGE 3 (15 - 21.5s): Ring Plane Parallax Sweep
      // Camera sweeps across Saturn's ring plane with immense depth and scale
      // -----------------------------------------------------------------------
      const p = (t - 15.0) / 6.5;
      const ease = 1 - Math.pow(1 - p, 3);

      const dawnDir = new THREE.Vector3()
        .addScaledVector(toSun, Math.cos((24.0 * Math.PI) / 180))
        .addScaledVector(tangent, Math.sin((24.0 * Math.PI) / 180))
        .normalize();

      const startCam = new THREE.Vector3().copy(satVec)
        .addScaledVector(dawnDir, 52.0)
        .addScaledVector(up, 22.0);

      const endCam = new THREE.Vector3().copy(satVec)
        .addScaledVector(toSun, -80.0)
        .addScaledVector(tangent, -70.0)
        .addScaledVector(up, 42.0);

      camera.position.lerpVectors(startCam, endCam, ease);
      camera.lookAt(new THREE.Vector3().copy(satVec).multiplyScalar(0.4));
    } else if (t < 26.0) {
      // -----------------------------------------------------------------------
      // STAGE 4 (21.5 - 26s): Final Deceleration into Cinematic Solar Overview
      // -----------------------------------------------------------------------
      const p = (t - 21.5) / 4.5;
      const ease = 1 - Math.pow(1 - p, 5);

      const startCam = new THREE.Vector3().copy(satVec)
        .addScaledVector(toSun, -80.0)
        .addScaledVector(tangent, -70.0)
        .addScaledVector(up, 42.0);

      const endCam = new THREE.Vector3(-320, 110, 310);

      camera.position.lerpVectors(startCam, endCam, ease);

      const startTgt = new THREE.Vector3().copy(satVec).multiplyScalar(0.4);
      const endTgt   = new THREE.Vector3(-65, 0, 48);
      camera.lookAt(new THREE.Vector3().lerpVectors(startTgt, endTgt, ease));
    } else {
      // Handover to interactive controls
      if (!isTerminatedRef.current) {
        isTerminatedRef.current = true;
        if (onComplete) onComplete();
      }
    }
  });

  return null;
}

