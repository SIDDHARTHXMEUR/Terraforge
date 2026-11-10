import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { DISPLAY_RADII } from '../../data/displayScale';
import { LANDING_CHAPTERS } from './ChapterOverlay';

// R5 Neon Orbit Line Colors for 8 planets:
// Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
const ORBIT_COLORS = [
  '#00F0FF',
  '#FFE600',
  '#00FF66',
  '#FF3366',
  '#FFAA00',
  '#FFD700',
  '#00FFFF',
  '#0088FF'
];

/**
 * Section 9: The System + Overview Orbit Ignition
 * Seamlessly matches the simulator's default camera pose:
 * position: [-320, 110, 310], target: [-65, 0, 48]
 * Orbit lines fade from 0 to full opacity as scroll reaches 100%
 */
export function OverviewSection3D({ scrollProgressRef }) {
  const groupRef = useRef();
  const orbitsRef = useRef();

  const [
    sunTex,
    earthTex,
    marsTex,
    jupiterTex,
    saturnTex,
    saturnRingTex
  ] = useTexture([
    '/assets/planets/sun/sun.jpg',
    '/assets/planets/earth/earth_albedo.jpg',
    '/assets/planets/mars/mars.jpg',
    '/assets/planets/jupiter/jupiter.jpg',
    '/assets/planets/saturn/saturn.jpg',
    '/assets/planets/saturn/saturn_ring.png'
  ]);

  // Orbit line radii from displayScale.js
  const orbitRadii = [82.0, 116.0, 156.0, 202.0, 306.0, 394.0, 484.0, 572.0];

  const orbitGeometries = useMemo(() => {
    return orbitRadii.map((r) => {
      const pts = [];
      const segs = 128;
      for (let i = 0; i <= segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r));
      }
      return new THREE.BufferGeometry().setFromPoints(pts);
    });
  }, []);

  const finalChapter = useMemo(() => LANDING_CHAPTERS.find((ch) => ch.type === 'final'), []);
  const finalKey = finalChapter ? finalChapter.progressKey : 8.0;
  const startKey = finalKey - 0.65;

  useFrame(() => {
    if (!groupRef.current) return;
    const scrollP = scrollProgressRef?.current || 0;
    if (scrollP < startKey) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Fade up opacity as scroll approaches finalKey (100%)
    const ignition = THREE.MathUtils.clamp((scrollP - startKey) / 0.65, 0, 1);
    groupRef.current.traverse((child) => {
      if (child.material) {
        child.material.transparent = true;
        child.material.opacity = ignition;
      }
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Central Sun */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[DISPLAY_RADII.sun || 54.0, 64, 64]} />
        <meshBasicMaterial map={sunTex} />
      </mesh>

      {/* Orbit Lines using R5 Neon Palette */}
      <group ref={orbitsRef}>
        {orbitGeometries.map((geom, idx) => (
          <line key={idx} geometry={geom}>
            <lineBasicMaterial
              color={ORBIT_COLORS[idx % ORBIT_COLORS.length]}
              transparent
              opacity={0.45}
              blending={THREE.AdditiveBlending}
            />
          </line>
        ))}
      </group>

      {/* Earth Body at live orbit position */}
      <mesh position={[156.0, 0, 0]}>
        <sphereGeometry args={[DISPLAY_RADII.earth || 5.8, 32, 32]} />
        <meshStandardMaterial map={earthTex} />
      </mesh>

      {/* Mars Body */}
      <mesh position={[-142.0, 0, 142.0]}>
        <sphereGeometry args={[DISPLAY_RADII.mars || 4.8, 32, 32]} />
        <meshStandardMaterial map={marsTex} />
      </mesh>

      {/* Jupiter Body */}
      <mesh position={[216.0, 0, -216.0]}>
        <sphereGeometry args={[DISPLAY_RADII.jupiter || 18.0, 32, 32]} />
        <meshStandardMaterial map={jupiterTex} />
      </mesh>

      {/* Saturn Body */}
      <group position={[-340.0, 0, -196.0]}>
        <mesh>
          <sphereGeometry args={[DISPLAY_RADII.saturn || 15.0, 32, 32]} />
          <meshStandardMaterial map={saturnTex} />
        </mesh>
        <mesh rotation={[-Math.PI / 2.3, 0.2, 0]}>
          <ringGeometry args={[20.0, 38.0, 64]} />
          <meshStandardMaterial
            map={saturnRingTex}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

