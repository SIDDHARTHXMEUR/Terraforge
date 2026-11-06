import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Realistic 3D Asteroid Belt with Ceres Dwarf Planet
// Natural astronomical dispersion: varied inclination, eccentric radial spread,
// irregular low-poly displaced rock meshes, and individual rotation tumbling.

export function AsteroidBelt({
  innerRadius = 38,
  outerRadius = 52,
  count = 950,
  isPlaying = true
}) {
  const meshRef = useRef();
  const ceresRef = useRef();
  const ceresAngleRef = useRef(1.2);

  const ceresMap = useTexture('/assets/planets/ceres/ceres.jpg');

  // Precompute varied asteroid orbital physics & transforms
  const asteroidData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      // Non-uniform radial clustering (Gaussian bias towards mid-belt)
      const rRatio = Math.pow(Math.random(), 0.85);
      const radius = innerRadius + rRatio * (outerRadius - innerRadius);

      // Random orbital initial angle
      const angle = Math.random() * Math.PI * 2;

      // Natural orbital inclination tilt (+/- 7 degrees spread)
      const inclination = (Math.random() - 0.5) * 0.16;
      const height = (Math.random() - 0.5) * 6.5;

      // Irregular rock scale (small pebbles up to prominent 40km boulders)
      const baseScale = Math.pow(Math.random(), 2.8) * 0.42 + 0.06;
      const scaleX = baseScale * (0.65 + Math.random() * 0.7);
      const scaleY = baseScale * (0.65 + Math.random() * 0.7);
      const scaleZ = baseScale * (0.65 + Math.random() * 0.7);

      // Individual tumbling rotational speeds
      const rotSpeedX = (Math.random() - 0.5) * 0.8;
      const rotSpeedY = (Math.random() - 0.5) * 0.8;
      const rotSpeedZ = (Math.random() - 0.5) * 0.8;

      // Keplerian orbital angular velocity: v ~ 1 / sqrt(r)
      const orbitSpeed = (12.0 / Math.sqrt(radius)) * 0.04;

      data.push({
        radius,
        angle,
        inclination,
        height,
        scale: [scaleX, scaleY, scaleZ],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        rotSpeed: [rotSpeedX, rotSpeedY, rotSpeedZ],
        orbitSpeed
      });
    }
    return data;
  }, [innerRadius, outerRadius, count]);

  // Irregular rock 3D geometry with noise displacement
  const asteroidGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.0, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      // Pseudo-noise displacement to make jagged jagged boulder surface
      const noise = (Math.sin(v.x * 3.5) * Math.cos(v.y * 3.5) * Math.sin(v.z * 3.5)) * 0.28;
      v.multiplyScalar(1.0 + noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Update instanced meshes each frame
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const ast = asteroidData[i];

      if (isPlaying) {
        ast.angle += delta * ast.orbitSpeed;
        ast.rot[0] += delta * ast.rotSpeed[0];
        ast.rot[1] += delta * ast.rotSpeed[1];
        ast.rot[2] += delta * ast.rotSpeed[2];
      }

      const x = Math.cos(ast.angle) * ast.radius;
      const z = Math.sin(ast.angle) * ast.radius;
      const y = ast.height + Math.sin(ast.angle * 2.0) * (ast.radius * ast.inclination);

      dummy.position.set(x, y, z);
      dummy.rotation.set(ast.rot[0], ast.rot[1], ast.rot[2]);
      dummy.scale.set(ast.scale[0], ast.scale[1], ast.scale[2]);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Orbit Ceres
    if (isPlaying) {
      ceresAngleRef.current += delta * 0.024;
    }
    if (ceresRef.current) {
      const cR = (innerRadius + outerRadius) * 0.5;
      const cA = ceresAngleRef.current;
      ceresRef.current.position.set(Math.cos(cA) * cR, 0.4, Math.sin(cA) * cR);
      ceresRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group>
      {/* 1. Instanced Boulders & Rock Fragments */}
      <instancedMesh
        ref={meshRef}
        args={[asteroidGeometry, null, count]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#8c827a"
          roughness={0.92}
          metalness={0.08}
          flatShading={true}
        />
      </instancedMesh>

      {/* 2. Dwarf Planet Ceres (Largest body in asteroid belt, 940 km diameter) */}
      <mesh ref={ceresRef} castShadow receiveShadow>
        <sphereGeometry args={[0.55, 64, 64]} />
        <meshStandardMaterial
          map={ceresMap}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}
