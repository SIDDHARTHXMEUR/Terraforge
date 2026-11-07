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
const _earthVec = new THREE.Vector3();
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

    const handleUserInterrupt = () => {
      if (!isTerminatedRef.current) {
        isTerminatedRef.current = true;
        if (onComplete) onComplete();
      }
    };

    window.addEventListener('pointerdown', handleUserInterrupt);
    window.addEventListener('wheel', handleUserInterrupt, { passive: true });
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

    const satPos = bodyPositions.saturn || [-132, 0, 98];
    _satVec.set(satPos[0], satPos[1], satPos[2]);

    const jupPos = bodyPositions.jupiter || [150, 0, -85];
    _jupVec.set(jupPos[0], jupPos[1], jupPos[2]);

    const earthPos = bodyPositions.earth || [58, 0, 32];
    _earthVec.set(earthPos[0], earthPos[1], earthPos[2]);

    _toSun.copy(_satVec).negate().normalize();
    _tangent.crossVectors(_up, _toSun).normalize();

    // Banked spline with gentle roll and faint drift (prologue only)
    const roll = Math.sin(t * 0.45) * 0.035;
    camera.rotation.z = roll;

    if (t < 3.5) {
      // 0 to 3.5s: Saturn's sunlit rings (low push, ring particles whipping past)
      const p = t / 3.5;
      const ease = p * p * (3.0 - 2.0 * p);
      state.gl.toneMappingExposure = 0.5 + p * 0.60;

      const angleStart = (74.0 * Math.PI) / 180;
      const angleEnd = (48.0 * Math.PI) / 180;
      _dirStart.copy(_toSun).multiplyScalar(Math.cos(angleStart)).addScaledVector(_tangent, Math.sin(angleStart)).normalize();
      _dirEnd.copy(_toSun).multiplyScalar(Math.cos(angleEnd)).addScaledVector(_tangent, Math.sin(angleEnd)).normalize();

      _startCam.copy(_satVec).addScaledVector(_dirStart, 38.0).addScaledVector(_up, 3.2);
      _endCam.copy(_satVec).addScaledVector(_dirEnd, 24.0).addScaledVector(_up, 4.5);
      camera.position.lerpVectors(_startCam, _endCam, ease);

      _lookTgt.copy(_satVec).addScaledVector(_toSun, 2.5);
      camera.lookAt(_lookTgt);

    } else if (t < 6.0) {
      // 3.5 to 6s: Jupiter fills the frame
      const p = (t - 3.5) / 2.5;
      const ease = p * p * (3.0 - 2.0 * p);
      state.gl.toneMappingExposure = 1.10;

      _startCam.copy(_jupVec).add(new THREE.Vector3(-45, 12, 60));
      _endCam.copy(_jupVec).add(new THREE.Vector3(-28, 8, 38));
      camera.position.lerpVectors(_startCam, _endCam, ease);

      _lookTgt.copy(_jupVec);
      camera.lookAt(_lookTgt);

    } else if (t < 7.5) {
      // 6 to 7.5s: Asteroid-belt streak
      const p = (t - 6.0) / 1.5;
      const ease = p * p;
      state.gl.toneMappingExposure = 1.10;

      const beltPos = new THREE.Vector3(75, 4, 15);
      _startCam.set(95, 6, 25);
      _endCam.set(65, 3, 5);
      camera.position.lerpVectors(_startCam, _endCam, ease);

      _lookTgt.copy(beltPos);
      camera.lookAt(_lookTgt);

    } else if (t < 9.0) {
      // 7.5 to 9s: Earth crescent glimpse
      const p = (t - 7.5) / 1.5;
      const ease = p * p * (3.0 - 2.0 * p);
      state.gl.toneMappingExposure = 1.12;

      _startCam.copy(_earthVec).add(new THREE.Vector3(-14, 4, 18));
      _endCam.copy(_earthVec).add(new THREE.Vector3(-10, 2, 12));
      camera.position.lerpVectors(_startCam, _endCam, ease);

      _lookTgt.copy(_earthVec);
      camera.lookAt(_lookTgt);

    } else if (t < 13.0) {
      // 9 to 13s: The Sun rises massive (50 to 60% of frame height) with prominences & rising exposure
      const p = (t - 9.0) / 4.0;
      const ease = 1 - Math.pow(1 - p, 3);
      state.gl.toneMappingExposure = 1.05 + Math.sin(p * Math.PI) * 0.25;

      _startCam.set(0, 18, 160);
      _endCam.set(-90, 45, 190);
      camera.position.lerpVectors(_startCam, _endCam, ease);

      _lookTgt.set(0, 0, 0);
      camera.lookAt(_lookTgt);

    } else if (t < 14.5) {
      // 13 to 14.5s: Settle into the overview, letterbox opens, UI fades in
      const p = (t - 13.0) / 1.5;
      const ease = 1 - Math.pow(1 - p, 3);
      state.gl.toneMappingExposure = 1.15;

      _startCam.set(-90, 45, 190);
      _endCam.set(-320, 110, 310);
      camera.position.lerpVectors(_startCam, _endCam, ease);

      _startTgt.set(0, 0, 0);
      _endTgt.set(-65, 0, 48);
      _lookTgt.lerpVectors(_startTgt, _endTgt, ease);
      camera.lookAt(_lookTgt);

    } else {
      if (!isTerminatedRef.current) {
        isTerminatedRef.current = true;
        camera.rotation.z = 0;
        if (onComplete) onComplete();
      }
    }
  });

  return null;
}
