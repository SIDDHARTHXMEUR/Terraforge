import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEarthSurfaceStore } from '../../state/useEarthSurfaceStore';
import { latLonToEarthCoords, earthCoordsToLatLon } from './EarthSurfaceTileEngine';
import { DISPLAY_RADII } from '../../data/displayScale';

export const BODY_VIEW_CONFIGS = {
  cinematic_overview: {
    offset: [-300, 165, 290],
    target: [-65, 0, 48],
    minDist: 50,
    maxDist: 3500
  },
  scientific_overview: {
    offset: [0, 850, 0.01],
    target: [0, 0, 0],
    minDist: 100,
    maxDist: 4000
  },
  overview: {
    offset: [-300, 165, 290],
    target: [-65, 0, 48],
    minDist: 50,
    maxDist: 3500
  },
  sun: {
    offset: [0, 15, 180],
    target: [0, 0, 0],
    minDist: 65,
    maxDist: 1500
  },
  mercury: {
    distance: 22.0,
    phaseAngle: 52, // Lit fraction = (1 + cos(52°))/2 = 80.8% (55%-85% gibbous)
    elevAngle: 14,
    minDist: 6.0,
    maxDist: 220
  },
  venus: {
    distance: 26.0,
    phaseAngle: 52,
    elevAngle: 14,
    minDist: 7.5,
    maxDist: 260
  },
  earth: {
    distance: 28.0,
    phaseAngle: 50,
    elevAngle: 14,
    minDist: 5.2002,
    maxDist: 280
  },
  mars: {
    distance: 24.0,
    phaseAngle: 52,
    elevAngle: 15,
    minDist: 6.5,
    maxDist: 240
  },
  asteroids: {
    distance: 14.0,
    phaseAngle: 50,
    elevAngle: 16,
    minDist: 3.5,
    maxDist: 150
  },
  jupiter: {
    distance: 88.0,
    phaseAngle: 52,
    elevAngle: 12,
    minDist: 24.0,
    maxDist: 750
  },
  saturn: {
    distance: 110.0,
    phaseAngle: 50,
    elevAngle: 18,
    minDist: 35.0,
    maxDist: 850
  },
  uranus: {
    distance: 46.0,
    phaseAngle: 52,
    elevAngle: 18,
    minDist: 14.5,
    maxDist: 500
  },
  neptune: {
    distance: 44.0,
    phaseAngle: 52,
    elevAngle: 16,
    minDist: 14.0,
    maxDist: 500
  }
};

/**
 * Computes anchored camera pose in the planet's coordinate frame relative to the Sun.
 * Uses float64 arithmetic to guarantee zero drift, zero jitter, and constant lit fraction.
 */
export function getAnchoredBodyCamPose(selectedBody, bodyPos, cfg, zoomFactor = 1.0, lookYaw = 0.0, lookPitch = 0.0) {
  if (selectedBody === 'overview' || !cfg.distance) {
    const baseOffset = new THREE.Vector3(...(cfg.offset || [-320, 110, 310]));
    const baseTarget = new THREE.Vector3(...(cfg.target || [0, 0, 0]));
    return { camPos: baseOffset, camTarget: baseTarget };
  }

  const pX = Number(bodyPos[0]);
  const pY = Number(bodyPos[1]);
  const pZ = Number(bodyPos[2]);

  // Sun direction from planet (Sun is at world origin [0, 0, 0])
  const distToSun = Math.hypot(pX, pZ);
  let toSunX = 0, toSunZ = 1;
  if (distToSun > 0.0001) {
    toSunX = -pX / distToSun;
    toSunZ = -pZ / distToSun;
  }
  // Up vector is [0, 1, 0]
  // Tangent = Up x toSun = [toSunZ, 0, -toSunX]
  const tanX = toSunZ;
  const tanZ = -toSunX;

  const phaseDeg = cfg.phaseAngle || 52;
  const elevDeg = cfg.elevAngle || 14;
  const phaseRad = (phaseDeg * Math.PI) / 180.0;
  const elevRad = (elevDeg * Math.PI) / 180.0;

  // Base ground direction in orbital plane
  const gX = toSunX * Math.cos(phaseRad) + tanX * Math.sin(phaseRad);
  const gZ = toSunZ * Math.cos(phaseRad) + tanZ * Math.sin(phaseRad);

  // Apply elevation angle
  const cosElev = Math.cos(elevRad);
  const sinElev = Math.sin(elevRad);
  let dirX = gX * cosElev;
  let dirY = sinElev;
  let dirZ = gZ * cosElev;

  const dirLen = Math.hypot(dirX, dirY, dirZ);
  dirX /= dirLen;
  dirY /= dirLen;
  dirZ /= dirLen;

  // Apply look-around yaw and pitch (tilting camera relative to anchor frame)
  if (Math.abs(lookYaw) > 0.0001 || Math.abs(lookPitch) > 0.0001) {
    const cosY = Math.cos(lookYaw);
    const sinY = Math.sin(lookYaw);
    const rotX = dirX * cosY - dirZ * sinY;
    const rotZ = dirX * sinY + dirZ * cosY;

    const cosP = Math.cos(lookPitch);
    const sinP = Math.sin(lookPitch);
    dirX = rotX * cosP;
    dirY = dirY * cosP + sinP;
    dirZ = rotZ * cosP;

    const newLen = Math.hypot(dirX, dirY, dirZ);
    dirX /= newLen;
    dirY /= newLen;
    dirZ /= newLen;
  }

  const effectiveDistance = cfg.distance * zoomFactor;
  const camX = pX + dirX * effectiveDistance;
  const camY = pY + dirY * effectiveDistance;
  const camZ = pZ + dirZ * effectiveDistance;

  // Right vector: Up [0, 1, 0] x (Cam to Planet direction)
  const cRightX = -dirZ;
  const cRightZ = dirX;
  const cRightLen = Math.hypot(cRightX, cRightZ);
  const normRightX = cRightX / (cRightLen || 1);
  const normRightZ = cRightZ / (cRightLen || 1);

  // Shift target slightly left (-normRight) so planet is framed in the right half (40%-55% from right edge)
  const shiftAmount = effectiveDistance * 0.12;
  const targetX = pX - normRightX * shiftAmount;
  const targetY = pY;
  const targetZ = pZ - normRightZ * shiftAmount;

  return {
    camPos: new THREE.Vector3(camX, camY, camZ),
    camTarget: new THREE.Vector3(targetX, targetY, targetZ)
  };
}

export function InteractiveSolarCamera({
  selectedBody = 'overview',
  viewMode = 'cinematic',
  bodyPositions = {},
  isUserInteracting = false,
  enabled = true
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const bodyPositionsRef = useRef(bodyPositions);
  bodyPositionsRef.current = bodyPositions;

  // State Machine: 'OVERVIEW' | 'FLYING' | 'FOCUSED'
  const isInitialOverview = !selectedBody || selectedBody === 'overview';
  const cameraStateRef = useRef(isInitialOverview ? 'OVERVIEW' : 'FOCUSED');
  const lastTargetBodyRef = useRef(selectedBody);
  const lastViewModeRef = useRef(viewMode);
  const lastEnabledRef = useRef(enabled);

  // Flight parameters (time-based, <= 2.2s, single trigger)
  const isTransitioningRef = useRef(false);
  const transitionStartTimeRef = useRef(0);
  const transitionDurationRef = useRef(2000);
  const transitionStartCamPosRef = useRef(new THREE.Vector3());
  const transitionStartTargetRef = useRef(new THREE.Vector3());

  // Cinematic Look-around & Zoom State
  const lookYawRef = useRef(0.0);       // Clamped +/-25 deg (+/-0.436 rad)
  const lookPitchRef = useRef(0.0);     // Clamped +/-15 deg (+/-0.262 rad)
  const zoomFactorRef = useRef(1.0);    // Clamped 0.75 - 1.25 (+/-25%)
  const isPointerDownRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // Drift for idle overview
  const driftTimeRef = useRef(0);

  // Earth surface mode support
  const [inSurfaceMode, setInSurfaceMode] = useState(false);
  const surfaceLatRef = useRef(40.7128);
  const surfaceLonRef = useRef(-74.0060);
  const surfaceAltKmRef = useRef(1200.0);
  const surfacePitchRef = useRef(0.85);
  const surfaceAzimuthRef = useRef(0.0);
  const surfaceFlyAnimRef = useRef(null);

  const {
    isSurfaceMode,
    setIsSurfaceMode,
    setAltitudeKm,
    flyToTarget,
    clearFlyTo,
    returnToOrbitCounter,
    tier2Status
  } = useEarthSurfaceStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__threeCamera = camera;
    }
  }, [camera]);

  // Handle Return to Orbit from HUD
  useEffect(() => {
    if (returnToOrbitCounter > 0 && selectedBody === 'earth') {
      setInSurfaceMode(false);
      setIsSurfaceMode(false);
    }
  }, [returnToOrbitCounter, selectedBody, setIsSurfaceMode]);

  // Handle Fly-To Landmark from HUD
  useEffect(() => {
    if (flyToTarget && selectedBody === 'earth') {
      setInSurfaceMode(true);
      setIsSurfaceMode(true);
      surfaceFlyAnimRef.current = {
        startTime: performance.now(),
        duration: flyToTarget.duration || 2200,
        startLat: surfaceLatRef.current,
        startLon: surfaceLonRef.current,
        startAlt: surfaceAltKmRef.current,
        targetLat: flyToTarget.lat,
        targetLon: flyToTarget.lon,
        targetAlt: flyToTarget.altitudeKm || 2.0
      };
      clearFlyTo();
    }
  }, [flyToTarget, selectedBody, clearFlyTo, setIsSurfaceMode]);

  // 1. Single Flight Trigger per Body / Mode Change
  useEffect(() => {
    if (!enabled) return;

    if (
      selectedBody !== lastTargetBodyRef.current ||
      viewMode !== lastViewModeRef.current ||
      lastEnabledRef.current !== enabled
    ) {
      if (typeof window !== 'undefined') {
        window.__flightStartCount = (window.__flightStartCount || 0) + 1;
      }

      lastTargetBodyRef.current = selectedBody;
      lastViewModeRef.current = viewMode;
      lastEnabledRef.current = enabled;

      cameraStateRef.current = 'FLYING';
      isTransitioningRef.current = true;
      transitionStartTimeRef.current = performance.now();
      transitionDurationRef.current = 2000;

      // Reset cinematic look-around & zoom
      lookYawRef.current = 0.0;
      lookPitchRef.current = 0.0;
      zoomFactorRef.current = 1.0;

      if (inSurfaceMode) {
        setInSurfaceMode(false);
        setIsSurfaceMode(false);
      }

      if (controlsRef.current) {
        transitionStartTargetRef.current.copy(controlsRef.current.target);
        controlsRef.current.enabled = false;
      }
      transitionStartCamPosRef.current.copy(camera.position);
    }
  }, [selectedBody, viewMode, enabled, inSurfaceMode, setIsSurfaceMode, camera]);

  // 2. User Input Listener: Cancels flight immediately on any interaction
  // Also handles cinematic tilt and wheel zoom
  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handlePointerDown = (e) => {
      // Input during flight immediately cancels flight
      if (cameraStateRef.current === 'FLYING' || isTransitioningRef.current) {
        isTransitioningRef.current = false;
        cameraStateRef.current = selectedBody === 'overview' ? 'OVERVIEW' : 'FOCUSED';
        if (controlsRef.current && viewMode === 'scientific') {
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }
      }

      isPointerDownRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
      if (!isPointerDownRef.current) return;

      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      // In Cinematic Focused mode: tilt camera (yaw +/-25 deg, pitch +/-15 deg)
      if (cameraStateRef.current === 'FOCUSED' && viewMode === 'cinematic' && selectedBody !== 'overview' && !inSurfaceMode) {
        const maxYaw = (25 * Math.PI) / 180.0;
        const maxPitch = (15 * Math.PI) / 180.0;
        lookYawRef.current = THREE.MathUtils.clamp(lookYawRef.current - dx * 0.003, -maxYaw, maxYaw);
        lookPitchRef.current = THREE.MathUtils.clamp(lookPitchRef.current + dy * 0.003, -maxPitch, maxPitch);
      }
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
    };

    const handleWheel = (e) => {
      // Input during flight immediately cancels flight
      if (cameraStateRef.current === 'FLYING' || isTransitioningRef.current) {
        isTransitioningRef.current = false;
        cameraStateRef.current = selectedBody === 'overview' ? 'OVERVIEW' : 'FOCUSED';
      }

      // In Cinematic Focused mode: wheel zooms +/-25%
      if (cameraStateRef.current === 'FOCUSED' && viewMode === 'cinematic' && selectedBody !== 'overview' && !inSurfaceMode) {
        e.preventDefault();
        const deltaZoom = e.deltaY * 0.0008;
        zoomFactorRef.current = THREE.MathUtils.clamp(zoomFactorRef.current + deltaZoom, 0.75, 1.25);
      }
    };

    const handleDblClick = () => {
      // Scientific mode: double click resets to anchored pose
      if (viewMode === 'scientific' && selectedBody !== 'overview') {
        const bodyVec = bodyPositionsRef.current[selectedBody] || [0, 0, 0];
        const cfg = BODY_VIEW_CONFIGS[selectedBody] || BODY_VIEW_CONFIGS.mercury;
        const pose = getAnchoredBodyCamPose(selectedBody, bodyVec, cfg, 1.0, 0, 0);
        camera.position.copy(pose.camPos);
        if (controlsRef.current) {
          controlsRef.current.target.copy(pose.camTarget);
          controlsRef.current.update();
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('dblclick', handleDblClick);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDblClick);
    };
  }, [gl, selectedBody, viewMode, inSurfaceMode, camera]);

  // 3. Main Camera Director Frame Loop (priority 1: runs right after orbital simulation update)
  useFrame((_, delta) => {
    if (!enabled) return;

    if (typeof window !== 'undefined') {
      window.__cameraState = cameraStateRef.current;
      window.__isTransitioning = isTransitioningRef.current;
      if (controlsRef.current) window.__threeControls = controlsRef.current;
    }

    const isOverview = !selectedBody || selectedBody === 'overview';
    let activeKey = selectedBody;
    if (isOverview) {
      activeKey = viewMode === 'scientific' ? 'scientific_overview' : 'cinematic_overview';
    }
    const cfg = BODY_VIEW_CONFIGS[activeKey] || BODY_VIEW_CONFIGS.overview;
    const bodyCoords = isOverview ? [0, 0, 0] : (bodyPositionsRef.current[selectedBody] || [0, 0, 0]);

    // -----------------------------------------------------------------------
    // A. FLYING STATE (Smooth time-based approach <= 2.2s)
    // -----------------------------------------------------------------------
    if (cameraStateRef.current === 'FLYING' || isTransitioningRef.current) {
      if (controlsRef.current) controlsRef.current.enabled = false;

      const elapsed = performance.now() - transitionStartTimeRef.current;
      const t = Math.min(1.0, elapsed / Math.max(1, transitionDurationRef.current));
      const ease = THREE.MathUtils.smootherstep(t, 0, 1);

      const destPose = getAnchoredBodyCamPose(selectedBody, bodyCoords, cfg, 1.0, 0, 0);

      // Arc smoothly towards destination pose
      camera.position.lerpVectors(transitionStartCamPosRef.current, destPose.camPos, ease);
      const curTarget = new THREE.Vector3().lerpVectors(transitionStartTargetRef.current, destPose.camTarget, ease);
      camera.lookAt(curTarget);
      if (controlsRef.current) controlsRef.current.target.copy(curTarget);

      if (t >= 1.0) {
        isTransitioningRef.current = false;
        cameraStateRef.current = isOverview ? 'OVERVIEW' : 'FOCUSED';
        camera.position.copy(destPose.camPos);
        camera.lookAt(destPose.camTarget);
        if (controlsRef.current) {
          controlsRef.current.target.copy(destPose.camTarget);
          if (viewMode === 'scientific' || isOverview) {
            controlsRef.current.enabled = true;
            controlsRef.current.update();
          }
        }
      }
      return;
    }

    // -----------------------------------------------------------------------
    // B. CINEMATIC FOCUSED STATE (Locked in Planet's Frame, Soft Spring-Back)
    // -----------------------------------------------------------------------
    if (cameraStateRef.current === 'FOCUSED' && !isOverview && viewMode === 'cinematic') {
      if (controlsRef.current) controlsRef.current.enabled = false;

      // Soft spring-back to anchored pose (1.5s decay rate) when not dragging
      if (!isPointerDownRef.current) {
        const spring = Math.exp(-delta / 0.35); // 1.5s relaxation
        lookYawRef.current *= spring;
        lookPitchRef.current *= spring;
        if (Math.abs(lookYawRef.current) < 0.0001) lookYawRef.current = 0.0;
        if (Math.abs(lookPitchRef.current) < 0.0001) lookPitchRef.current = 0.0;
      }

      // Compute locked camera pose in the planet's coordinate frame
      const pose = getAnchoredBodyCamPose(
        selectedBody,
        bodyCoords,
        cfg,
        zoomFactorRef.current,
        lookYawRef.current,
        lookPitchRef.current
      );

      camera.position.copy(pose.camPos);
      camera.lookAt(pose.camTarget);
      if (controlsRef.current) controlsRef.current.target.copy(pose.camTarget);
      return;
    }

    // -----------------------------------------------------------------------
    // C. SCIENTIFIC FOCUSED STATE (OrbitControls Enabled)
    // -----------------------------------------------------------------------
    if (cameraStateRef.current === 'FOCUSED' && !isOverview && viewMode === 'scientific') {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.08;
        controlsRef.current.update();
      }
      return;
    }

    // -----------------------------------------------------------------------
    // D. OVERVIEW STATE (OrbitControls Enabled with Subtle Cinematic Drift)
    // -----------------------------------------------------------------------
    if (cameraStateRef.current === 'OVERVIEW' || isOverview) {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.08;

        if (viewMode === 'cinematic' && !isUserInteracting && !isPointerDownRef.current) {
          driftTimeRef.current += delta;
          const driftSpeed = 0.18;
          camera.position.x += Math.cos(driftTimeRef.current * 0.05) * delta * driftSpeed;
          camera.position.z += Math.sin(driftTimeRef.current * 0.05) * delta * driftSpeed;
        }

        controlsRef.current.update();
      }
    }
  }, 1);

  const isOverview = !selectedBody || selectedBody === 'overview';
  const R = DISPLAY_RADII[selectedBody] || 5.0;
  const isSaturn = selectedBody === 'saturn';
  const minCamDist = isOverview ? 50 : isSaturn ? 36.5 : R * 1.18;
  const maxCamDist = isOverview ? 3500 : Math.max(120, R * 25.0);

  if (!enabled) return null;

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={viewMode === 'scientific' || isOverview}
      enableDamping={true}
      dampingFactor={0.08}
      enablePan={true}
      enableRotate={true}
      enableZoom={true}
      minDistance={minCamDist}
      maxDistance={maxCamDist}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
    />
  );
}
