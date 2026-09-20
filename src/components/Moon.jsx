import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

function MoonMesh({ planetTransform, sim, isTrueScale, showOrbits }) {
  const moonRef = useRef();
  const orbitAngleRef = useRef(0);
  const currentRadiusRef = useRef(6.0);

  // Load Moon NASA-derived texture pack
  const [moonAlbedo, moonBump] = useTexture([
    '/textures/moon/moon_albedo.jpg',
    '/textures/moon/moon_bump.jpg'
  ]);

  // Exact Moon Radius ratio (Earth = 1.0 -> Moon = 0.273)
  const moonRadius = 0.273;

  // SYLLABUS: Topic 8 - Computer Animation Kinematics (Kinematic Lunar Orbit 27.3x Speed Ratio & Tidal Lock)
  useFrame((_, delta) => {
    if (!sim.isPlaying) return;

    // Kinematic Orbit Speed locked to exact 27.3x ratio: moonOrbitSpeed = earthRotationSpeed / 27.3
    const moonOrbitSpeed = (sim.rotationSpeed / 27.3) * 0.4;
    orbitAngleRef.current += delta * moonOrbitSpeed;
    const angle = orbitAngleRef.current;

    // Target orbit radius: Normal Mode = 6.0 Earth radii, True Scale Mode = 60.3 Earth radii
    const targetRadius = isTrueScale ? 60.3 : 6.0;
    currentRadiusRef.current += (targetRadius - currentRadiusRef.current) * Math.min(1, delta * 3.0);
    const radius = currentRadiusRef.current;

    if (moonRef.current) {
      const planetCenterX = !planetTransform?.composite ? (planetTransform?.posX || 0) : 0;
      const planetCenterY = !planetTransform?.composite ? (planetTransform?.posY || 0) : 0;
      const planetCenterZ = !planetTransform?.composite ? (planetTransform?.posZ || 0) : 0;

      // Kinematic Orbit Translation: position = planetCenter + radius * (cos(angle), 0, sin(angle))
      const moonX = planetCenterX + Math.cos(angle) * radius;
      const moonY = planetCenterY;
      const moonZ = planetCenterZ + Math.sin(angle) * radius;

      moonRef.current.position.set(moonX, moonY, moonZ);

      // Tidal Locking: Moon rotation speed = orbit speed (same face always points at Earth)
      moonRef.current.rotation.y = -angle + Math.PI / 2;
    }
  });

  // Generate orbit ring points for overlay
  const orbitLinePoints = useMemo(() => {
    const points = [];
    const radius = isTrueScale ? 60.3 : 6.0;
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return points;
  }, [isTrueScale]);

  // 5.14° Lunar Orbital Inclination Tilt (relative to ecliptic)
  const MOON_INCLINATION = (5.14 * Math.PI) / 180;

  return (
    <group
      position={!planetTransform?.composite ? [planetTransform?.posX || 0, planetTransform?.posY || 0, planetTransform?.posZ || 0] : [0, 0, 0]}
      rotation={[MOON_INCLINATION, 0, 0]}
    >
      {/* Moon Mesh */}
      <mesh ref={moonRef} castShadow receiveShadow>
        <sphereGeometry args={[moonRadius, 64, 64]} />
        <meshStandardMaterial
          map={moonAlbedo}
          bumpMap={moonBump}
          bumpScale={0.03}
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* Moon Orbital Path Ring Overlay (Unlit, thin ring line when showOrbits is enabled) */}
      {showOrbits && (
        <line>
          <bufferGeometry
            attach="geometry"
            setFromPoints={orbitLinePoints}
          />
          <lineBasicMaterial attach="material" color="#00f2fe" opacity={0.35} transparent />
        </line>
      )}
    </group>
  );
}

export function Moon({ planetTransform, sim, isTrueScale, showOrbits }) {
  return (
    <React.Suspense fallback={null}>
      <MoonMesh planetTransform={planetTransform} sim={sim} isTrueScale={isTrueScale} showOrbits={showOrbits} />
    </React.Suspense>
  );
}
