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
    varying vec3 vLocalPos;

    void main() {
      vUv = uv;
      vLocalPos = normalize(position);
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
    varying vec3 vLocalPos;

    uniform sampler2D uAlbedo;
    uniform vec3 uSunPosition;
    uniform float uTime;

    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
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

      // 3. Subtle Methane Atmosphere Shading & High Cirrus Streaks
      float subtleBanding = sin(vUv.y * 14.0 + uTime * 0.01) * 0.012;
      baseColor += vec3(0.04, 0.08, 0.16) * subtleBanding;

      // 3D Procedural supersonic cirrus & eddy micro-contrast (zero mean luminance modulation)
      float nCirrus = snoise(vec3(vLocalPos.x * 12.0, vLocalPos.y * 48.0, vLocalPos.z * 12.0));
      float nTurb = snoise(vec3(vLocalPos.x * 30.0, vLocalPos.y * 72.0, vLocalPos.z * 30.0)) * 0.5;
      float micro = (nCirrus + nTurb) * 0.67;
      float grazingFade = smoothstep(0.05, 0.35, dot(N, V));
      float k = 0.07 * grazingFade;
      baseColor = baseColor * (1.0 + micro * k);

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
