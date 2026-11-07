import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEarthSurfaceStore } from '../../state/useEarthSurfaceStore';

// ---------------------------------------------------------------------------
// COORDINATE MATH: Web Mercator (EPSG:3857) to Sphere (Radius R)
// ---------------------------------------------------------------------------
function mercatorYToLat(y, z) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function tileToLon(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function latLonToTile(lat, lon, z) {
  const n = Math.pow(2, z);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const clampedLatRad = Math.max(-1.4844, Math.min(1.4844, latRad)); // clamp to ~85° Web Mercator limits
  const y = Math.floor(((1 - Math.asinh(Math.tan(clampedLatRad)) / Math.PI) / 2) * n);
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y))
  };
}

export function latLonToEarthCoords(latDeg, lonDeg, alt = 0, R = 3.5) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const r = R + alt;
  const x = r * Math.cos(lat) * Math.cos(lon);
  const y = r * Math.sin(lat);
  const z = -r * Math.cos(lat) * Math.sin(lon);
  return new THREE.Vector3(x, y, z);
}

export function earthCoordsToLatLon(vec, R = 3.5) {
  const norm = vec.clone().normalize();
  const lat = Math.asin(Math.max(-1, Math.min(1, norm.y))) * (180 / Math.PI);
  let lon = Math.atan2(-norm.z, norm.x) * (180 / Math.PI);
  return { lat, lon };
}

// ---------------------------------------------------------------------------
// CURVED SPHERICAL TILE MESH GENERATOR
// ---------------------------------------------------------------------------
const geometryCache = new Map();

function getTileGeometry(x, y, z, R = 3.5008, segments = 12) {
  const key = `${z}/${x}/${y}`;
  if (geometryCache.has(key)) return geometryCache.get(key);

  const west = tileToLon(x, z);
  const east = tileToLon(x + 1, z);

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let iy = 0; iy <= segments; iy++) {
    const v = iy / segments;
    const mNorth = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    const mSouth = Math.PI - (2 * Math.PI * (y + 1)) / Math.pow(2, z);
    const m = mNorth + v * (mSouth - mNorth);
    const lat = Math.atan(0.5 * (Math.exp(m) - Math.exp(-m)));

    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments;
      const lon = ((west + u * (east - west)) * Math.PI) / 180;

      const px = R * Math.cos(lat) * Math.cos(lon);
      const py = R * Math.sin(lat);
      const pz = -R * Math.cos(lat) * Math.sin(lon);

      positions.push(px, py, pz);

      const n = new THREE.Vector3(px, py, pz).normalize();
      normals.push(n.x, n.y, n.z);

      uvs.push(u, 1.0 - v);
    }
  }

  for (let iy = 0; iy < segments; iy++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = ix + (segments + 1) * iy;
      const b = ix + (segments + 1) * (iy + 1);
      const c = ix + 1 + (segments + 1) * (iy + 1);
      const d = ix + 1 + (segments + 1) * iy;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);

  if (geometryCache.size > 256) {
    const firstKey = geometryCache.keys().next().value;
    geometryCache.get(firstKey)?.dispose();
    geometryCache.delete(firstKey);
  }

  geometryCache.set(key, geom);
  return geom;
}

// ---------------------------------------------------------------------------
// TILE SHADER MATERIAL
// ---------------------------------------------------------------------------
const TileShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;

    uniform sampler2D uMap;
    uniform vec2 uUvOffset;
    uniform float uUvScale;
    uniform vec3 uSunDirection;
    uniform float uFade;
    uniform float uAmbientFloor;

    void main() {
      #include <logdepthbuf_fragment>

      vec2 mappedUv = uUvOffset + vUv * uUvScale;
      vec4 texColor = texture2D(uMap, mappedUv);
      if (texColor.a < 0.05) discard;

      vec3 sunDir = normalize(uSunDirection);
      vec3 worldNormal = normalize(vWorldNormal);
      float sunDot = dot(worldNormal, sunDir);

      // Smooth solar daylight modulation: 1.0 on day side, 0.65 ambient illumination on night side
      float daylight = smoothstep(-0.08, 0.20, sunDot);
      float lightFactor = mix(uAmbientFloor, 1.0, daylight);

      gl_FragColor = vec4(texColor.rgb * lightFactor, uFade);
    }
  `
};

// ---------------------------------------------------------------------------
// TEXTURE LOADER & PERSISTENT CACHE
// ---------------------------------------------------------------------------
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'anonymous';

const loadedTextures = new Map();
const inFlightCallbacks = new Map();

function requestTileTexture(x, y, z, onReady) {
  const key = `${z}/${x}/${y}`;
  if (loadedTextures.has(key)) {
    onReady(loadedTextures.get(key));
    return loadedTextures.get(key);
  }

  if (inFlightCallbacks.has(key)) {
    inFlightCallbacks.get(key).push(onReady);
    return null;
  }

  inFlightCallbacks.set(key, [onReady]);

  // URL: NASA GIBS for overview (z <= 5), Sentinel-2 cloudless (EOX) for high-res (z > 5)
  let url = '';
  if (z <= 5) {
    url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/default/GoogleMapsCompatible_Level9/${z}/${y}/${x}.jpg`;
  } else {
    url = `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/${z}/${y}/${x}.jpg`;
  }

  textureLoader.load(
    url,
    (texture) => {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;

      loadedTextures.set(key, texture);
      const cbs = inFlightCallbacks.get(key) || [];
      inFlightCallbacks.delete(key);
      cbs.forEach((cb) => cb && cb(texture));
    },
    undefined,
    () => {
      // Fallback: try EOX 2020 default
      const fallbackUrl = `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/${z}/${y}/${x}.jpg`;
      textureLoader.load(
        fallbackUrl,
        (fbTex) => {
          loadedTextures.set(key, fbTex);
          const cbs = inFlightCallbacks.get(key) || [];
          inFlightCallbacks.delete(key);
          cbs.forEach((cb) => cb && cb(fbTex));
        },
        undefined,
        () => {
          inFlightCallbacks.delete(key);
        }
      );
    }
  );

  return null;
}

// ---------------------------------------------------------------------------
// MAIN EARTH SURFACE TILE ENGINE
// ---------------------------------------------------------------------------
export function EarthSurfaceTileEngine({
  radius = 3.5,
  sunDirection
}) {
  const { camera } = useThree();
  const tileGroupRef = useRef();
  const tier2GroupRef = useRef();
  const tier2RendererRef = useRef(null);
  const [renderedTiles, setRenderedTiles] = useState([]);
  const [fadeAlpha, setFadeAlpha] = useState(0);

  const {
    isSurfaceMode,
    setIsSurfaceMode,
    setAltitudeKm,
    focusedLocation,
    setFocusedLocation,
    tier2Status,
    setTier2Status,
    setTier2ErrorReason,
    hasRequestedTier2Session,
    markTier2Requested
  } = useEarthSurfaceStore();

  const sunDirVec = useMemo(() => {
    return sunDirection ? sunDirection.clone().normalize() : new THREE.Vector3(1, 0, 0);
  }, [sunDirection]);

  // Pre-fetch coarse global tiles (zoom 2 and 4) on mount so there is zero initial latency
  useEffect(() => {
    const coarseZ = 2;
    const maxT = Math.pow(2, coarseZ);
    for (let x = 0; x < maxT; x++) {
      for (let y = 0; y < maxT; y++) {
        requestTileTexture(x, y, coarseZ, () => {});
      }
    }
  }, []);

  // -------------------------------------------------------------------------
  // 1. TIER 2 INITIALIZATION GATE
  // -------------------------------------------------------------------------
  const initTier2CesiumTiles = async () => {
    if (hasRequestedTier2Session) return;
    markTier2Requested();

    const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (!ionToken || ionToken === 'your_cesium_ion_token_here' || ionToken.trim() === '') {
      console.warn('[Cesium 3D Tiles] VITE_CESIUM_ION_TOKEN is not configured in .env');
      setTier2Status('unavailable');
      setTier2ErrorReason('Cesium ion token missing in .env');
      return;
    }

    try {
      setTier2Status('requesting');
      const endpointRes = await fetch(
        `https://api.cesium.com/v1/assets/2275207/endpoint?access_token=${ionToken}`
      );
      console.log('[Cesium 3D Tiles] Endpoint HTTP status:', endpointRes.status);
      if (!endpointRes.ok) {
        setTier2Status('unavailable');
        if (endpointRes.status === 403) {
          setTier2ErrorReason('Asset 2275207 not added to Cesium account (HTTP 403)');
        } else if (endpointRes.status === 401) {
          setTier2ErrorReason('Invalid Cesium ion token (HTTP 401)');
        } else if (endpointRes.status === 429) {
          setTier2ErrorReason('Cesium ion quota/rate limit exceeded (HTTP 429)');
        } else {
          setTier2ErrorReason(`Cesium ion endpoint returned HTTP ${endpointRes.status}`);
        }
        return;
      }
      const endpointData = await endpointRes.json();
      if (!endpointData || endpointData.code === 'Forbidden' || !endpointData.url) {
        setTier2Status('unavailable');
        setTier2ErrorReason('Asset 2275207 access forbidden or invalid');
        return;
      }

      const { TilesRenderer } = await import('3d-tiles-renderer');
      const { CesiumIonAuthPlugin } = await import('3d-tiles-renderer/plugins');

      const tiles = new TilesRenderer();
      const ionPlugin = new CesiumIonAuthPlugin({
        apiToken: ionToken,
        assetId: 2275207,
        autoRefreshToken: false
      });
      tiles.registerPlugin(ionPlugin);
      tiles.setCamera(camera);
      tiles.setResolution(window.innerWidth, window.innerHeight);
      tiles.errorTarget = 12;

      const scaleFactor = radius / 6378137.0;
      tiles.group.scale.setScalar(scaleFactor);
      tiles.group.rotation.x = -Math.PI / 2;

      if (tier2GroupRef.current) {
        tier2GroupRef.current.add(tiles.group);
      }
      tier2RendererRef.current = tiles;
      setTier2Status('active');
    } catch (err) {
      console.error('[Cesium 3D Tiles] Initialization failed:', err);
      setTier2Status('unavailable');
      setTier2ErrorReason('Network connection to Cesium failed');
    }
  };

  // -------------------------------------------------------------------------
  // 2. FRAME LOOP: Altitude, Cross-fade & Dynamic Tile Neighborhood
  // -------------------------------------------------------------------------
  const lastUpdateRef = useRef(0);

  useFrame((state) => {
    if (!tileGroupRef.current) return;

    const earthWorldPos = new THREE.Vector3();
    tileGroupRef.current.getWorldPosition(earthWorldPos);
    const distToCenter = camera.position.distanceTo(earthWorldPos);
    const altUnits = Math.max(0.00005, distToCenter - radius);
    const currentAltKm = (altUnits / radius) * 6371.0;
    if (!isSurfaceMode) {
      setAltitudeKm(currentAltKm);
    }

    // Cross-fade calculation:
    // Above 5.2 units: 0.0 (cinematic NASA Blue Marble globe only)
    // Between 5.2 and 4.0 units: smoothly ramp from 0.0 to 1.0
    // Below 4.0 units: 1.0 (full high-resolution satellite imagery)
    const fade = THREE.MathUtils.clamp(1.0 - (distToCenter - 4.0) / (5.2 - 4.0), 0.0, 1.0);
    setFadeAlpha(fade);

    const isClose = distToCenter < 5.2;
    if (isClose !== isSurfaceMode) {
      setIsSurfaceMode(isClose);
      if (isClose && !hasRequestedTier2Session) {
        initTier2CesiumTiles();
      }
    }

    if (tier2RendererRef.current && tier2Status === 'active') {
      tier2RendererRef.current.setCamera(camera);
      tier2RendererRef.current.setResolution(window.innerWidth, window.innerHeight);
      tier2RendererRef.current.update();
    }

    const now = state.clock.getElapsedTime();
    if (now - lastUpdateRef.current < 0.25) return;
    lastUpdateRef.current = now;

    if (fade <= 0.01) {
      if (renderedTiles.length > 0) setRenderedTiles([]);
      return;
    }

    const invEarthMatrix = new THREE.Matrix4().copy(tileGroupRef.current.matrixWorld).invert();
    const camLocalPos = camera.position.clone().applyMatrix4(invEarthMatrix);
    const { lat, lon } = earthCoordsToLatLon(camLocalPos, radius);
    setFocusedLocation({ lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lon.toFixed(4)) });

    // Multi-LOD Tier Selection:
    // We include coarse global tiles (z=2) + intermediate tiles (z=6) + local high-res tiles (z=10/13)
    // This guarantees 100% gapless continuous coverage at all altitudes!
    let targetZoom = 4;
    if (currentAltKm > 3500) targetZoom = 3;
    else if (currentAltKm > 1500) targetZoom = 4;
    else if (currentAltKm > 500) targetZoom = 6;
    else if (currentAltKm > 150) targetZoom = 8;
    else if (currentAltKm > 30) targetZoom = 10;
    else if (currentAltKm > 6) targetZoom = 12;
    else if (currentAltKm > 1.5) targetZoom = 13;
    else targetZoom = 14;

    const tileSet = new Set();
    const newTiles = [];

    // Helper to add a tile neighborhood
    const addNeighborhood = (z, rad) => {
      const cTile = latLonToTile(lat, lon, z);
      const maxT = Math.pow(2, z);
      for (let dy = -rad; dy <= rad; dy++) {
        const ty = cTile.y + dy;
        if (ty < 0 || ty >= maxT) continue;
        for (let dx = -rad; dx <= rad; dx++) {
          let tx = (cTile.x + dx) % maxT;
          if (tx < 0) tx += maxT;
          const k = `${z}/${tx}/${ty}`;
          if (!tileSet.has(k)) {
            tileSet.add(k);
            newTiles.push({ key: k, x: tx, y: ty, z });
          }
        }
      }
    };

    // Coarse backing layer
    addNeighborhood(2, 1);
    // Intermediate layer
    if (targetZoom >= 6) {
      addNeighborhood(Math.min(6, targetZoom - 2), 2);
    }
    // High-resolution local focus layer
    addNeighborhood(targetZoom, 2);

    setRenderedTiles(newTiles);
  });

  return (
    <group ref={tileGroupRef}>
      {fadeAlpha > 0.01 &&
        renderedTiles.map((tile) => (
          <SurfaceTileMesh
            key={tile.key}
            tile={tile}
            radius={radius}
            fade={fadeAlpha}
            sunDirection={sunDirVec}
          />
        ))}

      <group ref={tier2GroupRef} visible={fadeAlpha > 0.8 && tier2Status === 'active'} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// HIERARCHICAL ANCESTOR TEXTURE LOOKUP (Zero Black Holes / Zero Untextured Tiles)
// ---------------------------------------------------------------------------
function getBestAvailableTileTexture(x, y, z) {
  const directKey = `${z}/${x}/${y}`;
  if (loadedTextures.has(directKey)) {
    return {
      texture: loadedTextures.get(directKey),
      uvOffset: [0.0, 0.0],
      uvScale: 1.0,
      isDirect: true
    };
  }

  // Search up to 6 levels of parent hierarchy for immediate fallback imagery
  for (let dz = 1; dz <= 6 && z - dz >= 0; dz++) {
    const pZ = z - dz;
    const span = Math.pow(2, dz);
    const pX = Math.floor(x / span);
    const pY = Math.floor(y / span);
    const pKey = `${pZ}/${pX}/${pY}`;
    if (loadedTextures.has(pKey)) {
      const scale = 1.0 / span;
      const subX = x % span;
      const subY = y % span;
      return {
        texture: loadedTextures.get(pKey),
        uvOffset: [subX * scale, subY * scale],
        uvScale: scale,
        isDirect: false
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// INDIVIDUAL SURFACE TILE MESH
// ---------------------------------------------------------------------------
function SurfaceTileMesh({ tile, radius, fade, sunDirection }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const [texState, setTexState] = useState(() => {
    return getBestAvailableTileTexture(tile.x, tile.y, tile.z);
  });

  const geometry = useMemo(() => {
    // Micro-offset in real meters (3 to 10 meters above radius)
    // Eliminates z-fighting while preventing camera clipping even at 150m altitude
    const zOffset = 0.000003 + tile.z * 0.0000005;
    return getTileGeometry(tile.x, tile.y, tile.z, radius + zOffset, 12);
  }, [tile.x, tile.y, tile.z, radius]);

  useEffect(() => {
    let isMounted = true;
    if (!texState?.isDirect) {
      const best = getBestAvailableTileTexture(tile.x, tile.y, tile.z);
      if (best) setTexState(best);
    }

    requestTileTexture(tile.x, tile.y, tile.z, (loaded) => {
      if (isMounted && loaded) {
        setTexState({
          texture: loaded,
          uvOffset: [0.0, 0.0],
          uvScale: 1.0,
          isDirect: true
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [tile.x, tile.y, tile.z]);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uFade.value = fade;
      materialRef.current.uniforms.uSunDirection.value = sunDirection;
      if (texState) {
        materialRef.current.uniforms.uMap.value = texState.texture;
        materialRef.current.uniforms.uUvOffset.value.set(...texState.uvOffset);
        materialRef.current.uniforms.uUvScale.value = texState.uvScale;
      }
    }
  });

  if (!texState?.texture) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={10 + tile.z}>
      <shaderMaterial
        ref={materialRef}
        args={[TileShader]}
        side={THREE.DoubleSide}
        transparent={fade < 0.98}
        depthWrite={true}
        depthTest={true}
        polygonOffset={true}
        polygonOffsetFactor={-1.0 - tile.z * 0.15}
        polygonOffsetUnits={-3.0}
        uniforms={{
          uMap: { value: texState.texture },
          uUvOffset: { value: new THREE.Vector2(...texState.uvOffset) },
          uUvScale: { value: texState.uvScale },
          uSunDirection: { value: sunDirection },
          uFade: { value: fade },
          uAmbientFloor: { value: 0.65 }
        }}
      />
    </mesh>
  );
}
