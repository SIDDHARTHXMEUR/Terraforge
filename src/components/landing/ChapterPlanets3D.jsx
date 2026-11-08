import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GhostWord3D } from './GhostWord3D';

// Shared Physically-Based Sun-Driven Shader for Landing Chapter Planets
const ChapterPlanetShader = {
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
      gl_Position = projectionMatrix * viewMatrix * worldPos;

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
    uniform vec3 uAtmosphereColor;
    uniform float uAtmosphereStrength;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      vec3 texColor = texture2D(uTexture, vUv).rgb;

      // Soft physically grounded terminator
      float NdotL = dot(N, L);
      float diffuse = smoothstep(-0.15, 0.35, NdotL);

      // Night ambient at 0.03 so dark side geography is discernible
      vec3 ambient = texColor * 0.03;

      // Subtle atmospheric limb scatter on lit side
      float rim = 1.0 - clamp(dot(N, V), 0.0, 1.0);
      float limbScatter = pow(rim, 4.0) * smoothstep(0.0, 0.3, NdotL) * uAtmosphereStrength;
      vec3 atmosphere = uAtmosphereColor * limbScatter;

      vec3 finalColor = texColor * diffuse + ambient + atmosphere;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function ChapterPlanets3D({ scrollProgressRef }) {
  const { size } = useThree();
  const isMobile = size.width <= 768;
  const groupRef = useRef();

  // Load Planet Textures
  const [
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

  // Shared Sun Position (placed forward-left: lit hemisphere faces camera/sun)
  const sharedSunPos = useMemo(() => new THREE.Vector3(-14.0, 4.0, 10.0), []);

  // Refs for axial rotation
  const mercuryRef = useRef();
  const venusRef = useRef();
  const earthRef = useRef();
  const marsRef = useRef();
  const jupiterRef = useRef();
  const saturnRef = useRef();
  const uranusRef = useRef();
  const neptuneRef = useRef();

  // Uniforms for each planet
  const mercuryUniforms = useMemo(() => ({
    uTexture: { value: mercuryTex },
    uSunPosition: { value: sharedSunPos },
    uAtmosphereColor: { value: new THREE.Vector3(0.5, 0.5, 0.55) },
    uAtmosphereStrength: { value: 0.15 }
  }), [mercuryTex, sharedSunPos]);

  const venusUniforms = useMemo(() => ({
    uTexture: { value: venusTex },
    uSunPosition: { value: sharedSunPos },
    uAtmosphereColor: { value: new THREE.Vector3(0.9, 0.75, 0.45) },
    uAtmosphereStrength: { value: 0.75 }
  }), [venusTex, sharedSunPos]);

  const earthUniforms = useMemo(() => ({
    uTexture: { value: earthTex },
    uSunPosition: { value: sharedSunPos },
    uAtmosphereColor: { value: new THREE.Vector3(0.2, 0.6, 1.0) },
    uAtmosphereStrength: { value: 0.85 }
  }), [earthTex, sharedSunPos]);

  const marsUniforms = useMemo(() => ({
    uTexture: { value: marsTex },
    uSunPosition: { value: sharedSunPos },
    uAtmosphereColor: { value: new THREE.Vector3(0.9, 0.45, 0.25) },
    uAtmosphereStrength: { value: 0.35 }
  }), [marsTex, sharedSunPos]);

  const jupiterUniforms = useMemo(() => ({
    uTexture: { value: jupiterTex },
    uSunPosition: { value: sharedSunPos },
    uAtmosphereColor: { value: new THREE.Vector3(0.85, 0.65, 0.45) },
    uAtmosphereStrength: { value: 0.4 }
  }), [jupiterTex, sharedSunPos]);

  const saturnUniforms = useMemo(() => ({
    uTexture: { value: saturnTex },
    uSunPosition: { value: sharedSunPos },
    uAtmosphereColor: { value: new THREE.Vector3(0.9, 0.8, 0.5) },
    uAtmosphereStrength: { value: 0.4 }
  }), [saturnTex, sharedSunPos]);

  const uranusUniforms = useMemo(() => ({
    uTexture: { value: uranusTex },
    uSunPosition: { value: sharedSunPos },
    uAtmosphereColor: { value: new THREE.Vector3(0.4, 0.85, 0.8) },
    uAtmosphereStrength: { value: 0.6 }
  }), [uranusTex, sharedSunPos]);

  const neptuneUniforms = useMemo(() => ({
    uTexture: { value: neptuneTex },
    uSunPosition: { value: sharedSunPos },
    uAtmosphereColor: { value: new THREE.Vector3(0.25, 0.5, 0.95) },
    uAtmosphereStrength: { value: 0.7 }
  }), [neptuneTex, sharedSunPos]);

  // Track scroll velocity for rotation response
  const lastScrollP = useRef(0);

  useFrame((state, delta) => {
    const scrollP = scrollProgressRef?.current || 0;
    const velocity = Math.abs(scrollP - lastScrollP.current) / Math.max(delta, 0.001);
    lastScrollP.current = scrollP;

    const rotSpeed = delta * (0.08 + Math.min(velocity * 0.02, 0.35));

    if (mercuryRef.current) mercuryRef.current.rotation.y += rotSpeed * 0.5;
    if (venusRef.current) venusRef.current.rotation.y -= rotSpeed * 0.3; // Retrograde
    if (earthRef.current) earthRef.current.rotation.y += rotSpeed * 0.65;
    if (marsRef.current) marsRef.current.rotation.y += rotSpeed * 0.55;
    if (jupiterRef.current) jupiterRef.current.rotation.y += rotSpeed * 0.8;
    if (saturnRef.current) saturnRef.current.rotation.y += rotSpeed * 0.7;
    if (uranusRef.current) uranusRef.current.rotation.y += rotSpeed * 0.6;
    if (neptuneRef.current) neptuneRef.current.rotation.y += rotSpeed * 0.65;
  });

  return (
    <group ref={groupRef}>
      {/* 1. MERCURY (scrollP ~ 2.0) */}
      <ChapterBody
        chapterIndex={2}
        scrollProgressRef={scrollProgressRef}
        planetName="MERCURY"
        planetRadius={1.7}
        position={[2.5, 0.0, 0]}
        isMobile={isMobile}
      >
        <mesh ref={mercuryRef}>
          <sphereGeometry args={[1.7, 64, 64]} />
          <shaderMaterial
            vertexShader={ChapterPlanetShader.vertexShader}
            fragmentShader={ChapterPlanetShader.fragmentShader}
            uniforms={mercuryUniforms}
          />
        </mesh>
      </ChapterBody>

      {/* 2. VENUS (scrollP ~ 3.0) */}
      <ChapterBody
        chapterIndex={3}
        scrollProgressRef={scrollProgressRef}
        planetName="VENUS"
        planetRadius={1.9}
        position={[2.5, 0.0, 0]}
        isMobile={isMobile}
      >
        <mesh ref={venusRef} rotation={[0, 0, (177.36 * Math.PI) / 180]}>
          <sphereGeometry args={[1.9, 64, 64]} />
          <shaderMaterial
            vertexShader={ChapterPlanetShader.vertexShader}
            fragmentShader={ChapterPlanetShader.fragmentShader}
            uniforms={venusUniforms}
          />
        </mesh>
      </ChapterBody>

      {/* 3. EARTH (scrollP ~ 4.0) */}
      <ChapterBody
        chapterIndex={4}
        scrollProgressRef={scrollProgressRef}
        planetName="EARTH"
        planetRadius={2.0}
        position={[2.5, 0.0, 0]}
        isMobile={isMobile}
      >
        <mesh ref={earthRef} rotation={[0, 0, (23.44 * Math.PI) / 180]}>
          <sphereGeometry args={[2.0, 64, 64]} />
          <shaderMaterial
            vertexShader={ChapterPlanetShader.vertexShader}
            fragmentShader={ChapterPlanetShader.fragmentShader}
            uniforms={earthUniforms}
          />
        </mesh>
      </ChapterBody>

      {/* 4. MARS (scrollP ~ 5.0) */}
      <ChapterBody
        chapterIndex={5}
        scrollProgressRef={scrollProgressRef}
        planetName="MARS"
        planetRadius={1.8}
        position={[2.5, 0.0, 0]}
        isMobile={isMobile}
      >
        <mesh ref={marsRef} rotation={[0, 0, (25.19 * Math.PI) / 180]}>
          <sphereGeometry args={[1.8, 64, 64]} />
          <shaderMaterial
            vertexShader={ChapterPlanetShader.vertexShader}
            fragmentShader={ChapterPlanetShader.fragmentShader}
            uniforms={marsUniforms}
          />
        </mesh>
      </ChapterBody>

      {/* 5. JUPITER (scrollP ~ 6.0) */}
      <ChapterBody
        chapterIndex={6}
        scrollProgressRef={scrollProgressRef}
        planetName="JUPITER"
        planetRadius={2.5}
        position={[2.7, 0.1, 0]}
        isMobile={isMobile}
      >
        <mesh ref={jupiterRef} rotation={[0, 0, (3.13 * Math.PI) / 180]}>
          <sphereGeometry args={[2.5, 64, 64]} />
          <shaderMaterial
            vertexShader={ChapterPlanetShader.vertexShader}
            fragmentShader={ChapterPlanetShader.fragmentShader}
            uniforms={jupiterUniforms}
          />
        </mesh>
      </ChapterBody>

      {/* 6. SATURN (scrollP ~ 7.0) */}
      <ChapterBody
        chapterIndex={7}
        scrollProgressRef={scrollProgressRef}
        planetName="SATURN"
        planetRadius={2.0}
        position={[2.6, 0.0, 0]}
        isMobile={isMobile}
      >
        <group rotation={[0.55, -0.4, (26.73 * Math.PI) / 180]}>
          <mesh ref={saturnRef}>
            <sphereGeometry args={[2.0, 64, 64]} />
            <shaderMaterial
              vertexShader={ChapterPlanetShader.vertexShader}
              fragmentShader={ChapterPlanetShader.fragmentShader}
              uniforms={saturnUniforms}
            />
          </mesh>
          {/* Saturn Rings */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.6, 5.0, 96]} />
            <meshStandardMaterial
              map={saturnRingTex}
              transparent
              opacity={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </ChapterBody>

      {/* 7. URANUS (scrollP ~ 8.0) */}
      <ChapterBody
        chapterIndex={8}
        scrollProgressRef={scrollProgressRef}
        planetName="URANUS"
        planetRadius={1.9}
        position={[2.5, 0.0, 0]}
        isMobile={isMobile}
      >
        <mesh ref={uranusRef} rotation={[0, 0, (97.77 * Math.PI) / 180]}>
          <sphereGeometry args={[1.9, 64, 64]} />
          <shaderMaterial
            vertexShader={ChapterPlanetShader.vertexShader}
            fragmentShader={ChapterPlanetShader.fragmentShader}
            uniforms={uranusUniforms}
          />
        </mesh>
      </ChapterBody>

      {/* 8. NEPTUNE (scrollP ~ 9.0) */}
      <ChapterBody
        chapterIndex={9}
        scrollProgressRef={scrollProgressRef}
        planetName="NEPTUNE"
        planetRadius={1.9}
        position={[2.5, 0.0, 0]}
        isMobile={isMobile}
      >
        <mesh ref={neptuneRef} rotation={[0, 0, (28.32 * Math.PI) / 180]}>
          <sphereGeometry args={[1.9, 64, 64]} />
          <shaderMaterial
            vertexShader={ChapterPlanetShader.vertexShader}
            fragmentShader={ChapterPlanetShader.fragmentShader}
            uniforms={neptuneUniforms}
          />
        </mesh>
      </ChapterBody>
    </group>
  );
}

/**
 * ChapterBody: Renders active planet and depth-tested ghost word
 */
function ChapterBody({
  chapterIndex,
  scrollProgressRef,
  planetName,
  planetRadius = 2.0,
  position = [2.5, 0, 0],
  isMobile = false,
  children
}) {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    const scrollP = scrollProgressRef?.current || 0;
    const deltaP = scrollP - chapterIndex;

    // Active window: within 0.5 of chapter index
    if (Math.abs(deltaP) > 0.5) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Smooth diagonal entrance/exit
    const driftX = deltaP * 1.5;
    const driftY = -deltaP * 1.0;

    const targetPos = isMobile ? [0, -1.4, 1.0] : position;

    groupRef.current.position.set(
      targetPos[0] - driftX,
      targetPos[1] - driftY,
      targetPos[2]
    );
  });

  const ghostWordScale = isMobile
    ? [planetRadius * 2.2, planetRadius * 4.2, 1]
    : [planetRadius * 4.6, planetRadius * 1.25, 1];

  const ghostWordPos = isMobile
    ? [0, 1.1, -1.2]
    : [-planetRadius * 0.45, planetRadius * 0.1, -1.6];

  return (
    <group ref={groupRef} visible={false}>
      {/* 3D Depth-Tested Ghost Word */}
      <GhostWord3D
        text={planetName}
        position={ghostWordPos}
        scale={ghostWordScale}
        opacity={0.14}
        isVertical={isMobile}
      />

      {/* 3D Planet Mesh with normal depth buffer write */}
      {children}
    </group>
  );
}
