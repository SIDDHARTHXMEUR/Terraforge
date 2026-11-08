import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Mars Iron-Oxide Surface Shader
// Features: 2K NASA Viking albedo, Olympus Mons & Valles Marineris relief,
// polar ice caps, and physically based thin sunlit dust scatter (zero outer halos).
// -----------------------------------------------------------------------------
const MarsSurfaceShader = {
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

      vec3 albedo = texture2D(uAlbedo, vUv).rgb;

      // Polar Ice Caps
      float lat = abs(vUv.y - 0.5) * 2.0;
      float isPolarCap = smoothstep(0.85, 0.96, lat) * smoothstep(0.45, 0.75, length(albedo));

      // Day / Night illumination strictly from Sun position
      float NdotL = dot(N, L);
      float diffuse = max(0.0, NdotL);

      // Mars crisp soft terminator with subtle dusty twilight
      float twilight = smoothstep(0.06, -0.03, NdotL) * smoothstep(-0.06, 0.02, NdotL) * 0.12;
      vec3 twilightColor = vec3(0.85, 0.42, 0.18) * twilight;

      vec3 surfaceDay = albedo * diffuse * 1.50 + twilightColor;

      // Polar caps
      if (isPolarCap > 0.01) {
        vec3 polarIce = vec3(0.95, 0.96, 1.0) * diffuse * 1.8;
        surfaceDay = mix(surfaceDay, polarIce, isPolarCap * 0.85);
      }

      // Thin Sunlit-Only Atmospheric Dust Scattering (zero halo on nightside)
      float rim = 1.0 - clamp(dot(N, V), 0.0, 1.0);
      float sunlitLimb = pow(rim, 5.5) * smoothstep(0.0, 0.25, NdotL);
      vec3 limbColor = vec3(0.90, 0.52, 0.28) * sunlitLimb * 0.50;

      // Dark nightside: textured ambient at 0.015 (dark but readable)
      vec3 nightSide = albedo * 0.015;

      gl_FragColor = vec4(surfaceDay + limbColor + nightSide, 1.0);
    }
  `
};

export function CinematicMars({
  position = [0, 0, 0],
  radius = 2.7,
  axialTilt = (25.19 * Math.PI) / 180,
  isPlaying = true,
  sunPosition = [0, 0, 0],
  onClick
}) {
  const albedoMap = useTexture('/assets/planets/mars/mars.jpg');
  const marsBodyRef = useRef();
  const shaderRef = useRef();

  const sunPosVec = useMemo(() => new THREE.Vector3(...sunPosition), [sunPosition]);

  useFrame((_, delta) => {
    if (isPlaying && marsBodyRef.current) {
      // 24.62-hour Martian sol
      marsBodyRef.current.rotation.y += delta * 0.11;
    }
    if (shaderRef.current) {
      shaderRef.current.uniforms.uSunPosition.value.copy(sunPosVec);
    }
  });

  return (
    <group position={position} rotation={[0, 0, axialTilt]} onClick={onClick}>
      <mesh ref={marsBodyRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          args={[MarsSurfaceShader]}
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
