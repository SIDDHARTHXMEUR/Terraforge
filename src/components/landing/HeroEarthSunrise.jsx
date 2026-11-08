import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Earth Surface Multi-Layer GLSL Shader with Sun-Driven Terminator and Twilight Gradients
const HeroEarthSurfaceShader = {
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

    uniform sampler2D uAlbedo;
    uniform sampler2D uNightLights;
    uniform sampler2D uCloudsMap;
    uniform vec3 uSunPosition;
    uniform float uTime;
    uniform float uSunriseProgress;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      // Base textures
      vec3 albedo = texture2D(uAlbedo, vUv).rgb;
      vec3 nightLights = texture2D(uNightLights, vUv).rgb;

      // Slowly drifting clouds UV
      vec2 cloudUv = vUv + vec2(uTime * 0.0008, 0.0);
      float cloudVal = texture2D(uCloudsMap, cloudUv).r;

      // Day / Night lighting
      float NdotL = dot(N, L);
      float dayFactor = clamp((NdotL + 0.08) / 0.35, 0.0, 1.0);
      float nightFactor = clamp((0.02 - NdotL) / 0.22, 0.0, 1.0);

      // Daytime surface with cloud shadows
      float cloudShadow = 1.0 - cloudVal * 0.35;
      vec3 daySurface = (albedo * 0.9 + vec3(0.02, 0.04, 0.07)) * dayFactor * cloudShadow;

      // Night side with warm city lights
      vec3 litNight = nightLights * nightFactor * 2.0;
      vec3 nightAmbient = albedo * 0.025 * nightFactor;

      // Atmospheric limb scattering
      float rim = 1.0 - clamp(dot(N, V), 0.0, 1.0);
      float limb = pow(rim, 4.2);

      // Layered atmosphere colors:
      // Deep blue -> subtle atmospheric cyan -> warm solar gold
      vec3 deepBlueAtm = vec3(0.043, 0.165, 0.357);
      vec3 cyanAtm = vec3(0.0, 0.65, 0.68);
      vec3 solarGoldAtm = vec3(0.96, 0.72, 0.26);

      // Sunrise angle along the terminator
      float sunriseAngle = clamp((NdotL + 0.18) / 0.45, 0.0, 1.0);
      vec3 atmColor = mix(deepBlueAtm, cyanAtm, smoothstep(0.1, 0.5, sunriseAngle));
      atmColor = mix(atmColor, solarGoldAtm, smoothstep(0.45, 0.9, sunriseAngle * (0.4 + uSunriseProgress * 0.6)));

      vec3 atmosphericScattering = atmColor * limb * (sunriseAngle * 2.2 + 0.35);

      // Cloud layer lit on surface
      vec3 cloudsColor = vec3(0.95, 0.97, 1.0) * (dayFactor * 0.85 + 0.04) * cloudVal;

      vec3 finalColor = daySurface + litNight + nightAmbient + cloudsColor + atmosphericScattering;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// Atmospheric Outer Haze Layer
const AtmosphereGlowShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    uniform vec3 uSunPosition;
    uniform float uSunriseProgress;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      float VdotN = clamp(dot(V, N), 0.0, 1.0);
      float edge = pow(1.0 - VdotN, 4.5) * smoothstep(0.0, 0.25, VdotN);

      float NdotL = dot(N, L);
      float sunriseFactor = clamp((NdotL + 0.2) / 0.45, 0.0, 1.0);

      vec3 deepBlue = vec3(0.043, 0.165, 0.357);
      vec3 cyan = vec3(0.0, 0.65, 0.68);
      vec3 gold = vec3(0.96, 0.72, 0.26);

      vec3 glowCol = mix(deepBlue, cyan, smoothstep(0.15, 0.55, sunriseFactor));
      glowCol = mix(glowCol, gold, smoothstep(0.5, 0.9, sunriseFactor * (0.35 + uSunriseProgress * 0.65)));

      float alpha = edge * (sunriseFactor * 1.5 + 0.1);
      if (alpha < 0.005) discard;

      gl_FragColor = vec4(glowCol * 1.3, alpha * 0.95);
    }
  `
};

export function HeroEarthSunrise({ scrollProgressRef }) {
  const earthRef = useRef();
  const sunMeshRef = useRef();
  const earthMatRef = useRef();
  const sunLightRef = useRef();

  // Load NASA marble textures
  const [albedoMap, nightlightsMap, cloudsMap, sunTex] = useTexture([
    '/assets/planets/earth/earth_albedo.jpg',
    '/assets/planets/earth/earth_nightlights.jpg',
    '/assets/planets/earth/earth_clouds.png',
    '/assets/planets/sun/sun.jpg'
  ]);

  useMemo(() => {
    albedoMap.wrapS = albedoMap.wrapT = THREE.RepeatWrapping;
    nightlightsMap.wrapS = nightlightsMap.wrapT = THREE.RepeatWrapping;
    cloudsMap.wrapS = cloudsMap.wrapT = THREE.RepeatWrapping;
  }, [albedoMap, nightlightsMap, cloudsMap]);

  // Sun position vector in world coordinates
  const currentSunPos = useMemo(() => new THREE.Vector3(6.5, -3.2, -18.0), []);

  const uniforms = useMemo(() => ({
    uAlbedo: { value: albedoMap },
    uNightLights: { value: nightlightsMap },
    uCloudsMap: { value: cloudsMap },
    uSunPosition: { value: currentSunPos },
    uTime: { value: 0 },
    uSunriseProgress: { value: 0 }
  }), [albedoMap, nightlightsMap, cloudsMap, currentSunPos]);

  const atmUniforms = useMemo(() => ({
    uSunPosition: { value: currentSunPos },
    uSunriseProgress: { value: 0 }
  }), [currentSunPos]);

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;

    // Slow gentle axial drift of Earth
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.002;
    }

    const scrollP = scrollProgressRef?.current || 0;

    // REDESIGNED FIRST SCROLL SUN EMERGENCE:
    // When scrollP is 0: Sun is tucked below horizon at y = -3.2
    // As scroll moves 0 -> 1: Sun rises calmly and progressively to y = 0.8
    // No sudden rushing, no brightness explosions, controlled calm easing
    const riseT = THREE.MathUtils.smootherstep(THREE.MathUtils.clamp(scrollP, 0, 1.2), 0, 1.2);
    const sunY = THREE.MathUtils.lerp(-3.2, 0.8, riseT);
    const sunX = THREE.MathUtils.lerp(6.5, 5.2, riseT);
    currentSunPos.set(sunX, sunY, -18.0);

    uniforms.uSunriseProgress.value = riseT;
    atmUniforms.uSunriseProgress.value = riseT;

    if (sunMeshRef.current) {
      sunMeshRef.current.position.copy(currentSunPos);
    }
    if (sunLightRef.current) {
      sunLightRef.current.position.copy(currentSunPos);
      sunLightRef.current.intensity = 1.0 + riseT * 1.5;
    }
  });

  return (
    <group>
      {/* 1. Earth Body in low orbit: limb sweeping diagonally across lower frame, tilted ~12° */}
      <group position={[0, -10.4, 0]} rotation={[0.08, 0.45, -0.21]}>
        {/* Main Earth Surface */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[10.0, 96, 96]} />
          <shaderMaterial
            ref={earthMatRef}
            vertexShader={HeroEarthSurfaceShader.vertexShader}
            fragmentShader={HeroEarthSurfaceShader.fragmentShader}
            uniforms={uniforms}
          />
        </mesh>

        {/* Atmosphere Limb Haze Layer */}
        <mesh scale={[1.018, 1.018, 1.018]}>
          <sphereGeometry args={[10.0, 96, 96]} />
          <shaderMaterial
            vertexShader={AtmosphereGlowShader.vertexShader}
            fragmentShader={AtmosphereGlowShader.fragmentShader}
            uniforms={atmUniforms}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 2. Real 3D Sun Sphere positioned in depth behind Earth (z = -18), physically un-occluded as perspective shifts */}
      <group ref={sunMeshRef} position={[6.5, -3.2, -18.0]}>
        <mesh>
          <sphereGeometry args={[2.8, 48, 48]} />
          <meshBasicMaterial map={sunTex} />
        </mesh>

        {/* Soft, restrained solar corona glow (calm radial falloff, NO harsh rays/sprites) */}
        <mesh scale={[1.4, 1.4, 1.4]}>
          <sphereGeometry args={[2.8, 32, 32]} />
          <meshBasicMaterial
            color="#F5B942"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Directional Sun Light illuminating the scene */}
      <pointLight
        ref={sunLightRef}
        position={[6.5, -3.2, -18.0]}
        intensity={1.5}
        color="#FFF6E0"
        distance={100}
        decay={1.2}
      />
    </group>
  );
}
