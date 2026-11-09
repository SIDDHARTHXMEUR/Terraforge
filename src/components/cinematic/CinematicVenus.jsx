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

    uniform sampler2D uSurfaceMap;
    uniform sampler2D uAtmosphereMap;
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

      // Cloud UV drift along equatorial jet streams
      vec2 cloudUv = vUv + vec2(uTime * 0.008, 0.0);
      vec3 clouds1 = texture2D(uAtmosphereMap, cloudUv).rgb;
      vec3 clouds2 = texture2D(uSurfaceMap, vUv).rgb;

      // Blend cloud layers into creamy sulfuric acid atmosphere
      vec3 venusCream = vec3(0.92, 0.86, 0.74);
      vec3 baseCloud = mix(clouds2, clouds1, 0.60) * venusCream;

      // 3D Procedural cloud-top swirl and streak detail (zero mean luminance-only modulation)
      float nSwirl = snoise(vec3(vLocalPos.x * 16.0, vLocalPos.y * 8.0, vLocalPos.z * 16.0));
      float nFine = snoise(vec3(vLocalPos.x * 32.0, vLocalPos.y * 16.0, vLocalPos.z * 32.0)) * 0.5;
      float micro = (nSwirl + nFine) * 0.67;
      float grazingFade = smoothstep(0.05, 0.35, dot(N, V));
      float k = 0.08 * grazingFade;
      baseCloud = baseCloud * (1.0 + micro * k);

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
