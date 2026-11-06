import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Realistic 3D Asteroid Belt with Dwarf Planet Ceres
// Scientifically grounded: dark carbonaceous/silicate chondrite rocks,
// micro-scale boulders (not oversized white chunks), varied orbital inclinations,
// Keplerian angular velocity (v ~ 1/sqrt(r)), and individual tumbling spin.

export function AsteroidBelt({
  innerRadius = 78,
  outerRadius = 94,
  count = 1200,
  isPlaying = true,
  onClick
}) {
  const meshRef = useRef();
  const ceresRef = useRef();
  const ceresAngleRef = useRef(1.2);

  const ceresMap = useTexture('/assets/planets/ceres/ceres.jpg');

  // Precompute varied asteroid orbital physics & transforms
  const asteroidData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      // Gaussian radial clustering centered around the main belt core (86 AU equivalent)
      const u1 = Math.random();
      const u2 = Math.random();
      const randNormal = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
      const mid = (innerRadius + outerRadius) * 0.5;
      const spread = (outerRadius - innerRadius) * 0.35;
      const radius = Math.max(innerRadius, Math.min(outerRadius, mid + randNormal * spread));

      // Initial angle
      const angle = Math.random() * Math.PI * 2;

      // Natural orbital inclination tilt (+/- 5 degrees spread)
      const inclination = (Math.random() - 0.5) * 0.09;
      const height = (Math.random() - 0.5) * 3.2;

      // Realistic rock scale: fine rubble up to rare prominent boulders
      // Power curve ensures 90% are subtle background dust/pebbles, only 10% are medium boulders
      const baseScale = Math.pow(Math.random(), 3.5) * 0.14 + 0.035;
      const scaleX = baseScale * (0.7 + Math.random() * 0.6);
      const scaleY = baseScale * (0.7 + Math.random() * 0.6);
      const scaleZ = baseScale * (0.7 + Math.random() * 0.6);

      // Individual tumbling rotational speeds
      const rotSpeedX = (Math.random() - 0.5) * 0.6;
      const rotSpeedY = (Math.random() - 0.5) * 0.6;
      const rotSpeedZ = (Math.random() - 0.5) * 0.6;

      // Keplerian orbital angular velocity: v ~ 1 / sqrt(r)
      const orbitSpeed = (12.0 / Math.sqrt(radius)) * 0.035;

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

  // Irregular displaced rock geometry (low-poly displaced dodecahedron)
  const asteroidGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.0, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const noise = (Math.sin(v.x * 4.0) * Math.cos(v.y * 4.0) * Math.sin(v.z * 4.0)) * 0.22;
      v.multiplyScalar(1.0 + noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

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
      ceresAngleRef.current += delta * 0.022;
    }
    if (ceresRef.current) {
      const cR = (innerRadius + outerRadius) * 0.5;
      const cA = ceresAngleRef.current;
      ceresRef.current.position.set(Math.cos(cA) * cR, 0.2, Math.sin(cA) * cR);
      ceresRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group onClick={onClick}>
      {/* 1. Dark Chondrite Rock Fragments */}
      <instancedMesh
        ref={meshRef}
        args={[asteroidGeometry, null, count]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#524c45"
          roughness={0.94}
          metalness={0.06}
          flatShading={true}
        />
      </instancedMesh>

      {/* 2. Dwarf Planet Ceres (Largest body in asteroid belt, 940 km diameter) */}
      <mesh ref={ceresRef} castShadow receiveShadow>
        <sphereGeometry args={[0.42, 64, 64]} />
        <meshStandardMaterial
          map={ceresMap}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}
