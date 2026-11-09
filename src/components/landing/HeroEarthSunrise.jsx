import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Hero Earth Shader:
// - Curved limb sweeping diagonally across lower frame (~12° tilt)
// - City lights on the night side (NASA Black Marble)
// - Slow-moving dynamic weather clouds
// - Multi-layered atmospheric scattering along limb:
//   deep blue (#0B2A5B) -> teal -> thin gold-orange sunrise band where Sun rises at right edge (~70% down)
// - Soft radial solar glare (no flat beams, no sprites, no starbursts)
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
    uniform vec2 uResolution;

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      // Base textures
      vec3 albedo = texture2D(uAlbedo, vUv).rgb;
      vec3 nightLights = texture2D(uNightLights, vUv).rgb;

      // Slowly drifting clouds UV
      vec2 cloudUv = vUv + vec2(uTime * 0.0012, 0.0);
      float cloudVal = texture2D(uCloudsMap, cloudUv).r;

      // Day / Night lighting
      float NdotL = dot(N, L);
      float dayFactor = clamp((NdotL + 0.05) / 0.35, 0.0, 1.0);
      float nightFactor = clamp((0.02 - NdotL) / 0.22, 0.0, 1.0);

      // Combine daytime surface with cloud shadowing
      float cloudShadow = 1.0 - cloudVal * 0.4;
      vec3 daySurface = (albedo * 0.9 + vec3(0.02, 0.05, 0.08)) * dayFactor * cloudShadow;

      // Night side with city lights
      vec3 litNight = nightLights * nightFactor * 2.2;
      // Ambient dark hemisphere so geography remains subtly readable
      vec3 nightAmbient = albedo * 0.025 * nightFactor;

      // Atmospheric limb scattering
      float rim = 1.0 - clamp(dot(N, V), 0.0, 1.0);
      float limb = pow(rim, 4.5);

      // Sun alignment along the horizon (sun rises at ~70% screen right)
      float sunHorizonAlign = max(0.0, dot(normalize(vWorldPosition - cameraPosition), L));

      // Layered atmosphere colors:
      // Deep blue: #0B2A5B -> vec3(0.043, 0.165, 0.357)
      // Teal: #00A896 -> vec3(0.0, 0.659, 0.588)
      // Gold-orange: #FFA834 -> vec3(1.0, 0.658, 0.204)
      vec3 deepBlueAtm = vec3(0.043, 0.165, 0.357);
      vec3 tealAtm = vec3(0.0, 0.66, 0.59);
      vec3 goldOrangeAtm = vec3(1.0, 0.66, 0.20);

      // Gradation from twilight into sunrise band
      float sunriseAngle = clamp((NdotL + 0.15) / 0.35, 0.0, 1.0);
      vec3 atmColor = mix(deepBlueAtm, tealAtm, smoothstep(0.1, 0.5, sunriseAngle));
      atmColor = mix(atmColor, goldOrangeAtm, smoothstep(0.45, 0.85, sunriseAngle));

      vec3 atmosphericScattering = atmColor * limb * (sunriseAngle * 2.5 + 0.4);

      // Cloud layer lit on surface
      vec3 cloudsColor = vec3(0.95, 0.97, 1.0) * (dayFactor * 0.85 + 0.04) * cloudVal;

      vec3 finalColor = daySurface + litNight + nightAmbient + cloudsColor + atmosphericScattering;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// Atmospheric Outer Haze Layer (Extends just above Earth's limb, transitioning #0B2A5B -> Teal -> Gold)
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

    void main() {
      #include <logdepthbuf_fragment>

      vec3 N = normalize(vWorldNormal);
      vec3 L = normalize(uSunPosition - vWorldPosition);
      vec3 V = normalize(cameraPosition - vWorldPosition);

      float VdotN = clamp(dot(V, N), 0.0, 1.0);
      // Concentrated at the limb silhouette
      float edge = pow(1.0 - VdotN, 5.0) * smoothstep(0.0, 0.25, VdotN);

      float NdotL = dot(N, L);
      float sunriseFactor = clamp((NdotL + 0.18) / 0.4, 0.0, 1.0);

      // Layered atmosphere colors
      vec3 deepBlue = vec3(0.043, 0.165, 0.357);
      vec3 teal = vec3(0.0, 0.66, 0.59);
      vec3 goldOrange = vec3(1.0, 0.66, 0.20);

      vec3 glowCol = mix(deepBlue, teal, smoothstep(0.15, 0.55, sunriseFactor));
      glowCol = mix(glowCol, goldOrange, smoothstep(0.5, 0.9, sunriseFactor));

      float alpha = edge * (sunriseFactor * 1.8 + 0.15);
      if (alpha < 0.005) discard;

      gl_FragColor = vec4(glowCol * 1.4, alpha * 0.95);
    }
  `
};

// Soft radial glare at sunrise point (pure radial mathematical Gaussian falloff, NO sprites, NO flat beams)
const SolarSunriseGlareShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec2 uSunriseScreenPos; // in UV [0..1]
    uniform float uIntensity;

    void main() {
      vec2 d = (vUv - uSunriseScreenPos) * vec2(16.0 / 9.0, 1.0);
      float dist = length(d);

      // Exponential soft radial falloff with edge vignette to ensure zero slab cutoff
      float softGlow = exp(-dist * 5.5) * 0.85;
      float wideGlow = exp(-dist * 2.2) * 0.35;
      float totalGlow = (softGlow + wideGlow) * uIntensity;

      // Soft vignette near viewport boundaries ensures 0.0 at borders
      float edgeFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) *
                       smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
      totalGlow *= edgeFade;

      if (totalGlow < 0.002) discard;

      vec3 glareColor = mix(vec3(1.0, 0.72, 0.35), vec3(1.0, 0.92, 0.78), exp(-dist * 12.0));
      gl_FragColor = vec4(glareColor * totalGlow, totalGlow * 0.75);
    }
  `
};

export function HeroEarthSunrise({ isVisible = true }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const earthMatRef = useRef();

  // Load NASA Marble textures
  const [albedoMap, nightlightsMap, cloudsMap] = useTexture([
    '/assets/planets/earth/earth_albedo.jpg',
    '/assets/planets/earth/earth_nightlights.jpg',
    '/assets/planets/earth/earth_clouds.png'
  ]);

  useMemo(() => {
    albedoMap.wrapS = albedoMap.wrapT = THREE.RepeatWrapping;
    nightlightsMap.wrapS = nightlightsMap.wrapT = THREE.RepeatWrapping;
    cloudsMap.wrapS = cloudsMap.wrapT = THREE.RepeatWrapping;
  }, [albedoMap, nightlightsMap, cloudsMap]);

  // Sun positioned so it rises at the right limb (~70% down screen)
  const sunPos = useMemo(() => new THREE.Vector3(14.0, -1.8, -4.0), []);

  const uniforms = useMemo(() => ({
    uAlbedo: { value: albedoMap },
    uNightLights: { value: nightlightsMap },
    uCloudsMap: { value: cloudsMap },
    uSunPosition: { value: sunPos },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1920, 1080) }
  }), [albedoMap, nightlightsMap, cloudsMap, sunPos]);

  const atmUniforms = useMemo(() => ({
    uSunPosition: { value: sunPos }
  }), [sunPos]);

  const glareUniforms = useMemo(() => ({
    uSunriseScreenPos: { value: new THREE.Vector2(0.82, 0.32) }, // ~70% down right edge in screen coords
    uIntensity: { value: 0.95 }
  }), []);

  useFrame((state, delta) => {
    if (!isVisible) return;
    uniforms.uTime.value += delta;
    // Slow rotational drift of Earth
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <group visible={isVisible}>
      {/* Earth Body: curved limb sweeping diagonally across lower frame, tilted ~12° */}
      <group position={[0, -9.8, 0]} rotation={[0.08, 0.45, -0.21]}>
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

      {/* Fullscreen soft radial glare at sunrise horizon */}
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          vertexShader={SolarSunriseGlareShader.vertexShader}
          fragmentShader={SolarSunriseGlareShader.fragmentShader}
          uniforms={glareUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

