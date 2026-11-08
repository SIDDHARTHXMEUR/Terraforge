import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Venus Supercritical Atmosphere & Cloud Shader
// Features: Dense CO2 + H2SO4 cloud deck, sulfur streak absorption,
// atmospheric super-rotation, diffuse twilight wrapping past terminator,
// and physically based thin sunlit limb scattering (zero outer halo shells).
// -----------------------------------------------------------------------------
const VenusCloudDeckShader = {
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

    uniform sampler2D uSurfaceMap;
    uniform sampler2D uAtmosphereMap;
    uniform vec3 uSunPosition;
    uniform float uTime;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      // Cloud UV drift along equatorial jet streams
      vec2 cloudUv = vUv + vec2(uTime * 0.008, 0.0);
      vec3 clouds1 = texture2D(uAtmosphereMap, cloudUv).rgb;
      vec3 clouds2 = texture2D(uSurfaceMap, vUv).rgb;

      // Blend cloud layers into creamy sulfuric acid atmosphere
      vec3 venusCream = vec3(0.92, 0.86, 0.74);
      vec3 baseCloud = mix(clouds2, clouds1, 0.60) * venusCream;

      // 1. Controlled Atmospheric Multiple Scattering with crisp visible terminator
      float NdotL = dot(N, L);
      float diffuse = smoothstep(-0.08, 0.22, NdotL) * max(0.0, NdotL + 0.08);

      vec3 dayIllumination = baseCloud * diffuse * 1.35;

      // 2. Physically based thin limb scattering strictly on SUNLIT side (zero halo on nightside)
      float rim = 1.0 - clamp(dot(N, V), 0.0, 1.0);
      float sunlitLimb = pow(rim, 5.5) * smoothstep(0.0, 0.25, NdotL);
      vec3 limbColor = vec3(0.96, 0.84, 0.60) * sunlitLimb * 0.45;

      // 3. Dense Nightside: dark textured night ambient at 0.015 (dark but readable)
      vec3 nightSide = baseCloud * 0.015;

      gl_FragColor = vec4(dayIllumination + limbColor + nightSide, 1.0);
    }
  `
};

export function CinematicVenus({
  position = [0, 0, 0],
  radius = 3.3,
  axialTilt = (177.3 * Math.PI) / 180, // Retrograde axial tilt
  isPlaying = true,
  sunPosition = [0, 0, 0],
  onClick
}) {
  const [surfaceMap, atmosphereMap] = useTexture([
    '/assets/planets/venus/venus_surface.jpg',
    '/assets/planets/venus/venus_atmosphere.jpg'
  ]);

  const bodyRef = useRef();
  const deckShaderRef = useRef();

  const sunPosVec = useMemo(() => new THREE.Vector3(...sunPosition), [sunPosition]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (deckShaderRef.current) {
      deckShaderRef.current.uniforms.uTime.value = elapsed;
      deckShaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
    }

    if (isPlaying && bodyRef.current) {
      // Retrograde rotation (243 Earth days)
      bodyRef.current.rotation.y -= delta * 0.02;
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      {/* Supercritical Dense Cloud Deck - Solid, Opaque, Zero Outer Halos */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={deckShaderRef}
          args={[VenusCloudDeckShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uSurfaceMap: { value: surfaceMap },
            uAtmosphereMap: { value: atmosphereMap },
            uSunPosition: { value: sunPosVec },
            uTime: { value: 0 }
          }}
        />
      </mesh>
    </group>
  );
}
