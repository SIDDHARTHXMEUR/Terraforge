import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Saturn with double-sided Cassini Division Ring System + Ring Shadow projection
const SATURN_AXIAL_TILT = (26.73 * Math.PI) / 180;

// Saturn Atmospheric Limb Shader
const SaturnAtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      float rim = 1.0 - clamp(abs(dot(normal, viewDir)), 0.0, 1.0);
      float glow = pow(rim, 3.8);

      vec3 atmoColor = vec3(0.95, 0.82, 0.45);
      gl_FragColor = vec4(atmoColor * glow * 1.4, glow * 0.12);
    }
  `
};

export function CinematicSaturn({
  position = [0, 0, 0],
  radius = 3.8,
  isPlaying = true,
  onClick
}) {
  const [saturnMap, ringMap] = useTexture([
    '/assets/planets/saturn/saturn.jpg',
    '/assets/planets/saturn/saturn_ring.png'
  ]);

  const saturnBodyRef = useRef();
  const ringRef = useRef();

  // Create high-density custom Ring Geometry with radial UV mapping
  const ringGeometry = useMemo(() => {
    const innerRadius = radius * 1.35;
    const outerRadius = radius * 2.85;
    const thetaSegments = 160;
    const phiSegments = 32;

    const geo = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments);
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;

    // Map planar ring coordinates to radial 1D UV along texture
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const u = (dist - innerRadius) / (outerRadius - innerRadius);
      uvs.setXY(i, u, 0.5);
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius]);

  useFrame((_, delta) => {
    if (isPlaying && saturnBodyRef.current) {
      // Rapid 10.65-hour Jovian rotation
      saturnBodyRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group position={position} rotation={[0, 0, SATURN_AXIAL_TILT]} onClick={onClick}>
      {/* 1. Saturn Gas Giant Atmosphere Body */}
      <mesh ref={saturnBodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={saturnMap}
          roughness={0.92}
          metalness={0.0}
        />
      </mesh>

      {/* 2. Saturn Subtle Pale Gold Atmospheric Limb Scattering */}
      <mesh scale={1.032}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          args={[SaturnAtmosphereShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Physically Photorealistic Cassini Ring Structure */}
      <mesh
        ref={ringRef}
        geometry={ringGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={ringMap}
          transparent={true}
          opacity={0.96}
          alphaTest={0.02}
          roughness={0.82}
          metalness={0.02}
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      </mesh>
    </group>
  );
}
