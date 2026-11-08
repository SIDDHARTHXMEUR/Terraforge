import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Lineup 3D Component:
 * - True relative radii (Jupiter 11x Earth, Earth 2.6x Mercury, Sol dwarfs them)
 * - 1px horizontal datum line linking centers with ticks
 * - Camera dollies horizontally with scroll
 */
export function LineupSection3D({ scrollProgressRef }) {
  const groupRef = useRef();

  // Load Planet Textures
  const [
    sunTex,
    mercuryTex,
    venusTex,
    earthTex,
    marsTex,
    jupiterTex,
    saturnTex,
    saturnRingTex,
    uranusTex,
    neptuneTex
  ] = useTexture([
    '/assets/planets/sun/sun.jpg',
    '/assets/planets/mercury/mercury.jpg',
    '/assets/planets/venus/venus.jpg',
    '/assets/planets/earth/earth_albedo.jpg',
    '/assets/planets/mars/mars.jpg',
    '/assets/planets/jupiter/jupiter.jpg',
    '/assets/planets/saturn/saturn.jpg',
    '/assets/planets/saturn/saturn_ring.png',
    '/assets/planets/uranus/uranus.jpg',
    '/assets/planets/neptune/neptune.jpg'
  ]);

  // Planet specifications with true relative radii (Earth = 0.25)
  // Jupiter = 2.74 (11x Earth), Mercury = 0.096 (Earth is 2.6x Mercury)
  const bodies = useMemo(() => [
    { name: 'Sol', radiusKm: '696,340 KM', r: 18.0, x: -17.5, tex: sunTex, isSun: true },
    { name: 'Mercury', radiusKm: '2,440 KM', r: 0.10, x: -5.0, tex: mercuryTex },
    { name: 'Venus', radiusKm: '6,052 KM', r: 0.24, x: -3.8, tex: venusTex },
    { name: 'Earth', radiusKm: '6,371 KM', r: 0.25, x: -2.4, tex: earthTex },
    { name: 'Mars', radiusKm: '3,390 KM', r: 0.13, x: -1.2, tex: marsTex },
    { name: 'Jupiter', radiusKm: '69,911 KM', r: 2.74, x: +3.0, tex: jupiterTex },
    { name: 'Saturn', radiusKm: '58,232 KM', r: 2.28, x: +9.6, tex: saturnTex, hasRings: true },
    { name: 'Uranus', radiusKm: '25,362 KM', r: 0.99, x: +15.5, tex: uranusTex },
    { name: 'Neptune', radiusKm: '24,622 KM', r: 0.96, x: +19.5, tex: neptuneTex }
  ], [sunTex, mercuryTex, venusTex, earthTex, marsTex, jupiterTex, saturnTex, saturnRingTex, uranusTex, neptuneTex]);

  // 1px Horizontal datum line geometry linking centers
  const datumPoints = useMemo(() => {
    return [
      new THREE.Vector3(-22, 0, 0),
      new THREE.Vector3(24, 0, 0)
    ];
  }, []);

  const datumGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(datumPoints);
  }, [datumPoints]);

  useFrame(() => {
    if (!groupRef.current) return;
    const scrollP = scrollProgressRef?.current || 0;
    // Section 4 (Lineup & Motion) is active around scrollP = 10.0
    const deltaP = scrollP - 10.0;
    const isVisible = Math.abs(deltaP) < 0.75;
    groupRef.current.visible = isVisible;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* 1px Horizontal Datum Line */}
      <line geometry={datumGeometry}>
        <lineBasicMaterial color="#FFF8E7" transparent opacity={0.18} />
      </line>

      {/* Bodies in true relative size */}
      {bodies.map((b) => (
        <group key={b.name} position={[b.x, 0, 0]}>
          {/* Spherical body */}
          <mesh>
            <sphereGeometry args={[b.r, 48, 48]} />
            <meshStandardMaterial
              map={b.tex}
              roughness={b.isSun ? 0 : 0.8}
              metalness={0.1}
              emissive={b.isSun ? '#ff8800' : '#000000'}
              emissiveIntensity={b.isSun ? 0.8 : 0}
            />
          </mesh>

          {/* Saturn Rings */}
          {b.hasRings && (
            <mesh rotation={[-Math.PI / 2.3, 0.2, 0]}>
              <ringGeometry args={[b.r * 1.35, b.r * 2.3, 64]} />
              <meshStandardMaterial
                map={saturnRingTex}
                transparent
                opacity={0.88}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {/* Small Tick on datum line */}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(self) => {
                const pts = [new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, 0.2, 0)];
                self.setFromPoints(pts);
              }}
            />
            <lineBasicMaterial color="#FFF8E7" transparent opacity={0.4} />
          </line>
        </group>
      ))}
    </group>
  );
}

