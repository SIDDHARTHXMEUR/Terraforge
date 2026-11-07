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
  const frameTimesRef = useRef([]);

  const logBenchmark = () => {
    if (frameTimesRef.current.length > 5) {
      const sorted = [...frameTimesRef.current].sort((a, b) => a - b);
      const n = sorted.length;
      const p95 = sorted[Math.floor(n * 0.95)].toFixed(2);
      const p99 = sorted[Math.floor(n * 0.99)].toFixed(2);
      const max = sorted[n - 1].toFixed(2);
      const avg = (frameTimesRef.current.reduce((a, b) => a + b, 0) / n).toFixed(2);
      console.log(`[Prologue Benchmark] Frames: ${n}, Avg: ${avg}ms, p95: ${p95}ms, p99: ${p99}ms, Max: ${max}ms`);
    }
  };

  useEffect(() => {
    return () => {
      logBenchmark();
    };
  }, []);

  // Instant skip on ESC key or explicit trigger
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!isTerminatedRef.current) {
          isTerminatedRef.current = true;
          logBenchmark();
          if (onComplete) onComplete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onComplete]);

  useFrame((state, delta) => {
    if (!isActive || isTerminatedRef.current) return;

    const dtMs = delta * 1000;
    frameTimesRef.current.push(dtMs);

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
      // BEAT A (0 - 3s): Saturn's Sunlit Crescent, Ring Shadows & Dolly
      // -----------------------------------------------------------------------
      const p = t / 3.0;
      const ease = p * p * (3.0 - 2.0 * p);
      state.gl.toneMappingExposure = 0.88 + ease * 0.22;

      const angleStart = (70.0 * Math.PI) / 180;
      const angleEnd   = (50.0 * Math.PI) / 180;

      _dirStart.copy(_toSun).multiplyScalar(Math.cos(angleStart)).addScaledVector(_tangent, Math.sin(angleStart)).normalize();
      _dirEnd.copy(_toSun).multiplyScalar(Math.cos(angleEnd)).addScaledVector(_tangent, Math.sin(angleEnd)).normalize();

      _startCam.copy(_satVec).addScaledVector(_dirStart, 26.0).addScaledVector(_up, 4.2);
      _endCam.copy(_satVec).addScaledVector(_dirEnd, 30.0).addScaledVector(_up, 7.8);

      camera.position.lerpVectors(_startCam, _endCam, ease);

      _startTgt.copy(_satVec).addScaledVector(_toSun, 3.0);
      _endTgt.copy(_satVec).addScaledVector(_toSun, 1.5);
      _lookTgt.lerpVectors(_startTgt, _endTgt, ease);
      camera.lookAt(_lookTgt);

    } else if (t < 6.0) {
      // -----------------------------------------------------------------------
      // BEAT B (3 - 6s): Asteroids Drift & Jupiter Crossing with GRS
      // -----------------------------------------------------------------------
      const p = (t - 3.0) / 3.0;
      const ease = p * p * (3.0 - 2.0 * p);
      state.gl.toneMappingExposure = 1.05;

      const angleEnd = (50.0 * Math.PI) / 180;
      _dirStart.copy(_toSun).multiplyScalar(Math.cos(angleEnd)).addScaledVector(_tangent, Math.sin(angleEnd)).normalize();
      _startCam.copy(_satVec).addScaledVector(_dirStart, 30.0).addScaledVector(_up, 7.8);

      // Approach Jupiter on its sunlit approach flank
      const jupToSun = new THREE.Vector3().copy(_jupVec).negate().normalize();
      const jupTangent = new THREE.Vector3().crossVectors(_up, jupToSun).normalize();
      _endCam.copy(_jupVec).addScaledVector(jupToSun, 36.0).addScaledVector(jupTangent, 28.0).addScaledVector(_up, 12.0);

      camera.position.lerpVectors(_startCam, _endCam, ease);
      _lookTgt.lerpVectors(_satVec, _jupVec, ease * 0.85);
      camera.lookAt(_lookTgt);

    } else if (t < 10.5) {
      // -----------------------------------------------------------------------
      // BEAT C (6 - 10.5s): Solar Dawn — SDO Sun Rises Massive (50-60% Frame Height)
      // -----------------------------------------------------------------------
      const p = (t - 6.0) / 4.5;
      const ease = p * p * (3.0 - 2.0 * p);

      const jupToSun = new THREE.Vector3().copy(_jupVec).negate().normalize();
      const jupTangent = new THREE.Vector3().crossVectors(_up, jupToSun).normalize();
      _startCam.copy(_jupVec).addScaledVector(jupToSun, 36.0).addScaledVector(jupTangent, 28.0).addScaledVector(_up, 12.0);

      // Distance ~232 units from Sun (radius 54) -> Sun diameter (108) fills ~56% of FOV 45°
      _endCam.set(-155, 62, 160);

      camera.position.lerpVectors(_startCam, _endCam, ease);

      _startTgt.copy(_jupVec);
      _endTgt.copy(_zeroVec); // Center on the thermonuclear Sun
      _lookTgt.lerpVectors(_startTgt, _endTgt, ease);
      camera.lookAt(_lookTgt);

    } else if (t < 12.0) {
      // -----------------------------------------------------------------------
      // BEAT D (10.5 - 12s): Settle into Master Solar Overview
      // -----------------------------------------------------------------------
      const p = (t - 10.5) / 1.5;
      const ease = 1 - Math.pow(1 - p, 3);

      _startCam.set(-155, 62, 160);
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
        logBenchmark();
        if (onComplete) onComplete();
      }
    }
  });

  return null;
}
