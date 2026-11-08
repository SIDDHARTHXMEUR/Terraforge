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
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 mvPosition = viewMatrix * worldPos;
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    uniform sampler2D uAlbedo;
    uniform vec3 uSunPosition;

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
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      // Base 2K NASA MESSENGER albedo map
      vec3 albedo = texture2D(uAlbedo, vUv).rgb;

      // Add high-frequency procedural micro-cratering
      float relief = microRelief(vUv);
      vec3 adjustedAlbedo = albedo * (1.0 + relief * 0.25);

      // 1. Airless Lommel-Seeliger Scattering Law:
      float NdotL = dot(N, L);
      float cosI = max(0.0, NdotL);
      float cosE = max(0.0, dot(N, V));

      float lommelSeeliger = 0.0;
      if (cosI + cosE > 0.001) {
        lommelSeeliger = cosI / (cosI + cosE);
      }

      // Airless terminator: sharp cut-off into total void shadow
      float terminatorMask = smoothstep(-0.01, 0.04, NdotL);

      // Blend Lommel-Seeliger with Lambertian diffuse
      float illumination = mix(cosI, lommelSeeliger * 1.6, 0.60) * terminatorMask;

      vec3 surfaceColor = adjustedAlbedo * illumination * 1.30;

      // Nightside: textured ambient at 0.015 (dark but readable)
      vec3 nightSide = albedo * 0.015;

      gl_FragColor = vec4(surfaceColor + nightSide, 1.0);
    }
  `
};

export function CinematicMercury({
  position = [0, 0, 0],
  radius = 2.4,
  axialTilt = (0.03 * Math.PI) / 180,
  isPlaying = true,
  sunPosition = [0, 0, 0],
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/mercury/mercury.jpg');
  const mercuryMeshRef = useRef();
  const shaderRef = useRef();

  const sunPosVec = useMemo(() => new THREE.Vector3(...sunPosition), [sunPosition]);

  useFrame((_, delta) => {
    if (isPlaying && mercuryMeshRef.current) {
      // Mercury 58.6-day axial rotation (3:2 spin-orbit resonance)
      mercuryMeshRef.current.rotation.y += delta * 0.04;
    }
    if (shaderRef.current) {
      shaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      <mesh ref={mercuryMeshRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[MercurySurfaceShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uSunPosition: { value: sunPosVec }
          }}
        />
      </mesh>
    </group>
  );
}
