import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

export function CameraRig({ cameraMode, cameraResetCount, cameraPunchCount, isTrueScale }) {
  const controlsRef = useRef();
  const perspCamRef = useRef();
  const orthoCamRef = useRef();

  const punchAnimRef = useRef({ active: false, startTime: 0 });
  const prevTrueScaleRef = useRef(isTrueScale);
  const trueScaleAnimRef = useRef({
    active: false,
    startTime: 0,
    startPos: new THREE.Vector3(),
    targetPos: new THREE.Vector3()
  });

  // Default initial camera position
  const defaultPos = [12, 6, 22];

  // Reset Camera Position action
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
      if (perspCamRef.current) {
        perspCamRef.current.position.set(...defaultPos);
      }
    }
  }, [cameraResetCount]);

  // Handle Preset Switch Camera Punch-in Pulse
  useEffect(() => {
    if (cameraPunchCount === 0) return;
    punchAnimRef.current = {
      active: true,
      startTime: performance.now()
    };
  }, [cameraPunchCount]);

  // Handle True Scale Mode Toggle Transition (Smooth 1.5s camera pullback)
  useEffect(() => {
    if (prevTrueScaleRef.current === isTrueScale) return;
    prevTrueScaleRef.current = isTrueScale;

    if (perspCamRef.current) {
      const start = perspCamRef.current.position.clone();
      const target = isTrueScale
        ? new THREE.Vector3(0, 150, 450)
        : new THREE.Vector3(...defaultPos);

      trueScaleAnimRef.current = {
        active: true,
        startTime: performance.now(),
        startPos: start,
        targetPos: target
      };
    }
  }, [isTrueScale]);

  // Frame-by-frame animation (ONLY runs during True Scale transition so OrbitControls remains 100% free!)
  useFrame(() => {
    // 1. True Scale Toggle Camera Transition
    if (trueScaleAnimRef.current.active && perspCamRef.current) {
      const elapsed = performance.now() - trueScaleAnimRef.current.startTime;
      const duration = 1500;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      perspCamRef.current.position.lerpVectors(
        trueScaleAnimRef.current.startPos,
        trueScaleAnimRef.current.targetPos,
        ease
      );

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
      }

      if (progress >= 1) {
        trueScaleAnimRef.current.active = false;
      }
    }
  });

  // Align controls target when switching camera mode
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [cameraMode]);

  return (
    <>
      {/* SYLLABUS: Topic 3 - 3D Viewing & Projections (Perspective vs Orthographic Camera Rig) */}
      {cameraMode === 'perspective' ? (
        <PerspectiveCamera
          ref={perspCamRef}
          makeDefault
          position={defaultPos}
          fov={45}
          near={0.1}
          far={30000}
        />
      ) : (
        <OrthographicCamera
          ref={orthoCamRef}
          makeDefault
          position={defaultPos}
          zoom={isTrueScale ? 1.5 : 24}
          near={0.1}
          far={30000}
        />
      )}

      {/* OrbitControls with 100% UNCONSTRAINED FREE ROTATION in every axis */}
      <OrbitControls
        ref={controlsRef}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={2.0}
        maxDistance={12000}
        makeDefault
      />
    </>
  );
}
