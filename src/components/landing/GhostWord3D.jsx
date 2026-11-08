import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * 3D Depth-Tested Ghost Word
 * - Rendered in League Gothic uppercase (~28vw equivalent in 3D world units)
 * - 1px cream outline at 14% opacity (#FFF8E7 @ 0.14)
 * - Positioned behind the planet so the planet's spherical mesh occludes >= 15% of the text area
 * - Depth-tested with depthWrite: false so Three.js z-buffer handles physical occlusion
 */
export function GhostWord3D({
  text = 'MARS',
  position = [0, 0, -2],
  scale = [12, 3.2, 1],
  opacity = 0.14
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Font setup
    ctx.font = 'normal 380px "League Gothic", "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '0.14em';

    // 1px outline cream at requested opacity
    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(255, 248, 231, ${opacity})`;
    ctx.strokeText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [text, opacity]);

  return (
    <mesh position={position}>
      <planeGeometry args={[scale[0], scale[1]]} />
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
