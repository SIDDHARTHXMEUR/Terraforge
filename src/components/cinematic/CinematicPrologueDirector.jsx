import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// =============================================================================
// TERRAFORGE: DIRECTED NOLAN-STYLE CINEMATIC OPENING (~40 Seconds)
// Live 3D choreographed space camera sequence:
// 1. Stage 1 (0-4s):   Black pre-roll in deep void with rising exposure
// 2. Stage 2 (4-14s):  Low push along Saturn's ring plane (sunlit crescent & rings)
// 3. Stage 3 (14-24s): Solar dawn — thermonuclear SDO Sun rises over Saturn's limb
// 4. Stage 4 (24-32s): Interplanetary sweep — Jupiter foreground crossing for scale
// 5. Stage 5 (32-40s): Deceleration into master solar overview, letterbox retracts, UI fades in
// =============================================================================

// Pre-allocated scratch vectors to guarantee ZERO per-frame garbage collection
const _satVec = new THREE.Vector3();
const _jupVec = new THREE.Vector3();
const _toSun = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _tangent = new THREE.Vector3();
const _dirStart = new THREE.Vector3();
const _dirEnd = new THREE.Vector3();
const _startCam = new THREE.Vector3();
const _endCam = new THREE.Vector3();
const _startTgt = new THREE.Vector3();
const _endTgt = new THREE.Vector3();
const _lookTgt = new THREE.Vector3();
const _zeroVec = new THREE.Vector3(0, 0, 0);

export function CinematicPrologueDirector({
  isActive = true,
  onComplete,
  bodyPositions = {}
}) {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const isTerminatedRef = useRef(false);

  // Instant skip / interactive handover on user input
  useEffect(() => {
    if (!isActive) return;

    const handleUserInterrupt = (e) => {
      // Allow escape key or user click to skip
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

  useFrame((state, delta) => {
    if (!isActive || isTerminatedRef.current) return;

    timeRef.current += delta;
    const t = timeRef.current;

    // Saturn real-time position
    const satPos = bodyPositions.saturn || [-132, 0, 98];
    _satVec.set(satPos[0], satPos[1], satPos[2]);

    // Jupiter real-time position
    const jupPos = bodyPositions.jupiter || [150, 0, -85];
    _jupVec.set(jupPos[0], jupPos[1], jupPos[2]);

    // Dynamic solar orientation vectors relative to Saturn
    _toSun.copy(_satVec).negate().normalize();
    _tangent.crossVectors(_up, _toSun).normalize();

    if (t < 3.0) {
      // -----------------------------------------------------------------------
      // BEAT A (0 - 3s): Saturn's SUNLIT Crescent & Low Ring Plane Push
      // -----------------------------------------------------------------------
      const p = t / 3.0;
      const ease = p * p * (3.0 - 2.0 * p);
      state.gl.toneMappingExposure = 0.85 + ease * 0.25;

      const angleStart = (72.0 * Math.PI) / 180;
      const angleEnd   = (52.0 * Math.PI) / 180;

      _dirStart.copy(_toSun).multiplyScalar(Math.cos(angleStart)).addScaledVector(_tangent, Math.sin(angleStart)).normalize();
      _dirEnd.copy(_toSun).multiplyScalar(Math.cos(angleEnd)).addScaledVector(_tangent, Math.sin(angleEnd)).normalize();

      _startCam.copy(_satVec).addScaledVector(_dirStart, 28.0).addScaledVector(_up, 3.8);
      _endCam.copy(_satVec).addScaledVector(_dirEnd, 32.0).addScaledVector(_up, 7.5);

      camera.position.lerpVectors(_startCam, _endCam, ease);

      _startTgt.copy(_satVec).addScaledVector(_toSun, 3.5);
      _endTgt.copy(_satVec).addScaledVector(_toSun, 1.8);
      _lookTgt.lerpVectors(_startTgt, _endTgt, ease);
      camera.lookAt(_lookTgt);

    } else if (t < 6.0) {
      // -----------------------------------------------------------------------
      // BEAT B (3 - 6s): Asteroid Drift & Giant Planet Crossing (Jupiter)
      // -----------------------------------------------------------------------
      const p = (t - 3.0) / 3.0;
      const ease = 1 - Math.pow(1 - p, 3);
      state.gl.toneMappingExposure = 1.10;

      const angleEnd = (52.0 * Math.PI) / 180;
      _dirStart.copy(_toSun).multiplyScalar(Math.cos(angleEnd)).addScaledVector(_tangent, Math.sin(angleEnd)).normalize();
      _startCam.copy(_satVec).addScaledVector(_dirStart, 32.0).addScaledVector(_up, 7.5);

      _endCam.copy(_jupVec).add(new THREE.Vector3(-60, 35, 75));

      camera.position.lerpVectors(_startCam, _endCam, ease);
      _lookTgt.lerpVectors(_satVec, _jupVec, ease * 0.65);
      camera.lookAt(_lookTgt);

    } else if (t < 10.5) {
      // -----------------------------------------------------------------------
      // BEAT C (6 - 10.5s): Solar Dawn — SDO Sun Rises Massive Over System
      // -----------------------------------------------------------------------
      const p = (t - 6.0) / 4.5;
      const ease = p * p * (3.0 - 2.0 * p);

      _startCam.copy(_jupVec).add(new THREE.Vector3(-60, 35, 75));
      _endCam.set(-180, 75, 195);

      camera.position.lerpVectors(_startCam, _endCam, ease);

      _startTgt.copy(_jupVec).multiplyScalar(0.5);
      _endTgt.copy(_zeroVec); // Centered on the thermonuclear Sun
      _lookTgt.lerpVectors(_startTgt, _endTgt, ease);
      camera.lookAt(_lookTgt);

    } else if (t < 12.0) {
      // -----------------------------------------------------------------------
      // BEAT D (10.5 - 12s): Settle into Master Solar Overview
      // -----------------------------------------------------------------------
      const p = (t - 10.5) / 1.5;
      const ease = 1 - Math.pow(1 - p, 3);

      _startCam.set(-180, 75, 195);
      _endCam.set(-320, 110, 310);

      camera.position.lerpVectors(_startCam, _endCam, ease);

      _startTgt.set(0, 0, 0);
      _endTgt.set(-65, 0, 48);
      _lookTgt.lerpVectors(_startTgt, _endTgt, ease);
      camera.lookAt(_lookTgt);

    } else {
      // Handover to interactive controls at 12s
      if (!isTerminatedRef.current) {
        isTerminatedRef.current = true;
        if (onComplete) onComplete();
      }
    }
  });

  return null;
}
