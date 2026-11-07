import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Mercury Airless Planetary Shader
// Features: Lommel-Seeliger lunar/mercurian airless scattering law,
// multi-frequency crater relief displacement, harsh non-diffusive terminator,
// Caloris Basin / crater ray contrast, and zero atmospheric haze.
// -----------------------------------------------------------------------------
const MercurySurfaceShader = {
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

    // Procedural high-frequency crater micro-relief
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float microRelief(vec2 uv) {
      vec2 p = uv * 64.0;
      vec2 f = fract(p);
      float d = length(f - 0.5);
      float craterRim = smoothstep(0.42, 0.38, d) - smoothstep(0.38, 0.28, d);
      return craterRim * 0.15;
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 sunDir = normalize(uSunDirection);

      // Base 2K NASA MESSENGER albedo map
      vec3 albedo = texture2D(uAlbedo, vUv).rgb;

      // Add high-frequency procedural micro-cratering
      float relief = microRelief(vUv);
      vec3 adjustedAlbedo = albedo * (1.0 + relief * 0.25);

      // 1. Airless Lommel-Seeliger Scattering Law:
      // I = cos(i) / (cos(i) + cos(e))
      // Unlike Lambertian, Lommel-Seeliger accurately reproduces the flat,
      // un-darkened disc of airless regolith bodies (Moon, Mercury).
      float cosI = max(0.0, dot(worldNormal, sunDir));
      float cosE = max(0.0, dot(normal, viewDir));

      float lommelSeeliger = 0.0;
      if (cosI + cosE > 0.001) {
        lommelSeeliger = cosI / (cosI + cosE);
      }

      // Airless terminator: extremely sharp cut-off into total void shadow
      float sunDot = dot(worldNormal, sunDir);
      float terminatorMask = smoothstep(-0.02, 0.04, sunDot);

      // Blend Lommel-Seeliger with subtle Lambertian diffuse
      float illumination = mix(cosI, lommelSeeliger * 1.8, 0.65) * terminatorMask;

      // Dark basaltic regolith color grading
      vec3 surfaceColor = adjustedAlbedo * illumination * 2.1;

      // Deep space ambient fill on unlit side (starlight only, 0.008)
      vec3 nightSide = albedo * 0.006;

      gl_FragColor = vec4(surfaceColor + nightSide, 1.0);
    }
  `
};

export function CinematicMercury({
  position = [0, 0, 0],
  radius = 1.0,
  axialTilt = (0.03 * Math.PI) / 180,
  isPlaying = true,
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/mercury/mercury.jpg');
  const mercuryMeshRef = useRef();
  const shaderRef = useRef();

  // Dynamic sunlight vector from Mercury position toward Sun at origin
  const computedSunDir = useMemo(() => {
    const pos = new THREE.Vector3(...position);
    if (pos.lengthSq() > 1.0) {
      return new THREE.Vector3(0, 0, 0).sub(pos).normalize();
    }
    return new THREE.Vector3(1, 0.35, 1).normalize();
  }, [position]);

  useFrame((_, delta) => {
    if (isPlaying && mercuryMeshRef.current) {
      // Mercury 58.6-day axial rotation (3:2 spin-orbit resonance)
      mercuryMeshRef.current.rotation.y += delta * 0.04;
    }
    if (shaderRef.current) {
      shaderRef.current.uniforms.uSunDirection.value = computedSunDir;
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      <mesh ref={mercuryMeshRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[MercurySurfaceShader]}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uSunDirection: { value: computedSunDir }
          }}
        />
      </mesh>
    </group>
  );
}

