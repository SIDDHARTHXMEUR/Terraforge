import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Creates an ultra-crisp text label sprite with Inter 300 12px equivalent in cream (#FFF8E7)
 */
function createLeaderLabelTexture(name, radiusKm) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFF8E7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Body Name & Radius
  ctx.font = '300 32px "Inter", sans-serif';
  ctx.letterSpacing = '0.15em';
  ctx.fillText(`${name.toUpperCase()}  //  ${radiusKm}`, 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/**
 * Rebuilt "THE SYSTEM, TO SCALE" Lineup Section
 * - True physical relative radii: Jupiter is 11x Earth, Sol is 109x Earth
 * - On 1080p: Jupiter >= 120px, Earth >= 12px, Sol curved arc fills left half
 * - Thin 1px leader line from each body to its name & km radius (Inter 300 12px, cream)
 * - Zero cards, zero pills, zero boxes
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

  // True physical radii relative to Earth = 0.058 (13.2 px diameter at 1080p, >= 12px)
  // Jupiter = 0.638 (11x Earth = 145 px diameter, >= 120px)
  // Sol = 6.32 (109x Earth, massive curved arc filling left half)
  const bodies = useMemo(() => [
    {
      name: 'Sol',
      radiusKm: '696,340 KM',
      r: 6.32,
      x: -7.2,
      tex: sunTex,
      isSun: true,
      labelAbove: true,
      lineLen: 0.8
    },
    {
      name: 'Mercury',
      radiusKm: '2,440 KM',
      r: 0.022,
      x: -0.4,
      tex: mercuryTex,
      labelAbove: true,
      lineLen: 1.2
    },
    {
      name: 'Venus',
      radiusKm: '6,052 KM',
      r: 0.055,
      x: 0.2,
      tex: venusTex,
      labelAbove: false,
      lineLen: 1.2
    },
    {
      name: 'Earth',
      radiusKm: '6,371 KM',
      r: 0.058, // >= 12px diameter
      x: 0.8,
      tex: earthTex,
      labelAbove: true,
      lineLen: 1.2
    },
    {
      name: 'Mars',
      radiusKm: '3,390 KM',
      r: 0.031,
      x: 1.4,
      tex: marsTex,
      labelAbove: false,
      lineLen: 1.2
    },
    {
      name: 'Jupiter',
      radiusKm: '69,911 KM',
      r: 0.638, // 11x Earth = 145px diameter (>= 120px)
      x: 2.8,
      tex: jupiterTex,
      labelAbove: true,
      lineLen: 1.5
    },
    {
      name: 'Saturn',
      radiusKm: '58,232 KM',
      r: 0.531,
      x: 5.2,
      tex: saturnTex,
      hasRings: true,
      labelAbove: false,
      lineLen: 1.6
    },
    {
      name: 'Uranus',
      radiusKm: '25,362 KM',
      r: 0.231,
      x: 7.4,
      tex: uranusTex,
      labelAbove: true,
      lineLen: 1.3
    },
    {
      name: 'Neptune',
      radiusKm: '24,622 KM',
      r: 0.224,
      x: 9.0,
      tex: neptuneTex,
      labelAbove: false,
      lineLen: 1.3
    }
  ], [sunTex, mercuryTex, venusTex, earthTex, marsTex, jupiterTex, saturnTex, uranusTex, neptuneTex]);

  // Generate label textures
  const labelTextures = useMemo(() => {
    const map = {};
    bodies.forEach(b => {
      map[b.name] = createLeaderLabelTexture(b.name, b.radiusKm);
    });
    return map;
  }, [bodies]);

  // 1px Horizontal datum line geometry linking centers
  const datumGeometry = useMemo(() => {
    const pts = [
      new THREE.Vector3(-14, 0, 0),
      new THREE.Vector3(12, 0, 0)
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const scrollP = scrollProgressRef?.current || 0;
    // Section 8 is centered at scrollP = 7.0
    const deltaP = scrollP - 7.0;
    const isVisible = Math.abs(deltaP) < 0.65;
    groupRef.current.visible = isVisible;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* 1px Horizontal Datum Line */}
      <line geometry={datumGeometry}>
        <lineBasicMaterial color="#FFF8E7" transparent opacity={0.16} />
      </line>

      {/* Bodies in true physical relative radii */}
      {bodies.map((b) => {
        const sign = b.labelAbove ? 1 : -1;
        const lineStartY = sign * (b.r + 0.05);
        const lineEndY = sign * (b.r + b.lineLen);
        const labelY = lineEndY + sign * 0.25;

        const leaderPts = [
          new THREE.Vector3(0, lineStartY, 0),
          new THREE.Vector3(0, lineEndY, 0)
        ];
        const leaderGeom = new THREE.BufferGeometry().setFromPoints(leaderPts);

        return (
          <group key={b.name} position={[b.x, 0, 0]}>
            {/* Spherical body */}
            <mesh>
              <sphereGeometry args={[b.r, 64, 64]} />
              <meshStandardMaterial
                map={b.tex}
                roughness={b.isSun ? 0 : 0.8}
                metalness={0.1}
                emissive={b.isSun ? '#ff8800' : '#000000'}
                emissiveIntensity={b.isSun ? 0.9 : 0}
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

            {/* Thin 1px leader line to name & radius */}
            <line geometry={leaderGeom}>
              <lineBasicMaterial color="#FFF8E7" transparent opacity={0.35} />
            </line>

            {/* Leader Text Label Sprite (Inter 300 12px, cream, no cards, no pills, no boxes) */}
            <sprite position={[0, labelY, 0]} scale={[1.6, 0.4, 1]}>
              <spriteMaterial
                map={labelTextures[b.name]}
                transparent
                depthTest={false}
              />
            </sprite>
          </group>
        );
      })}
    </group>
  );
}
