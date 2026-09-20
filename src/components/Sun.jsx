import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

function VisibleSun({ isTrueScale }) {
  const sunTexture = useTexture('/textures/sun/sun_surface.jpg');
  const sunGroupRef = useRef();
  const currentPosRef = useRef(new THREE.Vector3(56.5, 25.4, 56.5)); // 80.0 * [1, 0.45, 1].normalize()

  // Sun Radius: Normal Mode = 20.0, True Scale Mode = 109.3
  const sunRadius = isTrueScale ? 109.3 : 20.0;

  useFrame((_, delta) => {
    // Target Sun Position:
    // Normal Mode: [56.5, 25.4, 56.5] (80 units out along light vector)
    // True Scale Mode: [0, 200, -900] (in front of camera frustum so giant 109.3 Sun is 100% visible!)
    const targetPos = isTrueScale
      ? new THREE.Vector3(0, 200, -900)
      : new THREE.Vector3(56.5, 25.4, 56.5);

    currentPosRef.current.lerp(targetPos, Math.min(1, delta * 2.5));

    if (sunGroupRef.current) {
      sunGroupRef.current.position.copy(currentPosRef.current);
    }
  });

  return (
    <group ref={sunGroupRef}>
      {/* Primary Directional Light (Casts daylight on Planet & Moon) */}
      <directionalLight
        position={[0, 0, 0]}
        intensity={4.5}
        color="#ffffff"
        castShadow
      />

      {/* Near-zero ambient light for dramatic high contrast */}
      <ambientLight intensity={0.04} color="#1e293b" />

      {/* Crisp Unlit Sun Body (No corona glow, no lens flare, pure white base color) */}
      <mesh castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[sunRadius, 64, 64]} />
        <meshBasicMaterial map={sunTexture} color="#ffffff" />
      </mesh>
    </group>
  );
}

export function Sun({ isTrueScale }) {
  return (
    <React.Suspense fallback={null}>
      <VisibleSun isTrueScale={isTrueScale} />
    </React.Suspense>
  );
}
