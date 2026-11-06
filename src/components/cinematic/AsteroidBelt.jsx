import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function AsteroidBelt({
  count = 1200,
  innerRadius = 61.0,
  outerRadius = 68.0,
  beltThickness = 2.4,
  isPlaying = true,
  timeSpeed = 1.0
}) {
  const meshRef = useRef();

  // Create an irregular rocky asteroid base geometry via vertex jitter
  const geometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.35, 1);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();

    // Procedural surface crater/irregularity displacement
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const noise = (Math.sin(v.x * 5.0) * Math.cos(v.y * 5.0) * Math.sin(v.z * 5.0)) * 0.12;
      v.multiplyScalar(1.0 + noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Compute individual asteroid orbital parameters
  const asteroidData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * beltThickness;
      // Keplerian velocity: slightly faster on inner edge than outer edge
      const speed = (1.0 / Math.sqrt(radius)) * 0.45;

      // Random non-uniform elongation scale
      const scaleX = 0.4 + Math.random() * 0.9;
      const scaleY = 0.4 + Math.random() * 0.7;
      const scaleZ = 0.4 + Math.random() * 0.8;

      // Random tumble spin
      const rotSpeedX = (Math.random() - 0.5) * 1.5;
      const rotSpeedY = (Math.random() - 0.5) * 1.5;
      const rotSpeedZ = (Math.random() - 0.5) * 1.5;

      data.push({
        radius,
        angle,
        y,
        speed,
        scale: new THREE.Vector3(scaleX, scaleY, scaleZ),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        rotSpeed: new THREE.Vector3(rotSpeedX, rotSpeedY, rotSpeedZ)
      });
    }
    return data;
  }, [count, innerRadius, outerRadius, beltThickness]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Advance asteroid belt positions along Keplerian orbits
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const advance = isPlaying ? delta * timeSpeed : 0;

    for (let i = 0; i < count; i++) {
      const ast = asteroidData[i];
      if (isPlaying) {
        ast.angle += ast.speed * advance;
        ast.rot.x += ast.rotSpeed.x * delta;
        ast.rot.y += ast.rotSpeed.y * delta;
        ast.rot.z += ast.rotSpeed.z * delta;
      }

      const x = Math.cos(ast.angle) * ast.radius;
      const z = Math.sin(ast.angle) * ast.radius;

      dummy.position.set(x, ast.y, z);
      dummy.rotation.copy(ast.rot);
      dummy.scale.copy(ast.scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, null, count]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color="#8c827a"
        roughness={0.9}
        metalness={0.15}
      />
    </instancedMesh>
  );
}
