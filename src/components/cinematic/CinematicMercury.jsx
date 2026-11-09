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

      // Base 2K NASA MESSENGER albedo map
      vec3 albedo = texture2D(uAlbedo, vUv).rgb;

      // Add high-frequency procedural 3D cratering with zero-mean luminance modulation
      float nCrater = snoise(vLocalPos * 48.0);
      float nFine = snoise(vLocalPos * 96.0) * 0.5;
      float microNoise = (nCrater + nFine) * 0.67;
      float grazingFade = smoothstep(0.05, 0.35, dot(N, V));
      float k = 0.10 * grazingFade;
      vec3 adjustedAlbedo = albedo * (1.0 + microNoise * k);

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
