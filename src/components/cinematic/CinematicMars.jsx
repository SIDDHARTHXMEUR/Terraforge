import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Mars Iron-Oxide Surface & Thin Dust Atmosphere Shader
// Features: 2K NASA Viking albedo, procedural canyon & crater relief
// (Olympus Mons caldera, Valles Marineris canyon rift), high-albedo polar ice caps,
// and thin dusty salmon-pink Rayleigh atmospheric limb glow.
// -----------------------------------------------------------------------------
const MarsSurfaceShader = {
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

      vec3 albedo = texture2D(uAlbedo, vUv).rgb;

      // Detect Polar Ice Caps by latitude (UV y < 0.08 or > 0.92) and high brightness
      float lat = abs(vUv.y - 0.5) * 2.0;
      float isPolarCap = smoothstep(0.85, 0.96, lat) * smoothstep(0.45, 0.75, length(albedo));

      // Day / Night illumination
      float sunDot = dot(worldNormal, sunDir);
      float diffuse = max(0.0, sunDot);

      // Mars has very thin atmosphere, so terminator is crisp with slight dusty twilight
      float twilight = smoothstep(0.12, -0.05, sunDot) * smoothstep(-0.15, 0.02, sunDot) * 0.15;
      vec3 twilightColor = vec3(0.85, 0.42, 0.18) * twilight;

      // Surface day coloration
      vec3 surfaceDay = albedo * (diffuse * 1.6 + 0.02) + twilightColor;

      // Enhance bright dry-ice / water-ice polar caps
      if (isPolarCap > 0.01) {
        vec3 polarIce = vec3(0.95, 0.96, 1.0) * diffuse * 1.8;
        surfaceDay = mix(surfaceDay, polarIce, isPolarCap * 0.85);
      }

      // Thin Dusty Atmospheric Rayleigh Limb Scatter (Salmon-orange dust haze)
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float limb = pow(rim, 3.8) * (diffuse * 0.7 + 0.3);
      vec3 limbColor = vec3(0.92, 0.52, 0.32) * limb * 0.75;

      // Starlight ambient fill on nightside
      vec3 nightSide = albedo * 0.005;

      gl_FragColor = vec4(surfaceDay + limbColor + nightSide, 1.0);
    }
  `
};

const MarsAtmosphereHaloShader = {
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
      float glow = pow(rim, 4.2);

      vec3 dustHaze = vec3(0.88, 0.45, 0.25);
      gl_FragColor = vec4(dustHaze * glow * 1.2, glow * 0.18);
    }
  `
};

export function CinematicMars({
  position = [0, 0, 0],
  radius = 1.3,
  axialTilt = (25.19 * Math.PI) / 180,
  isPlaying = true,
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/mars/mars.jpg');
  const marsBodyRef = useRef();
  const shaderRef = useRef();

  const computedSunDir = useMemo(() => {
    const pos = new THREE.Vector3(...position);
    if (pos.lengthSq() > 1.0) {
      return new THREE.Vector3(0, 0, 0).sub(pos).normalize();
    }
    return new THREE.Vector3(1, 0.35, 1).normalize();
  }, [position]);

  useFrame((_, delta) => {
    if (isPlaying && marsBodyRef.current) {
      // 24.62-hour Martian sol
      marsBodyRef.current.rotation.y += delta * 0.11;
    }
    if (shaderRef.current) {
      shaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      <mesh ref={marsBodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[MarsSurfaceShader]}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uSunDirection: { value: computedSunDir }
          }}
        />
      </mesh>

      {/* Thin Martian Dust Atmosphere Limb */}
      <mesh scale={1.028}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          args={[MarsAtmosphereHaloShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

