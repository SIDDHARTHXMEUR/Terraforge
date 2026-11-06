import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const BODY_VIEW_CONFIGS = {
  overview: {
    offset: [0, 140, 220],
    target: [0, 0, 0],
    minDist: 10,
    maxDist: 1800
  },
  sun: {
    offset: [0, 8, 34],
    minDist: 14,
    maxDist: 350
  },
  mercury: {
    distance: 2.8,
    minDist: 1.1,
    maxDist: 80
  },
  venus: {
    distance: 4.6,
    minDist: 2.0,
    maxDist: 120
  },
  earth: {
    distance: 5.0,
    minDist: 2.1,
    maxDist: 140
  },
  mars: {
    distance: 3.4,
    minDist: 1.4,
    maxDist: 100
  },
  asteroids: {
    distance: 4.5,
    minDist: 1.0,
    maxDist: 120
  },
  jupiter: {
    distance: 14.5,
    minDist: 5.5,
    maxDist: 250
  },
  saturn: {
    distance: 13.0,
    minDist: 4.8,
    maxDist: 250
  },
  uranus: {
    distance: 7.8,
    minDist: 3.0,
    maxDist: 160
  },
  neptune: {
    distance: 7.8,
    minDist: 3.0,
    maxDist: 160
  }
};

// Computes cinematic framing offset positioned along the sunlit hemisphere
// with a 32° terminator phase angle and 16° orbital elevation.
function getCinematicBodyCamOffset(selectedBody, bodyPos, cfg) {
  if (selectedBody === 'overview' || selectedBody === 'sun' || !cfg.distance) {
    return new THREE.Vector3(...(cfg.offset || [0, 140, 220]));
  }

  const toSun = new THREE.Vector3().sub(bodyPos);
  if (toSun.lengthSq() < 0.1) {
    return new THREE.Vector3(0, cfg.distance * 0.3, cfg.distance);
  }
  toSun.normalize();

  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3().crossVectors(up, toSun).normalize();

  const D = cfg.distance;
  const terminatorAngle = (32 * Math.PI) / 180;
  const elevAngle = (16 * Math.PI) / 180;

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
  bodyPositions = {},
  isUserInteracting = false
}) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const lastTargetBodyRef = useRef(selectedBody);
  const isTransitioningRef = useRef(false);
  const transitionProgressRef = useRef(1.0);
  const transitionStartCamPosRef = useRef(new THREE.Vector3());
  const transitionStartTargetRef = useRef(new THREE.Vector3());
  const previousTargetPosRef = useRef(new THREE.Vector3());

  // Detect when user selects a different body
  useEffect(() => {
    if (selectedBody !== lastTargetBodyRef.current) {
      lastTargetBodyRef.current = selectedBody;
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0.0;

      if (controlsRef.current) {
        transitionStartTargetRef.current.copy(controlsRef.current.target);
      }
      transitionStartCamPosRef.current.copy(camera.position);

      const curBodyPos = bodyPositions[selectedBody] || [0, 0, 0];
      previousTargetPosRef.current.set(...curBodyPos);
    }
  }, [selectedBody, bodyPositions, camera]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    const isOverview = !selectedBody || selectedBody === 'overview';
    const cfg = BODY_VIEW_CONFIGS[selectedBody] || BODY_VIEW_CONFIGS.overview;

    const currentBodyCoords = isOverview
      ? [0, 0, 0]
      : (bodyPositions[selectedBody] || [0, 0, 0]);
    const currentBodyVec = new THREE.Vector3(...currentBodyCoords);

    // 1. Smooth Transition Phase when user clicks a new planet
    if (isTransitioningRef.current) {
      transitionProgressRef.current += delta * 1.8;
      const t = Math.min(1.0, transitionProgressRef.current);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      const targetCamOffset = getCinematicBodyCamOffset(selectedBody, currentBodyVec, cfg);
      const destinationCamPos = new THREE.Vector3().addVectors(currentBodyVec, targetCamOffset);

      camera.position.lerpVectors(transitionStartCamPosRef.current, destinationCamPos, ease);
      controls.target.lerpVectors(transitionStartTargetRef.current, currentBodyVec, ease);
      controls.update();

      if (t >= 1.0) {
        isTransitioningRef.current = false;
        previousTargetPosRef.current.copy(currentBodyVec);
      }
      return;
    }

    // 2. Continuous Tracking Phase
    if (!isOverview) {
      // Planet is moving in orbit: track its motion in world coordinates
      const targetDelta = new THREE.Vector3().subVectors(currentBodyVec, previousTargetPosRef.current);

      if (targetDelta.lengthSq() > 0.000001) {
        // Shift camera along with moving body so orbit controls remain centered
        camera.position.add(targetDelta);
        controls.target.copy(currentBodyVec);
        previousTargetPosRef.current.copy(currentBodyVec);
        controls.update();
      }
    } else {
      // In solar overview, ensure target stays centered at origin
      controls.target.set(0, 0, 0);
    }

    // Always update controls with damping
    controls.update();
  });

  const cfg = BODY_VIEW_CONFIGS[selectedBody] || BODY_VIEW_CONFIGS.overview;

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      enablePan={selectedBody === 'overview'}
      minDistance={cfg.minDist || 1.2}
      maxDistance={cfg.maxDist || 1500}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
    />
  );
}

