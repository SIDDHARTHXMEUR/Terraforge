import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// 1. Photorealistic Milky Way & Galactic Plane Celestial Background Shader
// Generates the galactic plane, Sagittarius bulge, dark dust rifts (Great Rift),
// and subtle cosmic emission nebulae with physical void blacks.
// -----------------------------------------------------------------------------
const MilkyWayCosmicShader = {
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPosition;

    // Simplex 3D noise for organic interstellar dust lanes and gas clouds
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
      vec3 dir = normalize(vWorldPosition);

      // Tilted galactic plane (~62.8° inclination relative to solar system equatorial plane)
      vec3 galacticNormal = normalize(vec3(0.46, 0.88, 0.12));
      float b = dot(dir, galacticNormal); // sin(galactic latitude)
      float absB = abs(b);

      // Galactic longitude reference toward Sagittarius Galactic Center
      vec3 galacticCenterDir = normalize(vec3(-0.84, -0.22, 0.49));
      float centerAlignment = dot(dir, galacticCenterDir);

      // 1. Milky Way Galactic Disk Luminance (concentrated along b = 0)
      float diskWidth = 0.22;
      float diskGlow = exp(- (absB * absB) / (2.0 * diskWidth * diskWidth));

      // 2. Galactic Bulge (Sagittarius core)
      float bulgeAngle = max(0.0, centerAlignment);
      float bulge = pow(bulgeAngle, 8.0) * exp(- (absB * absB) / 0.02) * 1.8;

      // 3. Dark Interstellar Dust Lanes (The Great Rift absorption)
      vec3 dustPos = dir * 4.5;
      float n1 = snoise(dustPos);
      float n2 = snoise(dustPos * 2.2 + vec3(1.2, 3.4, 5.6)) * 0.5;
      float dustRift = smoothstep(-0.25, 0.45, (n1 + n2));
      float dustAttenuation = mix(0.18, 1.0, dustRift);

      // 4. Subtle Cosmic Emission Nebulae (Extremely faint natural H-alpha & O-III)
      float nebNoise = snoise(dir * 2.8 + vec3(7.1, 1.8, 4.3));
      float nebMask = smoothstep(0.45, 0.85, nebNoise) * exp(-absB * 3.5);
      vec3 hAlphaPink = vec3(0.12, 0.02, 0.05);
      vec3 oiiiTeal = vec3(0.01, 0.06, 0.08);
      vec3 nebColor = mix(hAlphaPink, oiiiTeal, smoothstep(0.5, 0.8, nebNoise)) * nebMask * 0.45;

      // 5. Authentic Galactic Color Palette:
      // Golden/cream core starlight transitioning to pale blue-white disk diffuse light
      vec3 coreColor = vec3(0.98, 0.88, 0.72);
      vec3 diskColor = vec3(0.72, 0.82, 0.98);
      vec3 milkyWayColor = mix(diskColor, coreColor, clamp(bulge * 0.7, 0.0, 1.0));

      // Composite galactic light with dust extinction
      // Composite galactic light with dust extinction
      vec3 galacticLight = milkyWayColor * (diskGlow * 0.42 + bulge * 0.75) * dustAttenuation;

      // Deep Space Cosmic Void Black (deep navy-charcoal, zero artificial gray wash)
      vec3 deepVoid = vec3(0.001, 0.002, 0.004);

      vec3 finalBackground = deepVoid + galacticLight + nebColor;
      gl_FragColor = vec4(finalBackground, 1.0);
    }
  `
};

// -----------------------------------------------------------------------------
// 2. Multi-Spectral Sub-Pixel Astronomical Point Starfield Shader
// Renders anti-aliased Gaussian point stars with authentic Harvard spectral colors
// (O, B, A, F, G, K, M) and physical apparent magnitude distribution.
// -----------------------------------------------------------------------------
const StarfieldPointsShader = {
  vertexShader: `
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aBrightness;

    varying vec3 vColor;
    varying float vBrightness;

    void main() {
      vColor = aColor;
      vBrightness = aBrightness;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Calibrated sub-pixel astronomical point size
      gl_PointSize = max(1.2, aSize * (5200.0 / -mvPosition.z));
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vBrightness;

    void main() {
      // High-precision Gaussian point disc with soft anti-aliased edge
      vec2 coord = gl_PointCoord - vec2(0.5);
      float distSq = dot(coord, coord);
      if (distSq > 0.25) discard;

      // Optical airy disc core + subtle diffraction fringe
      float core = exp(-distSq * 28.0);
      float fringe = exp(-distSq * 8.0) * 0.25;
      float intensity = (core + fringe) * vBrightness;

      gl_FragColor = vec4(vColor * intensity, intensity);
    }
  `
};

export function DeepSpaceSkybox() {
  const skyboxSphereRef = useRef();

  // Keep celestial background centered on camera at optical infinity
  useFrame(({ camera }) => {
    if (skyboxSphereRef.current) {
      skyboxSphereRef.current.position.copy(camera.position);
    }
  });

  // ---------------------------------------------------------------------------
  // Generate 12,000 Astronomical Stars with Gaia / Hipparcos distribution
  // ---------------------------------------------------------------------------
  const { starGeometry } = useMemo(() => {
    const starCount = 12000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const brightness = new Float32Array(starCount);

    // Harvard Spectral Classification Colors (B-V Color Temperature Physics)
    const spectralTypes = [
      { color: new THREE.Color('#9db4ff'), weight: 0.08, size: 1.6, bright: 1.0 },  // O/B: Blue-white
      { color: new THREE.Color('#bbccff'), weight: 0.16, size: 1.4, bright: 0.95 }, // A: Pure white
      { color: new THREE.Color('#f8f9ff'), weight: 0.24, size: 1.2, bright: 0.88 }, // F: Warm white
      { color: new THREE.Color('#fff4e8'), weight: 0.26, size: 1.1, bright: 0.82 }, // G: Solar yellow
      { color: new THREE.Color('#ffd2a1'), weight: 0.16, size: 1.1, bright: 0.76 }, // K: Pale orange
      { color: new THREE.Color('#ffb56c'), weight: 0.10, size: 1.0, bright: 0.68 }  // M: Red dwarf
    ];

    // Galactic normal vector to concentrate more stars along the Milky Way disk
    const galacticNormal = new THREE.Vector3(0.46, 0.88, 0.12).normalize();

    for (let i = 0; i < starCount; i++) {
      // 1. Natural celestial sphere distribution with subtle galactic plane bias
      let theta = Math.random() * Math.PI * 2;
      let phi = Math.acos(2 * Math.random() - 1);
      let dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).normalize();

      // Moderate concentration towards galactic plane (dot product with galactic normal)
      if (Math.random() < 0.35) {
        const perp = new THREE.Vector3().crossVectors(dir, galacticNormal).normalize();
        dir.lerp(perp, 0.45).normalize();
      }

      // Parallax distance layering from 2,800 to 11,000 units
      const distance = 2800 + Math.pow(Math.random(), 1.8) * 8200;
      positions[i * 3 + 0] = dir.x * distance;
      positions[i * 3 + 1] = dir.y * distance;
      positions[i * 3 + 2] = dir.z * distance;

      // 2. Astronomical Stellar Magnitude Distribution:
      // Exponential curve: 95% are faint background stars, ~5% are prominent anchor stars
      const isProminent = Math.random() < 0.04;
      const rSpec = Math.random();
      let spec = spectralTypes[0];
      let acc = 0;
      for (const s of spectralTypes) {
        acc += s.weight;
        if (rSpec <= acc) {
          spec = s;
          break;
        }
      }

      colors[i * 3 + 0] = spec.color.r;
      colors[i * 3 + 1] = spec.color.g;
      colors[i * 3 + 2] = spec.color.b;

      if (isProminent) {
        sizes[i] = spec.size * (1.8 + Math.random() * 1.2);
        brightness[i] = 1.2 + Math.random() * 0.6;
      } else {
        sizes[i] = spec.size * (0.75 + Math.random() * 0.45);
        brightness[i] = spec.bright * (0.35 + Math.random() * 0.45);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));

    return { starGeometry: geo };
  }, []);

  return (
    <group>
      {/* 1. Deep Space Cosmic Skybox with Milky Way & Dust Rifts */}
      <mesh ref={skyboxSphereRef}>
        <sphereGeometry args={[14000, 64, 64]} />
        <shaderMaterial
          args={[MilkyWayCosmicShader]}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Sub-Pixel Multi-Spectral Physical Star Points */}
      <points geometry={starGeometry}>
        <shaderMaterial
          args={[StarfieldPointsShader]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
