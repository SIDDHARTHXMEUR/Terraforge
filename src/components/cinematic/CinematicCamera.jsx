import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export function CinematicCamera({
  selectedBody = 'overview',
  targetPosition = [0, 0, 0],
  targetRadius = 2.0,
  isCinematicTour = false,
  onNextTourStep,
  cameraResetCount = 0
}) {
  const controlsRef = useRef();
  const cameraRef = useRef();

  // Transition state
  const animRef = useRef({
    active: false,
    startTime: 0,
    duration: 1600,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3()
  });

  // Calculate cinematic target position and lookAt target for a body
  const getCameraGoal = (bodyId, pos, radius) => {
    const target = new THREE.Vector3(...pos);
    let cameraPos;

    if (bodyId === 'overview') {
      // Elevated panoramic view of the entire solar system
      cameraPos = new THREE.Vector3(0, 95, 145);
    } else if (bodyId === 'sun') {
      // Close inspection of solar granulation & corona
      cameraPos = new THREE.Vector3(0, 16, 28);
    } else if (bodyId === 'saturn') {
      // High-angle framing showcasing Saturn's rings & ring divisions
      cameraPos = target.clone().add(new THREE.Vector3(0, radius * 1.8, radius * 3.4));
    } else if (bodyId === 'earth') {
      // Day/night terminator framing with Moon in view
      cameraPos = target.clone().add(new THREE.Vector3(radius * 1.8, radius * 1.1, radius * 2.8));
    } else if (bodyId === 'jupiter') {
      // Great Red Spot close-up
      cameraPos = target.clone().add(new THREE.Vector3(0, radius * 1.2, radius * 2.8));
    } else {
      // General planet close-up
      cameraPos = target.clone().add(new THREE.Vector3(0, radius * 1.1, radius * 2.7));
    }

    return { cameraPos, target };
  };

  // Trigger smooth transition whenever selected body or camera reset triggers
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    const currentPos = cameraRef.current.position.clone();
    const currentTarget = controlsRef.current.target.clone();

    const { cameraPos: goalPos, target: goalTarget } = getCameraGoal(selectedBody, targetPosition, targetRadius);

    animRef.current = {
      active: true,
      startTime: performance.now(),
      duration: selectedBody === 'overview' ? 1800 : 1500,
      startPos: currentPos,
      endPos: goalPos,
      startTarget: currentTarget,
      endTarget: goalTarget
    };
  }, [selectedBody, cameraResetCount]);

  // Frame loop handling smooth lerp and continuous tracking
  useFrame(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    // 1. Smooth flying transition
    if (animRef.current.active) {
      const elapsed = performance.now() - animRef.current.startTime;
      const progress = Math.min(1.0, elapsed / animRef.current.duration);
      // Cinematic cubic ease-out
      const ease = 1.0 - Math.pow(1.0 - progress, 3);

      cameraRef.current.position.lerpVectors(
        animRef.current.startPos,
        animRef.current.endPos,
        ease
      );

      controlsRef.current.target.lerpVectors(
        animRef.current.startTarget,
        animRef.current.endTarget,
        ease
      );

      controlsRef.current.update();

      if (progress >= 1.0) {
        animRef.current.active = false;
      }
    } else if (selectedBody !== 'overview') {
      // When tracking an individual planet as it revolves along its orbit:
      // Gently maintain camera focus target at the planet's current world coordinates
      const currentTarget = controlsRef.current.target;
      const destTarget = new THREE.Vector3(...targetPosition);
      const delta = destTarget.clone().sub(currentTarget);

      if (delta.length() > 0.001) {
        currentTarget.add(delta.clone().multiplyScalar(0.1));
        cameraRef.current.position.add(delta.clone().multiplyScalar(0.1));
        controlsRef.current.update();
      }
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 95, 145]}
        fov={45}
        near={0.1}
        far={50000}
      />
      <OrbitControls
        ref={controlsRef}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={2.0}
        maxDistance={25000}
        makeDefault
      />
    </>
  );
}

