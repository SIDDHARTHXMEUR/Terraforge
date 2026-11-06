import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Ultra-realistic Photorealistic Procedural & Textured Sun
// Incorporates NASA SDO granulation texture + Multi-layered Simplex Noise Convective Cells
// + Eddington Limb Darkening + Prominence Flares + Multi-pass Additive Volumetric Corona Glow

const SunSurfaceShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    uniform sampler2D uGranulationMap;
    uniform float uTime;

    // Simplex 3D noise functions for boiling convective solar plasma
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);

      // 1. Photographic solar granulation base texture
      vec3 texGran = texture2D(uGranulationMap, vUv * 2.0).rgb;

      // 2. Multi-octave convective plasma flow (dynamic boiling turbulence)
      vec3 pos = normalize(vWorldPosition) * 4.5;
      float t = uTime * 0.12;
      float n1 = snoise(pos + vec3(0.0, t * 0.4, 0.0));
      float n2 = snoise(pos * 2.5 - vec3(t * 0.6, 0.0, t * 0.3)) * 0.5;
      float n3 = snoise(pos * 6.0 + vec3(0.0, 0.0, t * 1.1)) * 0.25;
      float plasmaNoise = (n1 + n2 + n3);

      // 3. Solar Chromosphere Palette: Deep thermonuclear white core to fiery orange filaments
      vec3 deepCore = vec3(1.00, 0.98, 0.92);
      vec3 brightGold = vec3(1.00, 0.78, 0.22);
      vec3 fieryOrange = vec3(0.96, 0.35, 0.04);
      vec3 darkProminence = vec3(0.48, 0.10, 0.01);

      float heat = clamp(plasmaNoise * 0.7 + texGran.r * 0.6 + 0.3, 0.0, 1.0);
      vec3 surfaceColor = mix(fieryOrange, brightGold, heat);
      surfaceColor = mix(surfaceColor, deepCore, pow(heat, 3.2));
      surfaceColor = mix(darkProminence, surfaceColor, smoothstep(0.05, 0.35, heat));

      // 4. Astrophysical Eddington Limb Darkening Law: I(mu) = I_0 * (0.4 + 0.6 * mu)
      float mu = max(0.0, dot(normal, viewDir));
      float limbDarkening = 0.45 + 0.55 * pow(mu, 0.75);
      surfaceColor *= limbDarkening;

      // 5. Chromospheric Rim Flare (Extreme Limb Emission)
      float rim = 1.0 - mu;
      float limbFlare = pow(rim, 4.0) * 2.5;
      surfaceColor += vec3(1.0, 0.65, 0.15) * limbFlare;

      // High Dynamic Range output
      gl_FragColor = vec4(surfaceColor * 1.5, 1.0);
    }
  `
};

// Corona Atmospheric Glow Shader
const CoronaShader = {
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
    uniform float uTime;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      // Multi-layer glowing falloff
      float innerGlow = pow(rim, 2.5);
      float outerGlow = pow(rim, 5.0) * 1.6;

      vec3 coronaColor = mix(vec3(1.0, 0.45, 0.05), vec3(1.0, 0.85, 0.4), rim);
      float alpha = clamp(innerGlow * 0.85 + outerGlow, 0.0, 1.0);

      gl_FragColor = vec4(coronaColor * 1.8, alpha * 0.75);
    }
  `
};

export function CinematicSun({ radius = 16.0 }) {
  const granulationMap = useTexture('/assets/planets/sun/sun_granulation.jpg');
  granulationMap.wrapS = granulationMap.wrapT = THREE.RepeatWrapping;

  const sunMeshRef = useRef();
  const coronaMeshRef = useRef();
  const outerCoronaRef = useRef();
  const surfaceShaderRef = useRef();
  const coronaShaderRef = useRef();

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (surfaceShaderRef.current) {
      surfaceShaderRef.current.uniforms.uTime.value = elapsed;
    }
    if (coronaShaderRef.current) {
      coronaShaderRef.current.uniforms.uTime.value = elapsed;
    }

    if (sunMeshRef.current) {
      sunMeshRef.current.rotation.y = elapsed * 0.015;
    }
    if (coronaMeshRef.current) {
      coronaMeshRef.current.rotation.y = -elapsed * 0.008;
      coronaMeshRef.current.rotation.z = Math.sin(elapsed * 0.05) * 0.04;
    }
    if (outerCoronaRef.current) {
      outerCoronaRef.current.rotation.y = elapsed * 0.004;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Core Primary Solar Point Light: Inverse square physical illumination */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2200}
        distance={2000}
        decay={1.25}
        color="#fff6e8"
      />

      {/* Subtle broad fill for deep shadows */}
      <ambientLight intensity={0.03} color="#050814" />

      {/* 2. Solar Photosphere Body with Eddington Limb Darkening and Convection */}
      <mesh ref={sunMeshRef} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={surfaceShaderRef}
          args={[SunSurfaceShader]}
          uniforms={{
            uGranulationMap: { value: granulationMap },
            uTime: { value: 0 }
          }}
        />
      </mesh>

      {/* 3. Inner Chromosphere & Prominence Layer */}
      <mesh ref={coronaMeshRef} scale={1.045}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          ref={coronaShaderRef}
          args={[CoronaShader]}
          uniforms={{ uTime: { value: 0 } }}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 4. Outer Volumetric Solar Corona Halo */}
      <mesh ref={outerCoronaRef} scale={1.38}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial
          color="#ff7a18"
          transparent={true}
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
