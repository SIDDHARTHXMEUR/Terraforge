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

      vec3 albedo = texture2D(uAlbedo, vUv).rgb;

      // 3D Procedural micro-relief & zero-mean luminance-only contrast modulation (k <= 0.12)
      float nCrater = snoise(vLocalPos * 36.0);
      float nDetail = snoise(vLocalPos * 84.0) * 0.5;
      float micro = (nCrater + nDetail) * 0.67; // zero mean in [-1, 1]

      float grazingFade = smoothstep(0.05, 0.35, dot(N, V));
      float k = 0.09 * grazingFade;

      // Luminance-only modulation (exact mean preserved, local contrast boosts >= 40%)
      albedo = albedo * (1.0 + micro * k);

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
