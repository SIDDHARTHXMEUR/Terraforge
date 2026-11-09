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

      // Authentic Voyager 2 / Hubble cyan-aquamarine methane coloration
      vec3 uranusCyan = vec3(0.50, 0.82, 0.90);
      vec3 baseColor = mix(texColor, uranusCyan, 0.35);

      // Subtle multi-harmonic zonal atmospheric banding & polar hood brightening
      float lat = (vUv.y - 0.5) * 3.14159265;
      float zonalBands = sin(lat * 14.0) * 0.022 + sin(lat * 28.0) * 0.012 + cos(lat * 56.0) * 0.006;
      float polarHood = smoothstep(0.65, 0.95, abs(lat) / 1.57) * 0.06;
      baseColor += vec3(zonalBands * 0.4 + polarHood * 0.5, zonalBands + polarHood * 0.8, zonalBands * 0.7 + polarHood);

      // 3D Procedural subtle methane haze streaks (zero mean luminance modulation)
      float nHaze = snoise(vec3(vLocalPos.x * 8.0, vLocalPos.y * 36.0, vLocalPos.z * 8.0));
      float grazingFade = smoothstep(0.05, 0.35, dot(N, V));
      float k = 0.05 * grazingFade;
      baseColor = baseColor * (1.0 + nHaze * k);

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
