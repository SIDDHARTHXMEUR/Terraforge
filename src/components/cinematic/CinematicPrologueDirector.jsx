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

    // Saturn real-time position and orbital vectors
    const satPos = bodyPositions.saturn || [-132, 0, 98];
    const satVec = new THREE.Vector3(...satPos);

    // Vector from Saturn toward Sun at (0, 0, 0)
    const toSun = new THREE.Vector3(0, 0, 0).sub(satVec).normalize();
    const awayFromSun = toSun.clone().negate();
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(up, toSun).normalize();

    if (t < 7.0) {
      // -----------------------------------------------------------------------
      // STAGE 1 (0 - 7s): The Gigantic Dark Limb of Saturn
      // Tight & low over the night limb: Saturn blocks the Sun, with razor-thin
      // sunlit crescent sliver along curvature and backlit rings in deep space
      // -----------------------------------------------------------------------
      const p = t / 7.0;
      const ease = p * p * (3.0 - 2.0 * p);

      const startCam = satVec.clone()
        .addScaledVector(awayFromSun, 7.8)
        .addScaledVector(tangent, 1.2)
        .add(new THREE.Vector3(0, 1.5, 0));

      const endCam = satVec.clone()
        .addScaledVector(awayFromSun, 6.5)
        .addScaledVector(tangent, 2.6)
        .add(new THREE.Vector3(0, 2.2, 0));

      camera.position.lerpVectors(startCam, endCam, ease);
      camera.lookAt(satVec.clone().addScaledVector(toSun, 2.0).add(new THREE.Vector3(0, 0.4, 0)));
    } else if (t < 15.0) {
      // -----------------------------------------------------------------------
      // STAGE 2 (7 - 15s): The Solar Dawn — Blazing SDO Sun Rises Over Saturn
      // Forward dolly & elevation past Saturn's limb: Sun crests the horizon!
      // -----------------------------------------------------------------------
      const p = (t - 7.0) / 8.0;
      const ease = p * p * (3.0 - 2.0 * p);

      const startCam = satVec.clone()
        .addScaledVector(awayFromSun, 6.5)
        .addScaledVector(tangent, 2.6)
        .add(new THREE.Vector3(0, 2.2, 0));

      const endCam = satVec.clone()
        .addScaledVector(awayFromSun, 3.5)
        .addScaledVector(tangent, 7.8)
        .add(new THREE.Vector3(0, 5.5, 0));

      camera.position.lerpVectors(startCam, endCam, ease);

      const startTgt = satVec.clone().addScaledVector(toSun, 2.0).add(new THREE.Vector3(0, 0.4, 0));
      const endTgt   = new THREE.Vector3(0, 0, 0); // Sun at origin
      const curTgt = new THREE.Vector3().lerpVectors(startTgt, endTgt, ease);
      camera.lookAt(curTgt);
    } else if (t < 21.5) {
      // -----------------------------------------------------------------------
      // STAGE 3 (15 - 21.5s): Ring Plane Parallax Sweep
      // Camera sweeps along Saturn's ring plane with crisp shadows
      // -----------------------------------------------------------------------
      const p = (t - 15.0) / 6.5;
      const ease = 1 - Math.pow(1 - p, 3);

      const startCam = satVec.clone()
        .addScaledVector(awayFromSun, 3.5)
        .addScaledVector(tangent, 7.8)
        .add(new THREE.Vector3(0, 5.5, 0));

      const endCam = satVec.clone()
        .addScaledVector(awayFromSun, -6.0)
        .addScaledVector(tangent, 18.0)
        .add(new THREE.Vector3(0, 9.5, 0));

      camera.position.lerpVectors(startCam, endCam, ease);
      camera.lookAt(satVec.clone().add(new THREE.Vector3(0, 0.5, 0)));
    } else if (t < 26.0) {
      // -----------------------------------------------------------------------
      // STAGE 4 (21.5 - 26s): Final Deceleration into Cinematic Solar Overview
      // -----------------------------------------------------------------------
      const p = (t - 21.5) / 4.5;
      const ease = 1 - Math.pow(1 - p, 5);

      const startCam = satVec.clone()
        .addScaledVector(awayFromSun, -12.0)
        .addScaledVector(tangent, 38.0)
        .add(new THREE.Vector3(0, 16.0, 0));

      const endCam = new THREE.Vector3(-145, 22, 130);

      camera.position.lerpVectors(startCam, endCam, ease);

      const startTgt = new THREE.Vector3(satVec.x * 0.4, 0, satVec.z * 0.4);
      const endTgt   = new THREE.Vector3(-42, 0, 32);
      const curTgt = new THREE.Vector3().lerpVectors(startTgt, endTgt, ease);
      camera.lookAt(curTgt);
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
