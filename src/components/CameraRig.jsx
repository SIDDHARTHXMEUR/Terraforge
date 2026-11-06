import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

export function CameraRig({
  cameraMode = 'perspective',
  cameraResetCount = 0,
  targetPosition = [0, 0, 0],
  targetDistance = 140,
  selectedBody = 'overview',
  isTrueScale = false
}) {
  const controlsRef = useRef();
  const perspCamRef = useRef();
  const orthoCamRef = useRef();

  // Animation state for smooth camera transitions
  const animRef = useRef({
    active: false,
    startTime: 0,
    duration: 1200,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3()
  });

  // Calculate target camera position based on targetPosition and targetDistance
  const computeEndPos = (pos, dist, body) => {
    const p = new THREE.Vector3(...pos);
    if (body === 'overview') {
      // High-angle majestic panoramic view of the entire solar system
      return isTrueScale
        ? new THREE.Vector3(0, 280, 520)
        : new THREE.Vector3(0, 110, 175);
    } else if (body === 'sun') {
      return new THREE.Vector3(0, 18, 38);
    } else if (body === 'saturn') {
      // Angled higher to clearly view Saturn's rings
      return p.clone().add(new THREE.Vector3(0, dist * 0.7, dist * 1.3));
    } else {
      // Standard planetary framing
      return p.clone().add(new THREE.Vector3(0, dist * 0.45, dist * 1.15));
    }
  };

  // Trigger camera fly-to animation whenever selected body or camera reset changes
  useEffect(() => {
    if (!perspCamRef.current || !controlsRef.current) return;

    const currentPos = perspCamRef.current.position.clone();
    const currentTarget = controlsRef.current.target.clone();

    const endTarget = new THREE.Vector3(...targetPosition);
    const endPos = computeEndPos(targetPosition, targetDistance, selectedBody);

    animRef.current = {
      active: true,
      startTime: performance.now(),
      duration: selectedBody === 'overview' ? 1400 : 1100,
      startPos: currentPos,
      endPos: endPos,
      startTarget: currentTarget,
      endTarget: endTarget
    };
  }, [selectedBody, cameraResetCount, isTrueScale]);

  // Smooth lerp frame loop
  useFrame(() => {
    if (animRef.current.active && perspCamRef.current && controlsRef.current) {
      const elapsed = performance.now() - animRef.current.startTime;
      const progress = Math.min(1, elapsed / animRef.current.duration);
      // Smooth cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      perspCamRef.current.position.lerpVectors(
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

      if (progress >= 1) {
        animRef.current.active = false;
      }
    }
  });

  return (
    <>
      {cameraMode === 'perspective' ? (
        <PerspectiveCamera
          ref={perspCamRef}
          makeDefault
          position={[0, 110, 175]}
          fov={45}
          near={0.1}
          far={40000}
        />
      ) : (
        <OrthographicCamera
          ref={orthoCamRef}
          makeDefault
          position={[0, 110, 175]}
          zoom={isTrueScale ? 1.5 : 8}
          near={0.1}
          far={40000}
        />
      )}

      {/* Unconstrained interactive OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={1.5}
        maxDistance={25000}
        makeDefault
      />
    </>
  );
}
