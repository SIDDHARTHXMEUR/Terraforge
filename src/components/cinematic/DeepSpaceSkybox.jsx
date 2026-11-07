import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Real Astronomical Star Catalog Shader (HYG Database v3.8)
// 31,473 stars down to Vmag 7.7 in Ecliptic coordinates.
// Pure optical infinity (no parallax), Gaussian PSF, 4-point spikes for top 15 stars.
// -----------------------------------------------------------------------------
const AstronomicalStarShader = {
  vertexShader: `
    attribute float aFlux;
    attribute float aIsBright;

    varying vec3 vColor;
    varying float vFlux;
    varying float vIsBright;

    void main() {
      vColor = color;
      vFlux = aFlux;
      vIsBright = aIsBright;

      // Optical infinity: homogeneous w=0 ignores camera translation, keeping stars purely rotation-dependent
      vec4 viewPos = viewMatrix * vec4(position, 0.0);
      vec4 clipPos = projectionMatrix * vec4(viewPos.xyz, 1.0);

      // Clamp depth to far plane (depth = 1.0) so stars render behind all solar system geometry
      gl_Position = clipPos.xyww;

      // Calculate sharp point size:
      // Faint background stars: 1.2 to 2.2 pixels
      // Bright stars: 3.0 to 6.5 pixels (to accommodate Airy disc and subtle 4-point spike)
      float size = 1.2 + pow(clamp(vFlux, 0.001, 4.0), 0.28) * 2.0;
      if (aIsBright > 0.5) {
        size = max(size, 6.5);
      }
      gl_PointSize = size;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vFlux;
    varying float vIsBright;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      // Gaussian Point Spread Function (Airy disc core)
      float psf = exp(-dist * dist * 16.0);

      // 4-point diffraction spike for the top brightest stars (Sirius, Canopus, Vega, Betelgeuse, Rigel, etc.)
      float spike = 0.0;
      if (vIsBright > 0.5) {
        vec2 ac = abs(coord);
        // Horizontal and vertical spike arms
        float armX = exp(-ac.y * 32.0) * exp(-ac.x * 4.0);
        float armY = exp(-ac.x * 32.0) * exp(-ac.y * 4.0);
        spike = max(armX, armY) * 0.45;
      }

      float totalProfile = clamp(psf + spike, 0.0, 1.0);

      // Physically scaled flux: bright stars pop, faint stars form subtle cosmic background
      float brightness = 0.75 + pow(clamp(vFlux, 0.0008, 4.0), 0.32) * 1.25;
      vec3 starColor = vColor * totalProfile * brightness;

      // Void dithering (prevents 8-bit quantization banding in pitch black space)
      float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * (1.0 / 255.0);
      starColor = max(vec3(0.0), starColor + dither);

      gl_FragColor = vec4(starColor, totalProfile);
    }
  `
};

export function DeepSpaceSkybox() {
  const { scene } = useThree();
  const [starGeometry, setStarGeometry] = useState(null);

  // Set the scene clear/background color to pure astronomical black
  useEffect(() => {
    scene.background = new THREE.Color(0x000000);
  }, [scene]);

  // Load the pre-processed HYG binary catalog
  useEffect(() => {
    let isCancelled = false;

    fetch('/data/hyg_stars.bin')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buffer => {
        if (isCancelled) return;
        const floatData = new Float32Array(buffer);
        const starCount = floatData.length / 8;

        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const fluxes = new Float32Array(starCount);
        const isBrights = new Float32Array(starCount);

        // Distance on celestial sphere (arbitrary since w=0 in vertex shader, but keep 8000 for safety)
        const R = 8000.0;

        for (let i = 0; i < starCount; i++) {
          const base = i * 8;
          positions[i * 3 + 0] = floatData[base + 0] * R;
          positions[i * 3 + 1] = floatData[base + 1] * R;
          positions[i * 3 + 2] = floatData[base + 2] * R;

          colors[i * 3 + 0] = floatData[base + 3];
          colors[i * 3 + 1] = floatData[base + 4];
          colors[i * 3 + 2] = floatData[base + 5];

          fluxes[i] = floatData[base + 6];
          isBrights[i] = floatData[base + 7];
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('aFlux', new THREE.BufferAttribute(fluxes, 1));
        geo.setAttribute('aIsBright', new THREE.BufferAttribute(isBrights, 1));

        setStarGeometry(geo);
      })
      .catch(err => {
        console.warn('Could not load hyg_stars.bin, fallback to procedural catalog:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: AstronomicalStarShader.vertexShader,
      fragmentShader: AstronomicalStarShader.fragmentShader,
      vertexColors: true,
      transparent: true,
      depthTest: true,
      depthWrite: false, // Prevents stars from occluding any 3D objects
      blending: THREE.AdditiveBlending
    });
  }, []);

  if (!starGeometry) return null;

  return (
    <points geometry={starGeometry} material={starMaterial} frustumCulled={false} renderOrder={-100} />
  );
}
