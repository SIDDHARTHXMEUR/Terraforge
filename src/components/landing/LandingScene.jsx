import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HeroEarthSunrise } from './HeroEarthSunrise';
import { LandingStarfield } from './LandingStarfield';
import { ChapterPlanets3D } from './ChapterPlanets3D';
import { LineupSection3D } from './LineupSection3D';
import { OverviewSection3D } from './OverviewSection3D';

// Simulator overview starting pose
const SIM_CAM_POS = new THREE.Vector3(-320, 110, 310);
const SIM_CAM_TARGET = new THREE.Vector3(-65, 0, 48);

export function LandingScene({ scrollProgressRef }) {
  const { camera } = useThree();
  const heroGroupRef = useRef();

  useFrame(() => {
    const scrollP = scrollProgressRef?.current || 0;

    if (scrollP <= 1.4) {
      // SECTION 01 & 02: HERO & REDESIGNED CALM SUN EMERGENCE
      if (heroGroupRef.current) heroGroupRef.current.visible = true;
      const easeT = THREE.MathUtils.smootherstep(THREE.MathUtils.clamp(scrollP, 0, 1.4), 0, 1.4);
      const camY = THREE.MathUtils.lerp(1.2, 2.0, easeT);
      const camZ = THREE.MathUtils.lerp(5.0, 7.8, easeT);
      const lookX = THREE.MathUtils.lerp(0.0, 0.7, easeT);
      camera.position.set(0, camY, camZ);
      camera.lookAt(lookX, 0.1, 0);
    } else if (scrollP < 9.5) {
      // SECTION 03: PLANETARY STORIES (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune)
      if (heroGroupRef.current) heroGroupRef.current.visible = false;
      camera.position.set(0, 0, 7.2);
      camera.lookAt(0.7, 0, 0);
    } else if (scrollP < 10.8) {
      // SECTION 04: PLANETARY MOTION & DYNAMICS
      if (heroGroupRef.current) heroGroupRef.current.visible = false;
      const sub = THREE.MathUtils.clamp((scrollP - 9.5) / 1.3, 0, 1);
      const camX = THREE.MathUtils.lerp(-4.0, 16.0, sub);
      camera.position.set(camX, 0, 11.5);
      camera.lookAt(camX, 0, 0);
    } else {
      // SECTION 05 & 06: SIMULATOR INTRODUCTION & FINAL CTA
      if (heroGroupRef.current) heroGroupRef.current.visible = false;
      const t = THREE.MathUtils.clamp((scrollP - 10.8) / 1.2, 0, 1);
      const easeT = THREE.MathUtils.smootherstep(t, 0, 1);

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

      {/* Hero Earth Sunrise & Calm Sun Emergence (Sections 1 & 2) */}
      <group ref={heroGroupRef}>
        <HeroEarthSunrise scrollProgressRef={scrollProgressRef} />
      </group>

      {/* Planetary Stories 3D Models & Ghost Words (Section 3: Mercury through Neptune) */}
      <ChapterPlanets3D scrollProgressRef={scrollProgressRef} />

      {/* Planetary Motion Lineup & Scale (Section 4) */}
      <LineupSection3D scrollProgressRef={scrollProgressRef} />

      {/* Simulator Overview & Orbit Ignition (Sections 5 & 6) */}
      <OverviewSection3D scrollProgressRef={scrollProgressRef} />
    </>
  );
}
