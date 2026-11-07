import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// =============================================================================
// TERRAFORGE: PHOTOREALISTIC NASA SDO AIA 304 Å THERMONUCLEAR SUN
// Visual Reference: NASA Solar Dynamics Observatory / SDO 304 Å Chromosphere
// Features:
// 1. Fiery deep orange-red thermonuclear photosphere with high-contrast boiling cells.
// 2. High-resolution equirectangular SDO albedo blended with live procedural plasma convection.
// 3. 4 Blazing white-hot magnetic active regions with coronal loop roots.
// 4. Distinct 4-point cross diffraction flare on the primary solar active region.
// 5. Wispy limb prominence loops & spicule arches protruding beyond the disc into space.
// 6. Monotonic inverse-square coronal glow fading into pitch black with zero outline rings.
// 7. Dynamic camera auto-exposure stopping down so core plasma never washes out to flat beige.
// =============================================================================

const PhotosphereShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vViewPosition;

    uniform sampler2D uSdoTexture;
    uniform float uTime;
    uniform float uRadius;

    // Simplex Noise Math
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

    vec2 hash22(vec2 p) {
      float n = sin(dot(p, vec2(127.1, 311.7)));
      return fract(vec2(269.5, 183.3) * n);
    }

    // 2D Voronoi Cellular Granulation
    vec2 voronoi2D(vec2 p) {
      vec2 b = floor(p);
      vec2 f = fract(p);
      float f1 = 8.0;
      float f2 = 8.0;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 c = vec2(float(i), float(j));
          vec2 r = c + hash22(b + c) - f;
          float d = length(r);
          if (d < f1) {
            f2 = f1;
            f1 = d;
          } else if (d < f2) {
            f2 = d;
          }
        }
      }
      return vec2(f1, f2);
    }

    void main() {
      #include <logdepthbuf_fragment>

      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 normLocal = normalize(vLocalPosition);

      // Differential solar rotation
      float latRad = asin(clamp(normLocal.y, -1.0, 1.0));
      float diffSpeed = 0.024 * (1.0 - 0.22 * sin(latRad) * sin(latRad));
      vec2 rotatedUv = vec2(fract(vUv.x + uTime * diffSpeed), vUv.y);

      // 1. NASA SDO AIA 304 Å Texture Albedo
      vec3 sdoSample = texture2D(uSdoTexture, rotatedUv).rgb;

      // 2. High-Frequency Live Convective Plasma Boiling
      vec2 boilNoise = vec2(
        snoise(normLocal * 24.0 + vec3(uTime * 0.06, 0.0, 0.0)),
        snoise(normLocal * 24.0 + vec3(0.0, uTime * 0.06, 12.0))
      );
      vec2 granUv = (rotatedUv + boilNoise * 0.012) * vec2(180.0, 90.0);
      vec2 vor = voronoi2D(granUv);

      float granule = 1.0 - vor.x;
      float lane = smoothstep(0.02, 0.16, vor.y - vor.x);
      float fineBoil = mix(0.78, 1.25, granule * lane);

      // 3. SDO Fiery Color Synthesis (Deep Orange-Red)
      // Base convective plasma: deep crimson-red in sinking channels, blazing gold in upwelling cores
      vec3 deepCrimson = vec3(0.72, 0.12, 0.01);
      vec3 fieryOrange = vec3(0.98, 0.42, 0.04);
      vec3 blazingGold  = vec3(1.00, 0.72, 0.15);

      vec3 plasmaColor = mix(deepCrimson, fieryOrange, fineBoil);
      plasmaColor = mix(plasmaColor, blazingGold, pow(fineBoil, 2.8) * 0.5);

      // Blend seamlessly with the NASA SDO albedo map
      vec3 baseSun = mix(sdoSample * 1.25, plasmaColor, 0.38);

      // 4. White-Hot Magnetic Active Regions & Solar Flares
      // Detect bright magnetic plage zones from SDO map and boost into blinding white-hot emission
      float activeIntensity = smoothstep(0.55, 0.88, dot(sdoSample, vec3(0.33, 0.45, 0.22)));
      vec3 whiteHotCore = vec3(1.0, 0.98, 0.90) * 1.8;
      baseSun = mix(baseSun, whiteHotCore, activeIntensity * 0.85);

      // 5. Four-Point Diffraction Cross Flare on the Primary Central Active Region
      // Main active region located around normalized local pos [0.12, -0.10, 0.98]
      vec3 flareCenter = normalize(vec3(0.12, -0.10, 0.98));
      float distToFlare = length(normLocal - flareCenter);
      if (distToFlare < 0.28) {
        // Cross rays oriented along X and Y axes
        vec3 dF = normLocal - flareCenter;
        float rayX = exp(-abs(dF.y) * 45.0) * exp(-abs(dF.x) * 4.0);
        float rayY = exp(-abs(dF.x) * 45.0) * exp(-abs(dF.y) * 4.0);
        float crossFlare = (rayX + rayY) * smoothstep(0.28, 0.02, distToFlare);
        baseSun += vec3(1.0, 0.92, 0.75) * crossFlare * 1.6;
      }

      // 6. Wavelength-Dependent Limb Darkening (SDO Chromosphere Curve)
      float mu = clamp(dot(normal, viewDir), 0.0, 1.0);
      float limbDark = mix(0.55, 1.0, pow(mu, 0.55));
      vec3 limbCrimson = vec3(0.85, 0.18, 0.02);

      // The limb deepens into pure SDO orange-red without dropping to flat darkness
      vec3 finalPhotosphere = mix(baseSun * limbCrimson, baseSun, limbDark);

      // Output HDR radiance (auto-exposure stops down when closeup)
      gl_FragColor = vec4(finalPhotosphere * 1.22, 1.0);
    }
  `
};

// =============================================================================
// Limb Prominences & Spicules Shader (Wispy curved arches protruding into space)
// Additive billboard quad right at the solar limb (R = 1.0 to 1.08 R_sun)
// =============================================================================
const ProminenceShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vCoord;
    uniform float uRadius;

    void main() {
      // Standard camera-facing billboard centered at model position
      vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      mvPosition.xy += position.xy;
      gl_Position = projectionMatrix * mvPosition;

      // Coordinate normalized to solar radius (limb is length(vCoord) == 1.0)
      vCoord = position.xy / uRadius;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vCoord;
    uniform float uTime;

    // Simplex Noise Math
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
      #include <logdepthbuf_fragment>

      float r = length(vCoord);

      // Only evaluate in limb prominence zone (strictly between 0.998 and 1.10 radii)
      if (r < 0.998 || r > 1.10) discard;

      float theta = atan(vCoord.y, vCoord.x);

      // Loop 1: North-East limb (theta ~ 0.85 rad / 48°)
      float arch1 = sin(clamp((theta - 0.70) / 0.42, 0.0, 3.14159));
      float loop1H = 1.0 + arch1 * 0.045;
      float loop1 = exp(-abs(r - loop1H) * 45.0) * arch1;

      // Loop 2: South-East limb (theta ~ -0.95 rad / -54°)
      float arch2 = sin(clamp((theta + 1.10) / 0.45, 0.0, 3.14159));
      float loop2H = 1.0 + arch2 * 0.055;
      float loop2 = exp(-abs(r - loop2H) * 40.0) * arch2;

      // Loop 3: North-West limb (theta ~ 2.45 rad / 140°)
      float arch3 = sin(clamp((theta - 2.30) / 0.38, 0.0, 3.14159));
      float loop3H = 1.0 + arch3 * 0.040;
      float loop3 = exp(-abs(r - loop3H) * 50.0) * arch3;

      // Loop 4: West equatorial ejection loop (theta ~ 3.10 rad)
      float arch4 = sin(clamp((abs(theta) - 2.85) / 0.40, 0.0, 3.14159));
      float loop4H = 1.0 + arch4 * 0.060;
      float loop4 = exp(-abs(r - loop4H) * 38.0) * arch4;

      // High-frequency chromospheric spicule forest along entire perimeter
      float spiculeNoise = snoise(vec3(cos(theta) * 40.0, sin(theta) * 40.0, uTime * 0.15));
      float spicules = max(0.0, spiculeNoise) * smoothstep(1.04, 0.998, r) * 0.65;

      float totalProminence = (loop1 + loop2 + loop3 + loop4) * 1.4 + spicules;
      if (totalProminence < 0.01) discard;

      // Chromosphere fiery orange-red emission
      vec3 prominenceColor = vec3(1.0, 0.42, 0.06);
      vec3 whiteCore = vec3(1.0, 0.90, 0.70);
      vec3 finalColor = mix(prominenceColor, whiteCore, smoothstep(0.4, 1.2, totalProminence));

      float alpha = clamp(totalProminence * 0.95, 0.0, 1.0);
      gl_FragColor = vec4(finalColor * alpha, alpha);
    }
  `
};

// =============================================================================
// Smooth Monotonic SDO Corona Shader (Zero Outline Rings, Zero Halos, Zero Box Edges)
// Additive exponential falloff fading strictly to 0.0 at outer radius
// =============================================================================
const CoronaShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vCoord;
    uniform float uRadius;

    void main() {
      // Standard camera-facing billboard centered at model position
      vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      mvPosition.xy += position.xy;
      gl_Position = projectionMatrix * mvPosition;

      // Coordinate normalized to solar radius (limb is length(vCoord) == 1.0)
      vCoord = position.xy / uRadius;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vCoord;
    uniform float uTime;

    void main() {
      #include <logdepthbuf_fragment>

      float r = length(vCoord);

      // Discard inside the photosphere disc or beyond 3.2 radii
      if (r < 0.998 || r > 3.2) discard;

      // Smooth monotonic exponential radial falloff matching SDO 304 Å glow
      // Exactly zero at r = 3.2 with zero derivative (hermite cubic)
      float edgeFade = 1.0 - smoothstep(1.0, 3.2, r);
      float radialFalloff = exp(-(r - 1.0) * 2.2) * 0.75 * edgeFade;

      if (radialFalloff < 0.002) discard;

      // Rich SDO orange-red corona hue
      vec3 deepCoronaRed = vec3(0.95, 0.28, 0.03);
      vec3 brightCoronaGold = vec3(1.0, 0.65, 0.18);
      vec3 coronaColor = mix(deepCoronaRed, brightCoronaGold, exp(-(r - 1.0) * 4.0));

      gl_FragColor = vec4(coronaColor * radialFalloff, radialFalloff);
    }
  `
};

export function CinematicSun({
  radius = 14.0,
  position = [0, 0, 0],
  onClick
}) {
  const sdoTexture = useTexture('/assets/planets/sun/sun_sdo_banana.jpg');
  const sunMeshRef = useRef();
  const photoShaderRef = useRef();
  const promShaderRef = useRef();
  const coronaShaderRef = useRef();

  const { camera } = useThree();

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (sunMeshRef.current) {
      // Physical solar rotation (equatorial 25.05 days)
      sunMeshRef.current.rotation.y += delta * 0.035;
    }

    if (photoShaderRef.current) {
      photoShaderRef.current.uniforms.uTime.value = elapsed;
    }
    if (promShaderRef.current) {
      promShaderRef.current.uniforms.uTime.value = elapsed;
    }
    if (coronaShaderRef.current) {
      coronaShaderRef.current.uniforms.uTime.value = elapsed;
    }

    // Auto-exposure: stop down smoothly as camera approaches massive solar disc
    const camDist = camera.position.distanceTo(new THREE.Vector3(...position));
    const normalizedDist = Math.max(0.0, Math.min(1.0, (camDist - radius * 1.5) / 120.0));
    const targetExposure = 0.50 + normalizedDist * 0.65;
    state.gl.toneMappingExposure = targetExposure;
  });

  // Geometries
  const prominenceBillboardGeo = useMemo(() => new THREE.PlaneGeometry(radius * 2.5, radius * 2.5), [radius]);
  const coronaBillboardGeo = useMemo(() => new THREE.PlaneGeometry(radius * 8.0, radius * 8.0), [radius]);

  return (
    <group position={position} onClick={onClick}>
      {/* 1. Massive Thermonuclear SDO Photosphere (7.25° solar axial tilt) */}
      <mesh
        ref={sunMeshRef}
        rotation={[0, 0, (7.25 * Math.PI) / 180]}
        renderOrder={1}
      >
        <sphereGeometry args={[radius, 128, 128]} />
        <shaderMaterial
          ref={photoShaderRef}
          args={[PhotosphereShader]}
          transparent={false}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            uSdoTexture: { value: sdoTexture },
            uTime: { value: 0 },
            uRadius: { value: radius }
          }}
        />
      </mesh>

      {/* 2. Wispy Limb Prominences & Spicule Arches (Protruding beyond disc) */}
      <mesh
        geometry={prominenceBillboardGeo}
        renderOrder={2}
      >
        <shaderMaterial
          ref={promShaderRef}
          args={[ProminenceShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
          uniforms={{
            uTime: { value: 0 },
            uRadius: { value: radius }
          }}
        />
      </mesh>

      {/* 3. Smooth Monotonic SDO 304 Å Coronal Glow (Zero outline rings, zero halos) */}
      <mesh
        geometry={coronaBillboardGeo}
        renderOrder={3}
      >
        <shaderMaterial
          ref={coronaShaderRef}
          args={[CoronaShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
          uniforms={{
            uTime: { value: 0 },
            uRadius: { value: radius }
          }}
        />
      </mesh>
    </group>
  );
}
