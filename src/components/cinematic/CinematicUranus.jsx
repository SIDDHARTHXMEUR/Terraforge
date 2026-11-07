import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Uranus Methane Ice Giant Shader
// Features: Methane absorption (selective red light depletion -> serene pale cyan),
// subtle zonal atmospheric banding, high-altitude photochemical haze,
// 97.77° sideways roll tilt, and faint ice ring system.
// -----------------------------------------------------------------------------
const UranusAtmosphereShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

    uniform sampler2D uAlbedo;
    uniform vec3 uSunDirection;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 sunDir = normalize(uSunDirection);

      vec3 texColor = texture2D(uAlbedo, vUv).rgb;

      // Authentic Uranus Pale Cyan-Aquamarine Palette
      // Deep methane absorbs red wavelength (619nm, 727nm)
      vec3 uranusCyan = vec3(0.52, 0.76, 0.82);
      vec3 baseColor = mix(texColor, uranusCyan, 0.65);

      // Subtle zonal atmospheric bands (latitudinal variation)
      float latBand = sin(vUv.y * 38.0) * 0.025;
      baseColor += vec3(latBand * 0.5, latBand, latBand * 0.8);

      // Day / Night illumination
      float sunDot = dot(worldNormal, sunDir);
      float diffuse = smoothstep(-0.15, 0.35, sunDot);

      // Deep atmospheric limb scattering (thick hydrogen/helium/methane envelope)
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float limbScatter = pow(rim, 3.2) * (diffuse * 0.75 + 0.25);
      vec3 limbColor = vec3(0.55, 0.85, 0.95) * limbScatter * 1.1;

      vec3 surface = baseColor * (diffuse * 1.05 + 0.03) + limbColor;
      gl_FragColor = vec4(surface, 1.0);
    }
  `
};

const UranusHaloShader = {
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
      float glow = pow(rim, 3.6);
      vec3 cyanHalo = vec3(0.58, 0.88, 0.96);
      gl_FragColor = vec4(cyanHalo * glow * 1.4, glow * 0.32);
    }
  `
};

export function CinematicUranus({
  position = [0, 0, 0],
  radius = 2.8,
  axialTilt = (97.77 * Math.PI) / 180, // Sideways rolling tilt
  isPlaying = true,
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/uranus/uranus.jpg');
  const bodyRef = useRef();
  const shaderRef = useRef();

  const computedSunDir = useMemo(() => {
    const pos = new THREE.Vector3(...position);
    if (pos.lengthSq() > 1.0) {
      return new THREE.Vector3(0, 0, 0).sub(pos).normalize();
    }
    return new THREE.Vector3(1, 0.35, 1).normalize();
  }, [position]);

  // Faint ice ring geometry for Uranus
  const ringGeometry = useMemo(() => {
    const innerRadius = radius * 1.55;
    const outerRadius = radius * 2.25;
    return new THREE.RingGeometry(innerRadius, outerRadius, 128);
  }, [radius]);

  useFrame((_, delta) => {
    if (isPlaying && bodyRef.current) {
      // 17.24-hour retrograde rotation
      bodyRef.current.rotation.y -= delta * 0.09;
    }
    if (shaderRef.current) {
      shaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      {/* 1. Uranus Methane Ice Giant Body */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[UranusAtmosphereShader]}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uSunDirection: { value: computedSunDir }
          }}
        />
      </mesh>

      {/* 2. Soft Cyan Atmospheric Rayleigh Limb Halo */}
      <mesh scale={1.036}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          args={[UranusHaloShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Faint Vertical Ice Rings */}
      <mesh
        geometry={ringGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#a8e2f0"
          transparent={true}
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.65}
        />
      </mesh>
    </group>
  );
}
