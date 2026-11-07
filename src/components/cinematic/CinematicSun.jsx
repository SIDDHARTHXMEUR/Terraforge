import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// =============================================================================
// TERRAFORGE: PHOTOREALISTIC NASA SDO AIA 304 Å THERMONUCLEAR SUN
// Visual Target: NASA Solar Dynamics Observatory / SDO 304 Å Chromosphere
// Features:
// 1. Fiery deep orange-red photosphere with fine high-contrast boiling convective cells.
// 2. High-resolution equirectangular SDO albedo with live multi-scale plasma turbulence.
// 3. Searing white-hot magnetic active regions & plages across ±30° solar latitudes.
// 4. Screen-space razor-sharp 4-point cross diffraction flare on the central active region.
// 5. Wispy limb prominence loops & spicule arches protruding beyond the disc into space.
// 6. Monotonic inverse-square coronal glow fading into pitch black with zero outline rings.
// 7. Dynamic auto-exposure keeping core plasma searing and luminous.
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
    varying vec3 vFlareViewPos;

    uniform float uRadius;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;

      // Primary active flare location in local space [0.04, -0.14, 0.98]
      vec3 flareLocal = normalize(vec3(0.04, -0.14, 0.98)) * uRadius;
      vec4 flareMv = modelViewMatrix * vec4(flareLocal, 1.0);
      vFlareViewPos = -flareMv.xyz;

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
    varying vec3 vFlareViewPos;

    uniform sampler2D uSdoTexture;
    uniform float uTime;
    uniform float uRadius;

    // Simplex Noise Math for fluid plasma turbulence
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

    // 2D Voronoi Cellular Convection
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

      // 1. Differential Solar Rotation
      float latRad = asin(clamp(normLocal.y, -1.0, 1.0));
      float diffSpeed = 0.024 * (1.0 - 0.22 * sin(latRad) * sin(latRad));
      vec2 rotatedUv = vec2(fract(vUv.x + uTime * diffSpeed), vUv.y);

      // 2. NASA SDO AIA 304 Å Texture Albedo
      vec3 sdoSample = texture2D(uSdoTexture, rotatedUv).rgb;

      // 3. High-Frequency Live Convective Plasma Boiling
      // Multi-scale 3D domain-warped noise
      vec3 boilPos = normLocal * 16.0 + vec3(uTime * 0.04, 0.0, uTime * 0.03);
      vec2 boilWarp = vec2(
        snoise(boilPos),
        snoise(boilPos + vec3(19.2, 37.4, 53.8))
      ) * 0.0035;

      // Dense granulation grid: 480 x 240 cells (~1% radius scale)
      vec2 granUv = (rotatedUv + boilWarp) * vec2(480.0, 240.0);
      vec2 vor = voronoi2D(granUv);

      // Smooth convex cell kernel: 1.0 at center, smoothly decaying to edges
      float cellKernel = exp(-vor.x * 2.8);
      float laneFactor = smoothstep(0.01, 0.28, vor.y - vor.x);
      // Convection profile: warm crimson valleys (never black lines!), golden cell cores
      float convection = mix(0.85, 1.30, cellKernel * (0.65 + 0.35 * laneFactor));

      // Micro-scale plasma turbulence
      float microTurb = snoise(normLocal * 80.0 + vec3(uTime * 0.06, 0.0, 0.0)) * 0.10;
      convection += microTurb;

      // Supergranulation: secondary larger convective currents
      float superGran = snoise(normLocal * 22.0 + vec3(uTime * 0.02, 0.0, 0.0)) * 0.12 + 1.0;

      // 4. Vibrant NASA SDO 304 Å Plasma Palette
      vec3 laneVermilion = vec3(0.82, 0.14, 0.01); // Warm glowing intergranular channels
      vec3 cellOrange    = vec3(1.00, 0.50, 0.03); // Radiating plasma body
      vec3 hotGold       = vec3(1.00, 0.80, 0.22); // Upwelling cell core

      vec3 granColor = mix(laneVermilion, cellOrange, clamp((convection - 0.78) * 2.2, 0.0, 1.0));
      granColor = mix(granColor, hotGold, clamp((convection - 1.15) * 3.0, 0.0, 1.0));

      // Blend convective factor with SDO texture (preserves all filaments and active regions)
      vec3 baseSun = sdoSample * granColor * 1.22 * superGran;

      // 5. White-Hot Magnetic Active Regions & Plages
      float lum = dot(sdoSample, vec3(0.33, 0.52, 0.15));
      float plageIntensity = smoothstep(0.44, 0.80, lum);
      vec3 goldenPlage = vec3(1.0, 0.84, 0.30) * 1.7;
      baseSun = mix(baseSun, goldenPlage, plageIntensity * 0.75);

      float flareIntensity = smoothstep(0.74, 0.92, lum);
      vec3 whiteHotCore = vec3(1.0, 0.99, 0.95) * 2.9;
      baseSun = mix(baseSun, whiteHotCore, flareIntensity * 0.95);

      // 6. Camera-Space Razor-Sharp 4-Point Diffraction Cross Flare
      // Aligned with camera axes for true astronomical telescope appearance
      vec3 flareCenter = normalize(vec3(0.04, -0.14, 0.98));
      float distToFlare = length(normLocal - flareCenter);
      if (distToFlare < 0.40) {
        // Compute delta in camera view space (normalized by radius)
        vec2 dV = (vViewPosition.xy - vFlareViewPos.xy) / uRadius;
        // Razor-thin horizontal and vertical diffraction spikes
        float rayX = exp(-abs(dV.y) * 340.0) * exp(-abs(dV.x) * 4.2);
        float rayY = exp(-abs(dV.x) * 340.0) * exp(-abs(dV.y) * 4.2);
        // Concentric glare bloom
        float dR = length(dV);
        float coreBloom = exp(-dR * 28.0) * 1.8 + exp(-dR * 90.0) * 3.8;
        float crossFlare = (rayX + rayY) * 2.4 + coreBloom;
        float flareMask = smoothstep(0.40, 0.02, distToFlare);
        baseSun += vec3(1.0, 0.97, 0.88) * crossFlare * flareMask;
      }

      // Secondary Active Region Flare on Upper-Left Limb (10 o'clock)
      vec3 flare2Center = normalize(vec3(-0.62, 0.52, 0.58));
      float dist2 = length(normLocal - flare2Center);
      if (dist2 < 0.25) {
        vec3 dF2 = normLocal - flare2Center;
        float ray2X = exp(-abs(dF2.y) * 180.0) * exp(-abs(dF2.x) * 6.5);
        float ray2Y = exp(-abs(dF2.x) * 180.0) * exp(-abs(dF2.y) * 6.5);
        float c2 = (ray2X + ray2Y) * 1.4 + exp(-dist2 * 32.0) * 2.2;
        baseSun += vec3(1.0, 0.96, 0.86) * c2 * smoothstep(0.25, 0.02, dist2);
      }

      // 7. Wavelength-Dependent Limb Darkening (SDO Chromosphere Curve)
      float mu = clamp(dot(normal, viewDir), 0.0, 1.0);
      float limbDark = mix(0.55, 1.0, pow(mu, 0.46));
      vec3 limbCrimson = vec3(0.94, 0.24, 0.02);

      // Chromosphere deepens into intense glowing orange-red toward the perimeter
      vec3 finalPhotosphere = mix(baseSun * limbCrimson, baseSun, limbDark);

      // Micro-spicule horizon modulation at extreme grazing angle (mu < 0.10)
      if (mu < 0.10) {
        float spiculeRoughness = snoise(normLocal * 120.0 + vec3(uTime * 0.15, 0.0, 0.0));
        finalPhotosphere *= mix(0.88, 1.22, spiculeRoughness * 0.5 + 0.5);
      }

      // Output radiant HDR luminance
      gl_FragColor = vec4(finalPhotosphere * 1.24, 1.0);
    }
  `
};

// =============================================================================
// Wispy Limb Prominences & Spicules Shader
// Additive camera-facing billboard right at the solar limb (R = 1.0 to 1.14 R_sun)
// Models actual plasma loops, magnetic arches, and the dense spicule carpet.
// Zero black fill, zero hard rim, exactly zero outside 1.14 R_sun.
// =============================================================================
const ProminenceShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vCoord;
    uniform float uRadius;

    void main() {
      // Standard camera-facing billboard centered at Sun position
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
    uniform float uRadius;
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

      // Only render in limb prominence zone (strictly between 0.996 and 1.14 radii)
      if (r < 0.996 || r > 1.14) discard;

      float theta = atan(vCoord.y, vCoord.x);

      // 1. Dense Carpet of Spicules all around the 360° perimeter
      float spiculeNoise = snoise(vec3(cos(theta) * 150.0, sin(theta) * 150.0, uTime * 0.22));
      float spiculeH = 1.0 + 0.026 * max(0.0, spiculeNoise);
      float spicule = exp(-(r - 1.0) * 60.0) * smoothstep(spiculeH, 1.0, r);

      // 2. Signature Prominence Loops matching the NASA SDO Reference Image:
      // Loop 1: Upper-left eruptive flare & prominence (10 o'clock, theta ~ 2.44 rad)
      float arch1Ang = (theta - 2.44) / 0.28;
      float arch1 = 0.0;
      if (abs(arch1Ang) < 1.0) {
        float arch1H = 1.0 + 0.070 * sqrt(1.0 - arch1Ang * arch1Ang);
        float filament1 = 0.6 + 0.4 * sin(r * 280.0 + theta * 30.0 + uTime * 2.0);
        arch1 = exp(-abs(r - arch1H) * 68.0) * filament1 * (1.0 - arch1Ang * arch1Ang);
      }

      // Loop 2: Upper-right magnetic loop (2 o'clock, theta ~ 0.96 rad)
      float arch2Ang = (theta - 0.96) / 0.22;
      float arch2 = 0.0;
      if (abs(arch2Ang) < 1.0) {
        float arch2H = 1.0 + 0.052 * sqrt(1.0 - arch2Ang * arch2Ang);
        float filament2 = 0.6 + 0.4 * sin(r * 260.0 - theta * 25.0 + uTime * 1.5);
        arch2 = exp(-abs(r - arch2H) * 72.0) * filament2 * (1.0 - arch2Ang * arch2Ang);
      }

      // Loop 3: Lower-right looped bridge (4:30 o'clock, theta ~ -1.22 rad)
      float arch3Ang = (theta + 1.22) / 0.26;
      float arch3 = 0.0;
      if (abs(arch3Ang) < 1.0) {
        float arch3H = 1.0 + 0.060 * sqrt(1.0 - arch3Ang * arch3Ang);
        float filament3 = 0.6 + 0.4 * sin(r * 300.0 + theta * 35.0 - uTime * 1.8);
        arch3 = exp(-abs(r - arch3H) * 68.0) * filament3 * (1.0 - arch3Ang * arch3Ang);
      }

      // Loop 4: Lower-left plume (8 o'clock, theta ~ -2.58 rad)
      float arch4Ang = (theta + 2.58) / 0.20;
      float arch4 = 0.0;
      if (abs(arch4Ang) < 1.0) {
        float arch4H = 1.0 + 0.046 * sqrt(1.0 - arch4Ang * arch4Ang);
        arch4 = exp(-abs(r - arch4H) * 78.0) * (1.0 - arch4Ang * arch4Ang);
      }

      // 3. Dynamic procedural turbulent prominences evolving over time
      float dynNoise = snoise(vec3(cos(theta) * 14.0, sin(theta) * 14.0, uTime * 0.08));
      float dynH = 1.0 + 0.038 * max(0.0, dynNoise);
      float dynArch = exp(-abs(r - dynH) * 72.0) * smoothstep(1.0, dynH, r) * (0.5 + 0.5 * sin(r * 220.0 + uTime));

      // Total prominence intensity
      float totalProm = spicule * 1.30 + arch1 * 2.2 + arch2 * 1.7 + arch3 * 1.9 + arch4 * 1.4 + dynArch * 1.2;

      // Smooth cubic hermite falloff ensuring exactly zero at 1.135 R_sun
      float edgeFade = smoothstep(1.135, 1.04, r);
      totalProm *= edgeFade;

      if (totalProm < 0.004) discard;

      // SDO 304 Å fiery plasma coloration: blazing red-orange to hot golden highlights
      vec3 crimsonBase = vec3(0.98, 0.28, 0.02);
      vec3 goldCore = vec3(1.00, 0.78, 0.20);
      vec3 promColor = mix(crimsonBase, goldCore, clamp(totalProm * 0.45, 0.0, 1.0));

      gl_FragColor = vec4(promColor * totalProm * 1.18, totalProm);
    }
  `
};

// =============================================================================
// Clean Monotonic SDO 304 Å Coronal Glow
// Additive blending, depthWrite=false, hermite radial falloff reaching exactly zero
// before the quad boundary. NO black fill, NO hard rim, NO outer outline rings.
// =============================================================================
const SunCoronaShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vOffset;

    void main() {
      // Standard camera-facing billboard anchored at Sun position
      vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      mvPosition.xy += position.xy;
      gl_Position = projectionMatrix * mvPosition;

      vOffset = position.xy;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vOffset;
    uniform float uRadius;
    uniform float uTime;

    void main() {
      #include <logdepthbuf_fragment>

      float dist = length(vOffset);

      // 1. Strictly discard inside the solid photosphere disc (dist <= uRadius)
      if (dist <= uRadius) discard;

      // 2. Maximum outer glow radius: 1.38 * uRadius
      // Quad size is 3.2 * uRadius (half-size 1.6 * uRadius), so 1.38 is strictly inside the quad.
      float maxDist = uRadius * 1.38;
      if (dist >= maxDist) discard;

      // 3. Normalized radial distance outside the limb: 0.0 at limb, 1.0 at maxDist
      float t = (dist - uRadius) / (maxDist - uRadius);

      // 4. Smooth monotonic exponential radial falloff
      // Hermite cubic factor (1 - t)^2 * (1 + 2t) guarantees EXACTLY zero brightness
      // and ZERO derivative at maxDist (zero edge clipping)!
      float hermite = (1.0 - t) * (1.0 - t) * (1.0 + 2.0 * t);
      float falloff = exp(-t * 4.4) * hermite;

      if (falloff <= 0.001) discard;

      // 5. Rich SDO AIA 304 Å chromospheric orange-red hue
      vec3 goldLimb = vec3(1.0, 0.65, 0.16);
      vec3 crimsonPlume = vec3(0.96, 0.24, 0.02);
      vec3 col = mix(crimsonPlume, goldLimb, pow(1.0 - t, 2.2));

      gl_FragColor = vec4(col * falloff * 1.15, falloff);
    }
  `
};

export function CinematicSun({
  radius = 54.0,
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

    // Auto-exposure: maintain radiant, incandescent brilliance in solar closeup
    const camDist = camera.position.distanceTo(new THREE.Vector3(...position));
    const normalizedDist = Math.max(0.0, Math.min(1.0, (camDist - radius * 1.3) / (radius * 6.0)));
    // Close up exposure ~0.94, overview ~1.15
    const targetExposure = 0.94 + normalizedDist * 0.21;
    state.gl.toneMappingExposure = targetExposure;
  });

  // Camera-facing billboard quad for prominences (2.4 * radius so max reach 1.14 is well inside)
  const prominenceBillboardGeo = useMemo(() => new THREE.PlaneGeometry(radius * 2.4, radius * 2.4), [radius]);
  // Camera-facing billboard quad for corona (3.2 * radius so maxDist 1.38 is strictly inside)
  const coronaBillboardGeo = useMemo(() => new THREE.PlaneGeometry(radius * 3.2, radius * 3.2), [radius]);

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

      {/* 2. Wispy Limb Prominences & Spicule Arches (Protruding beyond the disc into space) */}
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

      {/* 3. Clean Additive SDO 304 Å Coronal Glow (Zero black fill, zero hard rim, zero box edge) */}
      <mesh
        geometry={coronaBillboardGeo}
        renderOrder={3}
      >
        <shaderMaterial
          ref={coronaShaderRef}
          args={[SunCoronaShader]}
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
