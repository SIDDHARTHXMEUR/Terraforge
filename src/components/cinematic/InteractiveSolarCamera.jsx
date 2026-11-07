import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEarthSurfaceStore } from '../../state/useEarthSurfaceStore';
import { latLonToEarthCoords, earthCoordsToLatLon } from './EarthSurfaceTileEngine';
import { DISPLAY_RADII } from '../../data/displayScale';

const BODY_VIEW_CONFIGS = {
  cinematic_overview: {
    offset: [-320, 110, 310],
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
    offset: [-320, 110, 310],
    target: [-65, 0, 48],
    minDist: 50,
    maxDist: 3500
  },
  sun: {
    offset: [0, 8, 168],
    target: [0, 0, 0],
    minDist: 65,
    maxDist: 1500
  },
  mercury: {
    distance: 10.8,
    terminatorAngle: 52,
    elevAngle: 14,
    minDist: 4.8,
    maxDist: 220
  },
  venus: {
    distance: 14.5,
    terminatorAngle: 54,
    elevAngle: 16,
    minDist: 6.2,
    maxDist: 260
  },
  earth: {
    distance: 16.5,
    terminatorAngle: 36,
    elevAngle: 14,
    minDist: 5.2002, // Relaxed minimum distance for continuous Earth surface zoom
    maxDist: 280
  },
  mars: {
    distance: 12.0,
    terminatorAngle: 42,
    elevAngle: 16,
    minDist: 5.2,
    maxDist: 240
  },
  asteroids: {
    distance: 8.5,
    terminatorAngle: 35,
    elevAngle: 16,
    minDist: 2.8,
    maxDist: 150
  },
  jupiter: {
    distance: 46.0,
    terminatorAngle: 32,
    elevAngle: 14,
    minDist: 21.0,
    maxDist: 750
  },
  saturn: {
    distance: 48.0,
    terminatorAngle: 46,
    elevAngle: 22,
    minDist: 22.0,
    maxDist: 850
  },
  uranus: {
    distance: 25.5,
    terminatorAngle: 36,
    elevAngle: 24,
    minDist: 11.5,
    maxDist: 500
  },
  neptune: {
    distance: 24.5,
    terminatorAngle: 34,
    elevAngle: 18,
    minDist: 11.0,
    maxDist: 500
  }
};

function getCinematicBodyCamOffset(selectedBody, bodyPos, cfg, viewMode = 'cinematic') {
  if (selectedBody === 'overview' || !cfg.distance) {
    if (selectedBody === 'overview' && viewMode === 'scientific') {
      return new THREE.Vector3(...BODY_VIEW_CONFIGS.scientific_overview.offset);
    }
    return new THREE.Vector3(...(cfg.offset || [-320, 110, 310]));
  }

  const toSun = new THREE.Vector3().sub(bodyPos);
  if (toSun.lengthSq() < 0.1) {
    return new THREE.Vector3(0, cfg.distance * 0.3, cfg.distance);
  }
  toSun.normalize();

  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3().crossVectors(up, toSun).normalize();

  const D = cfg.distance;
  const termDeg = cfg.terminatorAngle || 34;
  const elevDeg = cfg.elevAngle || 16;
  const terminatorAngle = (termDeg * Math.PI) / 180;
  const elevAngle = (elevDeg * Math.PI) / 180;

  const groundDir = new THREE.Vector3()
    .addScaledVector(toSun, Math.cos(terminatorAngle))
    .addScaledVector(tangent, Math.sin(terminatorAngle))
    .normalize();

  return new THREE.Vector3()
    .addScaledVector(groundDir, D * Math.cos(elevAngle))
    .addScaledVector(up, D * Math.sin(elevAngle));
}

function getCinematicBodyCamTarget(selectedBody, bodyPos, cfg, camOffset) {
  if (selectedBody === 'overview' || !cfg.distance) {
    return cfg.target ? new THREE.Vector3(...cfg.target) : new THREE.Vector3(0, 0, 0);
  }

  const targetVec = new THREE.Vector3(...bodyPos);

  // If Earth is selected in cinematic view, offset camera look-at target to the left
  // so Earth sits majestically in the right third of the frame on the sunlit crescent side
  if (selectedBody === 'earth' && camOffset) {
    const camDir = camOffset.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const camRight = new THREE.Vector3().crossVectors(camDir, up).normalize();
    const R = DISPLAY_RADII.earth || 5.2;
    targetVec.addScaledVector(camRight, -R * 0.72);
  }

  return targetVec;
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
  const lastTargetBodyRef = useRef(selectedBody);
  const lastViewModeRef = useRef(viewMode);
  const lastEnabledRef = useRef(enabled);
  const isTransitioningRef = useRef(false);
  const transitionProgressRef = useRef(1.0);
  const transitionStartCamPosRef = useRef(new THREE.Vector3());
  const transitionStartTargetRef = useRef(new THREE.Vector3());
  const previousTargetPosRef = useRef(new THREE.Vector3());
  const driftTimeRef = useRef(0);

  // -------------------------------------------------------------------------
  // EARTH SURFACE MODE STATE & REFS
  // -------------------------------------------------------------------------
  const [inSurfaceMode, setInSurfaceMode] = useState(false);
  const surfaceLatRef = useRef(40.7128); // Default: New York
  const surfaceLonRef = useRef(-74.0060);
  const surfaceAltKmRef = useRef(1200.0);
  const surfacePitchRef = useRef(0.85); // 0 = straight down, ~1.4 = horizon grazing
  const surfaceAzimuthRef = useRef(0.0); // Heading
  const isDraggingRef = useRef(false);
  const dragButtonRef = useRef(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const mouseNormRef = useRef({ x: 0, y: 0 });
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

  // Handle return to orbit command from HUD
  useEffect(() => {
    if (returnToOrbitCounter > 0 && selectedBody === 'earth') {
      setInSurfaceMode(false);
      setIsSurfaceMode(false);
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0.0;
      transitionStartCamPosRef.current.copy(camera.position);
      if (controlsRef.current) {
        transitionStartTargetRef.current.copy(controlsRef.current.target);
      }
    }
  }, [returnToOrbitCounter, selectedBody, camera, setIsSurfaceMode]);

  // Handle fly-to landmark command from HUD
  useEffect(() => {
    if (flyToTarget && selectedBody === 'earth') {
      const startLat = surfaceLatRef.current;
      const startLon = surfaceLonRef.current;
      const startAlt = surfaceAltKmRef.current;
      const targetLat = flyToTarget.lat;
      const targetLon = flyToTarget.lon;
      const targetAlt = flyToTarget.altitudeKm || 2.0; // default 2 km

      setInSurfaceMode(true);
      setIsSurfaceMode(true);

      surfaceFlyAnimRef.current = {
        startTime: performance.now(),
        duration: flyToTarget.duration || 2200,
        startLat,
        startLon,
        startAlt,
        targetLat,
        targetLon,
        targetAlt
      };
      clearFlyTo();
    }
  }, [flyToTarget, selectedBody, clearFlyTo, setIsSurfaceMode]);

  // -------------------------------------------------------------------------
  // MOUSE & POINTER LISTENERS FOR SURFACE MODE
  // -------------------------------------------------------------------------
  const raycastEarthSurface = useCallback(
    (clientX, clientY) => {
      const rect = gl.domElement.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((clientY - rect.top) / rect.height) * 2 + 1;

      const earthMesh = window.__earthBodyMesh;
      if (!earthMesh) return null;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
      const intersects = raycaster.intersectObject(earthMesh, false);
      if (intersects.length > 0) {
        const hitWorld = intersects[0].point;
        const invMatrix = new THREE.Matrix4().copy(earthMesh.matrixWorld).invert();
        const hitLocal = hitWorld.clone().applyMatrix4(invMatrix);
        return earthCoordsToLatLon(hitLocal, 3.5);
      }
      return null;
    },
    [camera, gl]
  );

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseNormRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNormRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!isDraggingRef.current || selectedBody !== 'earth' || !inSurfaceMode) return;

      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const alt = surfaceAltKmRef.current;
      const degPerPx = Math.max(0.00005, (alt / 6371.0) * 0.45);

      if (dragButtonRef.current === 0 && !e.shiftKey && !e.ctrlKey) {
        // Left drag: pan across Earth surface
        const cosLat = Math.max(0.1, Math.cos((surfaceLatRef.current * Math.PI) / 180));
        surfaceLonRef.current = (surfaceLonRef.current - (dx * degPerPx) / cosLat) % 360;
        surfaceLatRef.current = Math.max(-85, Math.min(85, surfaceLatRef.current + dy * degPerPx));
      } else {
        // Right drag or Shift/Ctrl+drag: tilt pitch & yaw heading
        surfacePitchRef.current = Math.max(0.12, Math.min(1.48, surfacePitchRef.current + dy * 0.004));
        surfaceAzimuthRef.current = (surfaceAzimuthRef.current - dx * 0.004) % (Math.PI * 2);
      }
    };

    const handlePointerDown = (e) => {
      if (selectedBody !== 'earth' || !inSurfaceMode) return;
      isDraggingRef.current = true;
      dragButtonRef.current = e.button;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e) => {
      if (selectedBody !== 'earth') return;

      const earthPos = bodyPositions.earth || [0, 0, 0];
      const earthVec = new THREE.Vector3(...earthPos);
      const dist = camera.position.distanceTo(earthVec);

      // Descending into surface mode from orbit
      if (!inSurfaceMode && e.deltaY < 0 && dist < 6.0) {
        const hit = raycastEarthSurface(e.clientX, e.clientY);
        if (hit) {
          surfaceLatRef.current = hit.lat;
          surfaceLonRef.current = hit.lon;
        } else if (window.__earthBodyMesh) {
          const invMatrix = new THREE.Matrix4().copy(window.__earthBodyMesh.matrixWorld).invert();
          const camLocal = camera.position.clone().applyMatrix4(invMatrix);
          const coords = earthCoordsToLatLon(camLocal, 3.5);
          surfaceLatRef.current = coords.lat;
          surfaceLonRef.current = coords.lon;
        }
        setInSurfaceMode(true);
        setIsSurfaceMode(true);
        // Start surface altitude at 1,800 km so satellite tiles immediately transition in
        surfaceAltKmRef.current = Math.min(2200.0, Math.max(0.15, (dist - 3.5) * 1820.0));
        return;
      }

      // Inside surface mode: continuous altitude zoom with zoom-to-cursor
      if (inSurfaceMode) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.25 : 0.80;
        let newAlt = surfaceAltKmRef.current * factor;

        // On zoom in, also nudge latitude & longitude toward cursor location
        if (e.deltaY < 0) {
          const hit = raycastEarthSurface(e.clientX, e.clientY);
          if (hit) {
            surfaceLatRef.current = THREE.MathUtils.lerp(surfaceLatRef.current, hit.lat, 0.18);
            surfaceLonRef.current = THREE.MathUtils.lerp(surfaceLonRef.current, hit.lon, 0.18);
          }
        }

        // Clamp minimum altitude: 150m (0.15 km) when 3D tiles unavailable, 20m if active
        const minFloor = tier2Status === 'active' ? 0.02 : 0.15;
        newAlt = Math.max(minFloor, newAlt);

        // Zooming out past 2,800 km returns to orbit mode seamlessly
        if (newAlt > 2800) {
          setInSurfaceMode(false);
          setIsSurfaceMode(false);
          return;
        }

        surfaceAltKmRef.current = newAlt;
      }
    };

    const handleDblClick = (e) => {
      if (selectedBody !== 'earth') return;
      const hit = raycastEarthSurface(e.clientX, e.clientY);
      if (hit) {
        setInSurfaceMode(true);
        setIsSurfaceMode(true);
        surfaceFlyAnimRef.current = {
          startTime: performance.now(),
          duration: 2200,
          startLat: surfaceLatRef.current,
          startLon: surfaceLonRef.current,
          startAlt: inSurfaceMode ? surfaceAltKmRef.current : 2200,
          targetLat: hit.lat,
          targetLon: hit.lon,
          targetAlt: 1.5 // Descend to 1.5 km street/aerial level!
        };
      }
    };

    const handleContextMenu = (e) => {
      if (selectedBody === 'earth' && inSurfaceMode) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('dblclick', handleDblClick);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDblClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [selectedBody, inSurfaceMode, bodyPositions, camera, gl, raycastEarthSurface, setIsSurfaceMode]);

  // Detect when user selects a different body or switches view mode
  useEffect(() => {
    if (!enabled) return;

    if (selectedBody !== lastTargetBodyRef.current || viewMode !== lastViewModeRef.current || lastEnabledRef.current !== enabled) {
      lastTargetBodyRef.current = selectedBody;
      lastViewModeRef.current = viewMode;
      lastEnabledRef.current = enabled;
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0.0;
      setInSurfaceMode(false);
      setIsSurfaceMode(false);

      if (controlsRef.current) {
        transitionStartTargetRef.current.copy(controlsRef.current.target);
      }
      transitionStartCamPosRef.current.copy(camera.position);

      const curBodyPos = bodyPositions[selectedBody] || [0, 0, 0];
      previousTargetPosRef.current.set(...curBodyPos);
    }
  }, [selectedBody, viewMode, enabled, bodyPositions, camera, setIsSurfaceMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__threeCamera = camera;
    }
  }, [camera]);

  // -------------------------------------------------------------------------
  // MAIN FRAME LOOP
  // -------------------------------------------------------------------------
  // Priority 1 ensures camera frame updates strictly AFTER orbital body positions
  useFrame((_, delta) => {
    if (!enabled || !controlsRef.current) return;
    if (typeof window !== 'undefined') {
      window.__threeControls = controlsRef.current;
    }

    const controls = controlsRef.current;
    const isOverview = !selectedBody || selectedBody === 'overview';

    let activeKey = selectedBody;
    if (isOverview) {
      activeKey = viewMode === 'scientific' ? 'scientific_overview' : 'cinematic_overview';
    }
    const cfg = BODY_VIEW_CONFIGS[activeKey] || BODY_VIEW_CONFIGS.overview;

    const currentBodyCoords = isOverview ? [0, 0, 0] : bodyPositions[selectedBody] || [0, 0, 0];
    const currentBodyVec = new THREE.Vector3(...currentBodyCoords);

    // -----------------------------------------------------------------------
    // A. EARTH SURFACE NAVIGATION MODE (Synchronous Rotation Lock & Floating Camera)
    // -----------------------------------------------------------------------
    if (selectedBody === 'earth' && inSurfaceMode) {
      controls.enabled = false;

      // Handle animated flight to landmark or double-clicked point
      if (surfaceFlyAnimRef.current) {
        const anim = surfaceFlyAnimRef.current;
        const elapsed = performance.now() - anim.startTime;
        const t = Math.min(1.0, elapsed / anim.duration);
        const ease = 1 - Math.pow(1 - t, 4);

        surfaceLatRef.current = THREE.MathUtils.lerp(anim.startLat, anim.targetLat, ease);
        surfaceLonRef.current = THREE.MathUtils.lerp(anim.startLon, anim.targetLon, ease);
        surfaceAltKmRef.current = THREE.MathUtils.lerp(anim.startAlt, anim.targetAlt, ease);

        if (t >= 1.0) {
          surfaceFlyAnimRef.current = null;
        }
      }

      const earthMesh = window.__earthBodyMesh;
      if (earthMesh) {
        const R = DISPLAY_RADII.earth || 5.2;
        const lat = surfaceLatRef.current;
        const lon = surfaceLonRef.current;
        const altKm = surfaceAltKmRef.current;
        setAltitudeKm(altKm);

        // Adjust camera near plane dynamically for sub-kilometer altitudes
        const neededNear = Math.max(0.00002, (altKm / 6371.0) * 0.05);
        if (Math.abs(camera.near - neededNear) > 0.00001) {
          camera.near = neededNear;
          camera.updateProjectionMatrix();
        }

        const altUnits = (altKm / 6371.0) * R;

        // Evaluate ground target position in Earth's local coordinate frame
        const groundLocal = latLonToEarthCoords(lat, lon, 0, R);
        const normal = groundLocal.clone().normalize();

        // Local East-North-Up vectors on Earth sphere
        const upVec = new THREE.Vector3(0, 1, 0);
        const east = new THREE.Vector3().crossVectors(upVec, normal).normalize();
        if (east.lengthSq() < 0.001) east.set(1, 0, 0);
        const north = new THREE.Vector3().crossVectors(normal, east).normalize();

        const pitch = surfacePitchRef.current;
        const azimuth = surfaceAzimuthRef.current;

        // Compute local camera direction vector (offset from ground normal)
        const camDir = new THREE.Vector3()
          .addScaledVector(north, Math.sin(pitch) * Math.cos(azimuth))
          .addScaledVector(east, Math.sin(pitch) * Math.sin(azimuth))
          .addScaledVector(normal, Math.cos(pitch))
          .normalize();

        const camLocal = groundLocal.clone().addScaledVector(camDir, altUnits);

        // Compute camera orientation in Earth's local coordinate frame
        // This completely avoids world-space floating point cancellation!
        const localLookMat = new THREE.Matrix4().lookAt(camLocal, groundLocal, north);
        const localQuat = new THREE.Quaternion().setFromRotationMatrix(localLookMat);

        const earthWorldQuat = new THREE.Quaternion();
        earthMesh.getWorldQuaternion(earthWorldQuat);

        camera.quaternion.multiplyQuaternions(earthWorldQuat, localQuat);
        camera.position.copy(camLocal.clone().applyMatrix4(earthMesh.matrixWorld));

        const worldTarget = groundLocal.clone().applyMatrix4(earthMesh.matrixWorld);
        controls.target.copy(worldTarget);
      }
      return;
    }

    // Restore standard camera near plane & up in orbit
    if (camera.near !== 0.1 || camera.up.y !== 1) {
      camera.near = 0.1;
      camera.up.set(0, 1, 0);
      camera.updateProjectionMatrix();
    }
    controls.enabled = enabled;

    // -----------------------------------------------------------------------
    // B. SMOOTH TRANSITION PHASE (Switching Planets or Modes)
    // -----------------------------------------------------------------------
    if (isTransitioningRef.current) {
      transitionProgressRef.current += delta * 1.25;
      const t = Math.min(1.0, transitionProgressRef.current);
      // Hermite smoothstep cubic ease: zero overshoot, zero velocity discontinuity
      const ease = t * t * (3.0 - 2.0 * t);

      const targetCamOffset = getCinematicBodyCamOffset(selectedBody, currentBodyVec, cfg, viewMode);
      const destinationCamPos = new THREE.Vector3().addVectors(currentBodyVec, targetCamOffset);
      const destinationTarget = getCinematicBodyCamTarget(selectedBody, currentBodyVec, cfg, targetCamOffset);

      controls.enableDamping = false;
      camera.position.lerpVectors(transitionStartCamPosRef.current, destinationCamPos, ease);
      controls.target.lerpVectors(transitionStartTargetRef.current, destinationTarget, ease);
      controls.update();

      if (t >= 1.0) {
        camera.position.copy(destinationCamPos);
        controls.target.copy(destinationTarget);
        controls.update();
        controls.enableDamping = isOverview; // Only overview uses damping; moving planets use rigid tracking
        isTransitioningRef.current = false;
        previousTargetPosRef.current.copy(destinationTarget);
      }
      return;
    }

    // -----------------------------------------------------------------------
    // C. CONTINUOUS TRACKING PHASE
    // -----------------------------------------------------------------------
    if (!isOverview) {
      // Disable competing damping during active tracking of orbiting planets to eliminate shake
      controls.enableDamping = false;
      const activeCamOffset = getCinematicBodyCamOffset(selectedBody, currentBodyVec, cfg, viewMode);
      const currentTarget = getCinematicBodyCamTarget(selectedBody, currentBodyVec, cfg, activeCamOffset);
      const targetDelta = new THREE.Vector3().subVectors(currentTarget, previousTargetPosRef.current);

      if (targetDelta.lengthSq() > 0.000001) {
        camera.position.add(targetDelta);
        controls.target.copy(currentTarget);
        previousTargetPosRef.current.copy(currentTarget);
        controls.update();
      }
    } else {
      controls.enableDamping = true;
      if (viewMode === 'cinematic' && !isUserInteracting) {
        driftTimeRef.current += delta;
        const driftSpeed = 0.22;
        camera.position.x += Math.cos(driftTimeRef.current * 0.06) * delta * driftSpeed;
        camera.position.z += Math.sin(driftTimeRef.current * 0.06) * delta * driftSpeed;
      }
      const desiredTarget = cfg.target ? new THREE.Vector3(...cfg.target) : new THREE.Vector3(0, 0, 0);
      controls.target.lerp(desiredTarget, 0.05);
    }

    controls.update();
  }, 1);

  const activeKey =
    !selectedBody || selectedBody === 'overview'
      ? viewMode === 'scientific'
        ? 'scientific_overview'
        : 'cinematic_overview'
      : selectedBody;
  const cfg = BODY_VIEW_CONFIGS[activeKey] || BODY_VIEW_CONFIGS.overview;

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled && !inSurfaceMode}
      enableDamping
      dampingFactor={0.06}
      enablePan={selectedBody === 'overview'}
      minDistance={cfg.minDist || 1.2}
      maxDistance={cfg.maxDist || 1800}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
    />
  );
}
