import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

function StarfieldSkybox() {
  const skyboxMap = useTexture('/textures/sun/starfield_skybox.jpg');
  const skyboxRef = useRef();

  // SYLLABUS: Topic 7 - Visible Surface Detection (Skybox follows camera & depthWrite={false} eliminates ortho clipping)
  useFrame(({ camera }) => {
    if (skyboxRef.current) {
      skyboxRef.current.position.copy(camera.position);
    }
  });

  return (
    <mesh ref={skyboxRef}>
      <sphereGeometry args={[8000, 64, 64]} />
      <meshBasicMaterial
        map={skyboxMap}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export function Starfield() {
  return (
    <React.Suspense fallback={null}>
      <StarfieldSkybox />
    </React.Suspense>
  );
}
