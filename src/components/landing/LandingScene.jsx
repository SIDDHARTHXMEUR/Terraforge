import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HeroEarthSunrise } from './HeroEarthSunrise';
import { LandingStarfield } from './LandingStarfield';

export function LandingScene({ scrollProgressRef }) {
  const { camera } = useThree();
  const sceneGroupRef = useRef();

  useFrame((state, delta) => {
    const scrollP = scrollProgressRef?.current || 0;

    // Section 1 (Hero: scrollP ~ [0, 1])
    if (scrollP <= 1.0) {
      // Hero low orbit view
      // Subtle inertial parallax with scroll
      const heroCamY = 1.2 + scrollP * 0.4;
      const heroCamZ = 5.0 + scrollP * 1.5;
      camera.position.set(0, heroCamY, heroCamZ);
      camera.lookAt(0, 0.1, 0);
    }
  });

  return (
    <group ref={sceneGroupRef}>
      <LandingStarfield count={2600} />
      <HeroEarthSunrise isVisible={true} />
    </group>
  );
}
