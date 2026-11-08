import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HeroEarthSunrise } from './HeroEarthSunrise';
import { LandingStarfield } from './LandingStarfield';
import { ChapterPlanets3D } from './ChapterPlanets3D';

export function LandingScene({ scrollProgressRef }) {
  const { camera } = useThree();
  const heroGroupRef = useRef();

  useFrame(() => {
    const scrollP = scrollProgressRef?.current || 0;

    if (scrollP <= 0.85) {
      // SECTION 1: HERO
      if (heroGroupRef.current) heroGroupRef.current.visible = true;
      const heroCamY = 1.2 + scrollP * 0.4;
      const heroCamZ = 5.0 + scrollP * 1.5;
      camera.position.set(0, heroCamY, heroCamZ);
      camera.lookAt(0, 0.1, 0);
    } else {
      // SECTIONS 2 to 7: CHAPTERS (Sol, Mercury, Earth, Mars, Jupiter, Saturn)
      if (heroGroupRef.current) heroGroupRef.current.visible = false;
      // Camera framed to balance left text (cols 2-5) and right planet (cols 6-12)
      camera.position.set(0, 0, 7.2);
      camera.lookAt(0.7, 0, 0);
    }
  });

  return (
    <>
      <LandingStarfield count={2800} />

      {/* Hero Earth Sunrise (Section 1) */}
      <group ref={heroGroupRef}>
        <HeroEarthSunrise isVisible={true} />
      </group>

      {/* Chapters 1 to 6 3D Planets & Ghost Words (Sections 2 to 7) */}
      <ChapterPlanets3D scrollProgressRef={scrollProgressRef} />
    </>
  );
}
