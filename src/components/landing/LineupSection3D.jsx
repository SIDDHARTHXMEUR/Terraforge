import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { LANDING_CHAPTERS } from './ChapterOverlay';

// Shared Physically-Based Directional Sunlight Shader for Lineup Planets
const LineupPlanetShader = {
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

    uniform sampler2D uTexture;
    uniform vec3 uSunPosition;
    uniform float uAmbient;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 texColor = texture2D(uTexture, vUv).rgb;

      // Soft physically grounded terminator lit from the Sun at left
      float NdotL = dot(N, L);
      float diffuse = smoothstep(-0.15, 0.35, NdotL);

      vec3 ambient = texColor * uAmbient;
      vec3 finalColor = texColor * diffuse + ambient;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// SDO Solar Limb Shader for cropped Sun in Lineup
const LineupSunShader = {
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

    uniform sampler2D uTexture;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      vec3 texColor = texture2D(uTexture, vUv).rgb;
      float mu = clamp(dot(N, V), 0.0, 1.0);

      // Monotonic limb darkening matching SDO 304 Å photograph
      vec3 vermilion = vec3(0.92, 0.28, 0.04);
      vec3 incandescent = mix(texColor * vermilion, texColor * 1.35, pow(mu, 0.45));

      gl_FragColor = vec4(incandescent, 1.0);
    }
  `
};

function RadiusLabel({ text, position }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'normal 26px "League Gothic", "Inter", sans-serif';
    ctx.fillStyle = '#FFF8E7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    return tex;
  }, [text]);

  return (
    <sprite position={position} scale={[1.8, 0.45, 1]}>
      <spriteMaterial map={texture} transparent opacity={0.75} depthWrite={false} />
    </sprite>
  );
}

/**
 * Lineup 3D Component:
 * - True relative radii (Jupiter 11x Earth, Earth 2.6x Mercury, Sol dwarfs all)
 * - 1px horizontal datum line linking centers with ticks and vertical leader lines
 * - All bodies lit by shared Sun uniform at left
 * - Simulator-material textured Sun limb cropped at left (never flat orange!)
 * - Camera dollies horizontally with scroll
 */
export function LineupSection3D({ scrollProgressRef }) {
  const groupRef = useRef();

  // Load Planet Textures
  const [
    sunTex,
    mercuryTex,
    venusTex,
    earthTex,
    marsTex,
    jupiterTex,
    saturnTex,
    saturnRingTex,
    uranusTex,
    neptuneTex
  ] = useTexture([
    '/assets/planets/sun/sun_sdo_banana.jpg',
    '/assets/planets/mercury/mercury.jpg',
    '/assets/planets/venus/venus.jpg',
    '/assets/planets/earth/earth_albedo.jpg',
    '/assets/planets/mars/mars.jpg',
    '/assets/planets/jupiter/jupiter.jpg',
    '/assets/planets/saturn/saturn.jpg',
    '/assets/planets/saturn/saturn_ring.png',
    '/assets/planets/uranus/uranus.jpg',
    '/assets/planets/neptune/neptune.jpg'
  ]);

  const sharedSunPos = useMemo(() => new THREE.Vector3(-10.5, 0, 0), []);

  // True relative radii (Earth = 0.220)
  // Jupiter = 2.414 (11x Earth), Earth = 2.6x Mercury (0.084)
  const bodies = useMemo(() => [
    { name: 'Mercury', radiusKm: '2,440 KM', r: 0.084, x: 1.0, tex: mercuryTex },
    { name: 'Venus', radiusKm: '6,052 KM', r: 0.209, x: 5.8, tex: venusTex },
    { name: 'Earth', radiusKm: '6,371 KM', r: 0.220, x: 10.6, tex: earthTex, tilt: 0.41 },
    { name: 'Mars', radiusKm: '3,390 KM', r: 0.117, x: 15.4, tex: marsTex, tilt: 0.44 },
    { name: 'Jupiter', radiusKm: '69,911 KM', r: 2.414, x: 20.2, tex: jupiterTex, tilt: 0.05 },
    { name: 'Saturn', radiusKm: '58,232 KM', r: 2.011, x: 26.2, tex: saturnTex, hasRings: true, tilt: 0.47 },
    { name: 'Uranus', radiusKm: '25,362 KM', r: 0.876, x: 31.8, tex: uranusTex, tilt: 1.71 },
    { name: 'Neptune', radiusKm: '24,622 KM', r: 0.850, x: 36.6, tex: neptuneTex, tilt: 0.49 }
  ], [mercuryTex, venusTex, earthTex, marsTex, jupiterTex, saturnTex, uranusTex, neptuneTex]);

  // Datum line linking all planet centers
  const datumPoints = useMemo(() => [
    new THREE.Vector3(-3.0, 0, 0),
    new THREE.Vector3(40.0, 0, 0)
  ], []);

  const datumGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(datumPoints), [datumPoints]);

  const lineupChapter = useMemo(() => LANDING_CHAPTERS.find((ch) => ch.type === 'lineup'), []);
  const lineupKey = lineupChapter ? lineupChapter.progressKey : 7.0;

  useFrame(() => {
    if (!groupRef.current) return;
    const scrollP = scrollProgressRef?.current || 0;
    const deltaP = scrollP - lineupKey;
    const isVisible = Math.abs(deltaP) < 0.65;
    groupRef.current.visible = isVisible;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* 1. Simulator-Material Textured Sun (Cropped at left, right limb at X = -2.5) */}
      <mesh position={[-10.5, 0, 0]}>
        <sphereGeometry args={[8.0, 64, 64]} />
        <shaderMaterial
          vertexShader={LineupSunShader.vertexShader}
          fragmentShader={LineupSunShader.fragmentShader}
          uniforms={{ uTexture: { value: sunTex } }}
        />
      </mesh>

      {/* 2. 1px Horizontal Datum Line */}
      <line geometry={datumGeometry}>
        <lineBasicMaterial color="#FFF8E7" transparent opacity={0.22} />
      </line>

      {/* 3. All 8 Planets at True Relative Radii, Lit by Sun Uniform */}
      {bodies.map((b) => {
        const leaderPts = [
          new THREE.Vector3(0, -b.r - 0.15, 0),
          new THREE.Vector3(0, -3.0, 0)
        ];
        const leaderGeom = new THREE.BufferGeometry().setFromPoints(leaderPts);

        return (
          <group key={b.name} position={[b.x, 0, 0]}>
            {/* Planet Mesh */}
            <mesh rotation={[0, 0, b.tilt || 0]}>
              <sphereGeometry args={[b.r, 48, 48]} />
              <shaderMaterial
                vertexShader={LineupPlanetShader.vertexShader}
                fragmentShader={LineupPlanetShader.fragmentShader}
                uniforms={{
                  uTexture: { value: b.tex },
                  uSunPosition: { value: sharedSunPos },
                  uAmbient: { value: 0.05 }
                }}
              />
            </mesh>

            {/* Saturn Rings */}
            {b.hasRings && (
              <mesh rotation={[-Math.PI / 2.3, 0.25, 0]}>
                <ringGeometry args={[b.r * 1.35, b.r * 2.35, 64]} />
                <meshStandardMaterial
                  map={saturnRingTex}
                  transparent
                  opacity={0.92}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Thin Leader Line down to radius readout */}
            <line geometry={leaderGeom}>
              <lineBasicMaterial color="#FFF8E7" transparent opacity={0.35} />
            </line>

            {/* Small Datum Tick at center */}
            <line>
              <bufferGeometry
                attach="geometry"
                onUpdate={(self) => {
                  const pts = [new THREE.Vector3(0, -0.15, 0), new THREE.Vector3(0, 0.15, 0)];
                  self.setFromPoints(pts);
                }}
              />
              <lineBasicMaterial color="#FFF8E7" transparent opacity={0.5} />
            </line>

            {/* Tiny 3D Radius Label in KM from data */}
            <RadiusLabel text={b.radiusKm} position={[0, -3.35, 0]} />
          </group>
        );
      })}
    </group>
  );
}
