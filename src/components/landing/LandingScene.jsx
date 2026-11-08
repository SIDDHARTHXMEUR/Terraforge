import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HeroEarthSunrise } from './HeroEarthSunrise';
import { LandingStarfield } from './LandingStarfield';
import { ChapterPlanets3D } from './ChapterPlanets3D';
import { LineupSection3D } from './LineupSection3D';
import { OverviewSection3D } from './OverviewSection3D';

// Simulator overview pose
const SIM_CAM_POS = new THREE.Vector3(-320, 110, 310);
const SIM_CAM_TARGET = new THREE.Vector3(-65, 0, 48);

export function LandingScene({ scrollProgressRef }) {
  const { camera } = useThree();
  const heroGroupRef = useRef();

  useFrame(() => {
    const scrollP = scrollProgressRef?.current || 0;

    if (scrollP <= 1.0) {
      // CONTINUOUS HERO TO SOL CAMERA MOTION (Progress 0.0 -> 1.0)
      if (heroGroupRef.current) heroGroupRef.current.visible = true;
      const t = THREE.MathUtils.clamp(scrollP, 0, 1);
      const easeT = THREE.MathUtils.smootherstep(t, 0, 1);

      const startCamPos = new THREE.Vector3(0, 1.2, 5.0);
      const endCamPos = new THREE.Vector3(0, 0, 7.2);
      camera.position.lerpVectors(startCamPos, endCamPos, easeT);

      const startTarget = new THREE.Vector3(0, 0.1, 0);
      const endTarget = new THREE.Vector3(0.7, 0, 0);
      const curTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, easeT);
      camera.lookAt(curTarget);
    } else if (scrollP < 6.4) {
      // SECTIONS 2 to 7: CHAPTERS
      if (heroGroupRef.current) heroGroupRef.current.visible = false;
      camera.position.set(0, 0, 7.2);
      camera.lookAt(0.7, 0, 0);
    } else if (scrollP < 7.4) {
      // SECTION 8: LINEUP HORIZONTAL DOLLY
      if (heroGroupRef.current) heroGroupRef.current.visible = false;
      const sub = THREE.MathUtils.clamp((scrollP - 6.4) / 1.0, 0, 1);
      const camX = THREE.MathUtils.lerp(-4.0, 16.0, sub);
      camera.position.set(camX, 0, 11.5);
      camera.lookAt(camX, 0, 0);
    } else {
      // SECTION 9: THE SYSTEM (Smooth pull-back landing exactly on simulator overview pose)
      if (heroGroupRef.current) heroGroupRef.current.visible = false;
      const t = THREE.MathUtils.clamp((scrollP - 7.4) / 0.6, 0, 1);
      const easeT = THREE.MathUtils.smootherstep(t, 0, 1);

      // Start from lineup end pose and transition smoothly to simulator overview pose
      const startPos = new THREE.Vector3(16.0, 0, 11.5);
      const startTarget = new THREE.Vector3(16.0, 0, 0);

      camera.position.lerpVectors(startPos, SIM_CAM_POS, easeT);
      const curTarget = new THREE.Vector3().lerpVectors(startTarget, SIM_CAM_TARGET, easeT);
      camera.lookAt(curTarget);
    }
  });

  return (
    <>
      <LandingStarfield count={2800} />

      {/* Hero Earth Sunrise (Section 1) */}
      <group ref={heroGroupRef}>
        <HeroEarthSunrise scrollProgressRef={scrollProgressRef} isVisible={true} />
      </group>

      {/* Chapters 1 to 6 3D Planets & Ghost Words (Sections 2 to 7) */}
      <ChapterPlanets3D scrollProgressRef={scrollProgressRef} />

      {/* Section 8: True Relative Scale Lineup */}
      <LineupSection3D scrollProgressRef={scrollProgressRef} />

      {/* Section 9: The System & Orbit Ignition */}
      <OverviewSection3D scrollProgressRef={scrollProgressRef} />
    </>
  );
}
