import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const BODY_VIEW_CONFIGS = {
  cinematic_overview: {
    offset: [-320, 110, 310], // Sun cropped upper-left, gas giants in foreground, majestic diagonal depth
    target: [-65, 0, 48],
    minDist: 50,
    maxDist: 3500
  },
  scientific_overview: {
    offset: [0, 850, 0.01], // Top-down heliocentric Keplerian orbital diagram
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
    offset: [35, 18, 140], // Sun fills ~35% of frame, slightly off-centre with corona fading smoothly into black
    target: [-10, 0, 0],
    minDist: 70,
    maxDist: 1500
  },
  mercury: {
    distance: 6.8,
    terminatorAngle: 52, // dramatic crescent raking light
    elevAngle: 14,
    minDist: 3.5,
    maxDist: 180
  },
  venus: {
    distance: 9.6,
    terminatorAngle: 54, // dramatic crescent with creamy limb
    elevAngle: 16,
    minDist: 4.8,
    maxDist: 220
  },
  earth: {
    distance: 10.5,
    terminatorAngle: 22, // Frames sunlit hemisphere (oceans, continents, clouds, terminator on edge)
    elevAngle: 18,
    minDist: 5.2,
    maxDist: 250
  },
  mars: {
    distance: 7.8,
    terminatorAngle: 42, // raking relief over Olympus Mons
    elevAngle: 16,
    minDist: 3.8,
    maxDist: 200
  },
  asteroids: {
    distance: 4.5,
    terminatorAngle: 35,
    elevAngle: 16,
    minDist: 1.8,
    maxDist: 150
  },
  jupiter: {
    distance: 38.0,
    terminatorAngle: 32, // monumental scale & atmospheric bands
    elevAngle: 14,
    minDist: 18.0,
    maxDist: 650
  },
  saturn: {
    distance: 38.0,
    terminatorAngle: 46, // sunlit ring plane with backlit forward-scatter & ringshine
    elevAngle: 22,
    minDist: 18.0,
    maxDist: 750
  },
  uranus: {
    distance: 19.5,
    terminatorAngle: 36, // displays vertical ice rings
    elevAngle: 24,
    minDist: 9.5,
    maxDist: 450
  },
  neptune: {
    distance: 18.5,
    terminatorAngle: 34, // cobalt storm envelope & cirrus
    elevAngle: 18,
    minDist: 9.0,
    maxDist: 450
  }
};

// Computes cinematic hero framing offset positioned along the sunlit hemisphere
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

export function InteractiveSolarCamera({
  selectedBody = 'overview',
  viewMode = 'cinematic',
  bodyPositions = {},
  isUserInteracting = false,
  enabled = true
}) {
  const { camera } = useThree();
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

  // Detect when user selects a different body or switches view mode
  useEffect(() => {
    if (!enabled) return;

    if (selectedBody !== lastTargetBodyRef.current || viewMode !== lastViewModeRef.current || lastEnabledRef.current !== enabled) {
      lastTargetBodyRef.current = selectedBody;
      lastViewModeRef.current = viewMode;
      lastEnabledRef.current = enabled;
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0.0;

      if (controlsRef.current) {
        transitionStartTargetRef.current.copy(controlsRef.current.target);
      }
      transitionStartCamPosRef.current.copy(camera.position);

      const curBodyPos = bodyPositions[selectedBody] || [0, 0, 0];
      previousTargetPosRef.current.set(...curBodyPos);
    }
  }, [selectedBody, viewMode, enabled, bodyPositions, camera]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__threeCamera = camera;
    }
  }, [camera]);

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

    const currentBodyCoords = isOverview
      ? [0, 0, 0]
      : (bodyPositions[selectedBody] || [0, 0, 0]);
    const currentBodyVec = new THREE.Vector3(...currentBodyCoords);

    // 1. Smooth Transition Phase when user clicks a new planet or toggles view mode
    if (isTransitioningRef.current) {
      transitionProgressRef.current += delta * 1.35;
      const t = Math.min(1.0, transitionProgressRef.current);
      // Film-grade quintic ease-out for majestic decelerating camera arrival
      const ease = 1 - Math.pow(1 - t, 5);

      const targetCamOffset = getCinematicBodyCamOffset(selectedBody, currentBodyVec, cfg, viewMode);
      const destinationCamPos = new THREE.Vector3().addVectors(currentBodyVec, targetCamOffset);
      const destinationTarget = cfg.target ? new THREE.Vector3(...cfg.target) : currentBodyVec;

      controls.enableDamping = false;
      camera.position.lerpVectors(transitionStartCamPosRef.current, destinationCamPos, ease);
      controls.target.lerpVectors(transitionStartTargetRef.current, destinationTarget, ease);
      controls.update();

      if (t >= 1.0) {
        camera.position.copy(destinationCamPos);
        controls.target.copy(destinationTarget);
        controls.update();
        controls.enableDamping = true;
        isTransitioningRef.current = false;
        previousTargetPosRef.current.copy(destinationTarget);
      }
      return;
    }

    // 2. Continuous Tracking Phase
    if (!isOverview) {
      // Planet is moving in orbit: track its motion in world coordinates
      const targetDelta = new THREE.Vector3().subVectors(currentBodyVec, previousTargetPosRef.current);

      if (targetDelta.lengthSq() > 0.000001) {
        camera.position.add(targetDelta);
        controls.target.copy(currentBodyVec);
        previousTargetPosRef.current.copy(currentBodyVec);
        controls.update();
      }
    } else {
      // In overview mode:
      if (viewMode === 'cinematic' && !isUserInteracting) {
        // Slow subtle 18s cinematic dolly drift
        driftTimeRef.current += delta;
        const driftSpeed = 0.22;
        camera.position.x += Math.cos(driftTimeRef.current * 0.06) * delta * driftSpeed;
        camera.position.z += Math.sin(driftTimeRef.current * 0.06) * delta * driftSpeed;
      }
      const desiredTarget = cfg.target ? new THREE.Vector3(...cfg.target) : new THREE.Vector3(0, 0, 0);
      controls.target.lerp(desiredTarget, 0.05);
    }

    controls.update();
  });

  const activeKey = (!selectedBody || selectedBody === 'overview')
    ? (viewMode === 'scientific' ? 'scientific_overview' : 'cinematic_overview')
    : selectedBody;
  const cfg = BODY_VIEW_CONFIGS[activeKey] || BODY_VIEW_CONFIGS.overview;

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
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
