import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * 3D Depth-Tested Giant Ghost Word
 * - Rendered at exactly 24% opacity (#FFF8E7 @ 0.24, never 100%)
 * - Partially clipped off screen edge (at least 15% hidden)
 * - Sits behind the planet, depth-tested so planet disc occludes it
 */
export function GhostWord3D({
  text = 'MARS',
  position = [0, 0, -2],
  scale = [12, 3.2, 1],
  opacity = 0.24,
  isVertical = false
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    if (isVertical) {
      canvas.width = 512;
      canvas.height = 2048;
    } else {
      canvas.width = 2048;
      canvas.height = 512;
    }
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 5;
    ctx.strokeStyle = `rgba(255, 248, 231, ${opacity})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isVertical) {
      const letters = text.toUpperCase().split('');
      ctx.font = 'normal 320px "League Gothic", "Impact", sans-serif';
      const stepY = canvas.height / (letters.length + 0.5);
      letters.forEach((letter, i) => {
        const y = (i + 0.8) * stepY;
        ctx.strokeText(letter, canvas.width / 2, y);
      });
    } else {
      ctx.font = 'normal 380px "League Gothic", "Impact", sans-serif';
      ctx.letterSpacing = '0.14em';
      ctx.strokeText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [text, opacity, isVertical]);

  const planeArgs = useMemo(() => {
    if (isVertical) {
      return [scale[1] * 0.9, scale[0] * 1.1];
    }
    return [scale[0], scale[1]];
  }, [scale, isVertical]);

  return (
    <mesh position={position}>
      <planeGeometry args={planeArgs} />
      <meshBasicMaterial
        map={texture}
        transparent={true}
        depthTest={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
