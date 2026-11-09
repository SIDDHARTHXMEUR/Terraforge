import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Uranus Sideways Ice Giant Atmosphere Shader
// Features: 97.77° axial tilt, deep methane red-light absorption,
// subtle zonal bands, vertical ice rings with real-time planet shadow,
// and thin sunlit limb scattering (zero outer halo shells).
// -----------------------------------------------------------------------------
const UranusAtmosphereShader = {
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

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      vec3 texColor = texture2D(uAlbedo, vUv).rgb;

      // Authentic Voyager 2 / Hubble cyan-aquamarine methane coloration
      vec3 uranusCyan = vec3(0.50, 0.82, 0.90);
      vec3 baseColor = mix(texColor, uranusCyan, 0.35);

      // Subtle multi-harmonic zonal atmospheric banding & polar hood brightening
      float lat = (vUv.y - 0.5) * 3.14159265;
      float zonalBands = sin(lat * 14.0) * 0.022 + sin(lat * 28.0) * 0.012 + cos(lat * 56.0) * 0.006;
      float polarHood = smoothstep(0.65, 0.95, abs(lat) / 1.57) * 0.06;
      baseColor += vec3(zonalBands * 0.4 + polarHood * 0.5, zonalBands + polarHood * 0.8, zonalBands * 0.7 + polarHood);

      // Day / Night illumination strictly from Sun
      float NdotL = dot(N, L);
      float diffuse = max(0.0, NdotL);

      // Thin Sunlit-Only Atmospheric Scattering (zero outer teal halo)
      float cosE = clamp(dot(N, V), 0.0, 1.0);
      float sunlitLimb = pow(1.0 - cosE, 6.0) * smoothstep(0.0, 0.25, NdotL);
      vec3 limbColor = vec3(0.55, 0.85, 0.95) * sunlitLimb * 0.40;

      // Dark nightside ambient at 0.015 (dark but textured)
      vec3 nightSide = baseColor * 0.015;

      vec3 surface = baseColor * diffuse * 1.20 + limbColor + nightSide;
      gl_FragColor = vec4(surface, 1.0);
    }
  `
};

// Dedicated Uranus Ring Shader with Planet-on-Ring Shadow Projection
const UranusRingShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = viewMatrix * worldPos;
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vWorldPosition;

    uniform vec3 uSunPosition;
    uniform vec3 uPlanetCenter;
    uniform float uPlanetRadius;

    void main() {
      #include <logdepthbuf_fragment>

      float r = length(vUv - vec2(0.5)) * 2.0;
      if (r < 0.60 || r > 0.98) discard;

      float band = sin(r * 45.0) * 0.5 + 0.5;
      float alpha = (0.2 + band * 0.3) * smoothstep(0.60, 0.68, r) * smoothstep(0.98, 0.90, r);

      vec3 ringColor = vec3(0.65, 0.90, 0.96);

      // Planet shadow on rings
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 ringToPlanet = vWorldPosition - uPlanetCenter;
      float sunProj = dot(-ringToPlanet, L);
      if (sunProj > 0.0) {
        vec3 perp = ringToPlanet + L * sunProj;
        if (length(perp) < uPlanetRadius * 1.02) {
          alpha *= 0.15;
        }
      }

      gl_FragColor = vec4(ringColor, alpha * 0.45);
    }
  `
};

export function CinematicUranus({
  position = [0, 0, 0],
  radius = 6.6,
  axialTilt = (97.77 * Math.PI) / 180, // Sideways rolling tilt
  isPlaying = true,
  sunPosition = [0, 0, 0],
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/uranus/uranus.jpg');
  const bodyRef = useRef();
  const shaderRef = useRef();
  const ringShaderRef = useRef();

  const sunPosVec = useMemo(() => new THREE.Vector3(...sunPosition), [sunPosition]);
  const planetCenterVec = useRef(new THREE.Vector3());

  const ringGeometry = useMemo(() => {
    const innerRadius = radius * 1.35;
    const outerRadius = radius * 2.05;
    return new THREE.RingGeometry(innerRadius, outerRadius, 192);
  }, [radius]);

  useFrame((_, delta) => {
    if (isPlaying && bodyRef.current) {
      // 17.24-hour retrograde rotation
      bodyRef.current.rotation.y -= delta * 0.09;
    }
    if (bodyRef.current) {
      bodyRef.current.getWorldPosition(planetCenterVec.current);
    }

    if (shaderRef.current) {
      shaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
    }
    if (ringShaderRef.current) {
      ringShaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
      ringShaderRef.current.uniforms.uPlanetCenter.value.copy(planetCenterVec.current);
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      {/* 1. Uranus Methane Ice Giant Body - Solid, Opaque, Zero Outer Halos */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[UranusAtmosphereShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uSunPosition: { value: sunPosVec }
          }}
        />
      </mesh>

      {/* 2. Faint Vertical Ice Rings with Dedicated Shader & Shadow */}
      <mesh
        geometry={ringGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow
        receiveShadow
      >
        <shaderMaterial
          ref={ringShaderRef}
          args={[UranusRingShader]}
          uniforms={{
            uSunPosition: { value: sunPosVec },
            uPlanetCenter: { value: planetCenterVec.current },
            uPlanetRadius: { value: radius }
          }}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={true}
        />
      </mesh>
    </group>
  );
}
