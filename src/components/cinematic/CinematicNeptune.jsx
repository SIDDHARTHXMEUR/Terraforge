import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Neptune Supersonic Storm Giant Shader
// Features: Deep cobalt-blue coloration, high-altitude white methane cirrus streaks
// ("The Scooter"), Great Dark Spot cyclonic storm, supersonic differential drift,
// and thin sunlit azure limb scattering (zero outer halo shells).
// -----------------------------------------------------------------------------
const NeptuneAtmosphereShader = {
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
    uniform float uTime;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      vec3 texColor = texture2D(uAlbedo, vUv).rgb;

      // Authentic Deep Cobalt-Blue Neptune Palette
      vec3 deepNeptuneBlue = vec3(0.06, 0.18, 0.58);
      vec3 baseColor = mix(texColor, deepNeptuneBlue, 0.50);

      // 1. Multi-harmonic supersonic zonal jet bands (Voyager 2 / HST authentic banding)
      float lat = (vUv.y - 0.5) * 3.14159265;
      float jetBands = sin(lat * 16.0 + uTime * 0.015) * 0.028 + sin(lat * 32.0 - uTime * 0.008) * 0.014 + cos(lat * 64.0) * 0.007;
      baseColor += vec3(0.03, 0.08, 0.20) * jetBands;

      // 2. The Great Dark Spot (Voyager 2 anticyclonic storm at -20° latitude)
      vec2 spotCenter = vec2(0.55 + sin(uTime * 0.005) * 0.05, 0.38);
      float spotDist = length((vUv - spotCenter) * vec2(2.2, 1.0));
      float darkSpot = smoothstep(0.03, 0.10, spotDist);
      baseColor *= mix(0.70, 1.0, darkSpot);

      // 3. Subtle Methane Atmosphere Shading
      float subtleBanding = sin(vUv.y * 14.0 + uTime * 0.01) * 0.012;
      baseColor += vec3(0.04, 0.08, 0.16) * subtleBanding;

      // Day / Night illumination strictly from Sun
      float NdotL = dot(N, L);
      float diffuse = max(0.0, NdotL);

      // Thin Sunlit-Only Azure Limb Scattering (zero halo on nightside)
      float cosE = clamp(dot(N, V), 0.0, 1.0);
      float sunlitScatter = pow(1.0 - cosE, 5.5) * smoothstep(0.0, 0.25, NdotL);
      vec3 azureLimb = vec3(0.22, 0.50, 0.95) * sunlitScatter * 0.50;

      // Dark nightside ambient at 0.015 (dark but textured)
      vec3 nightSide = baseColor * 0.015;

      vec3 surface = baseColor * diffuse * 1.25 + azureLimb + nightSide;
      gl_FragColor = vec4(surface, 1.0);
    }
  `
};

export function CinematicNeptune({
  position = [0, 0, 0],
  radius = 6.3,
  axialTilt = (28.32 * Math.PI) / 180,
  isPlaying = true,
  sunPosition = [0, 0, 0],
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/neptune/neptune.jpg');
  const bodyRef = useRef();
  const shaderRef = useRef();

  const sunPosVec = useMemo(() => new THREE.Vector3(...sunPosition), [sunPosition]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = elapsed;
      shaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
    }

    if (isPlaying && bodyRef.current) {
      // 16.11-hour Jovian-speed rotation
      bodyRef.current.rotation.y += delta * 0.10;
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      {/* 1. Neptune Supersonic Storm Atmosphere Body - Solid, Opaque, Zero Outer Halos */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[NeptuneAtmosphereShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uAlbedo: { value: albedoMap },
            uSunPosition: { value: sunPosVec },
            uTime: { value: 0 }
          }}
        />
      </mesh>
    </group>
  );
}
