import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const BODY_VIEW_CONFIGS = {
  overview: {
    offset: [0, 140, 220],
    target: [0, 0, 0],
    minDist: 10,
    maxDist: 1500
  },
  sun: {
    offset: [0, 12, 38],
    minDist: 14,
    maxDist: 350
  },
  mercury: {
    offset: [0, 1.0, 3.2],
    minDist: 1.2,
    maxDist: 80
  },
  venus: {
    offset: [0, 1.8, 5.2],
    minDist: 2.2,
    maxDist: 120
  },
  earth: {
    offset: [0, 2.0, 6.2],
    minDist: 2.2,
    maxDist: 140
  },
  mars: {
    offset: [0, 1.4, 4.2],
    minDist: 1.5,
    maxDist: 100
  },
  asteroids: {
    offset: [0, 2.5, 6.5],
    minDist: 1.0,
    maxDist: 120
  },
  jupiter: {
    offset: [0, 5.0, 18.0],
    minDist: 6.0,
    maxDist: 250
  },
  saturn: {
    offset: [0, 6.5, 17.0],
    minDist: 5.0,
    maxDist: 250
  },
  uranus: {
    offset: [0, 3.2, 9.5],
    minDist: 3.2,
    maxDist: 160
  },
  neptune: {
    offset: [0, 3.2, 9.5],
    minDist: 3.2,
    maxDist: 160
  }
};

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

      const targetCamOffset = new THREE.Vector3(...cfg.offset);
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
