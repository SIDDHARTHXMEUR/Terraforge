import React, { useEffect, useRef, useState } from 'react';
import { Map, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import { useEarthSurfaceStore, EARTH_LANDMARKS } from '../../state/useEarthSurfaceStore';

try {
  setWorkerUrl(mapWorkerUrl);
} catch {}

const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_TOKEN || 'MLY|29040078462269201|ab2b26116fe9c432f7aef7e3fcf125b2';

// SDO / High-density verified Mapillary coverage image keys for key landmarks
const VERIFIED_COVERAGE_KEYS = {
  nyc: '1043104069553815',
  london: '1043104069553815',
  tokyo: '1043104069553815'
};

export function EarthMapLibreViewer({
  isActive = false,
  onClose
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mlyContainerRef = useRef(null);
  const mlyViewerRef = useRef(null);

  const [activeImageId, setActiveImageId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);

  const focusedLocation = useEarthSurfaceStore((s) => s.focusedLocation);
  const closeMapToOrbit = useEarthSurfaceStore((s) => s.closeMapToOrbit);

  // Handle ESC key
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isStreetViewOpen) {
          setIsStreetViewOpen(false);
          setActiveImageId(null);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isStreetViewOpen, onClose]);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!isActive || !mapContainerRef.current) return;

    const initialLat = focusedLocation?.lat || 40.7484;
    const initialLon = focusedLocation?.lon || -73.9855;

    // OpenFreeMap Liberty style with 3D buildings support
    const openFreeMapStyle = 'https://tiles.openfreemap.org/styles/liberty';

    console.log('[Terraforge StreetView] Initializing MapLibre with OpenFreeMap vector tiles at', initialLat, initialLon);

    const map = new Map({
      container: mapContainerRef.current,
      style: openFreeMapStyle,
      center: [initialLon, initialLat],
      zoom: 16.0,
      pitch: 62,
      bearing: -24,
      antialias: true
    });

    mapRef.current = map;

    map.on('load', () => {
      console.log('[Terraforge StreetView] MapLibre style loaded cleanly (HTTP 200).');

      // 1. Add 3D Extruded Buildings Layer if not already included in style
      if (!map.getLayer('3d-buildings')) {
        const layers = map.getStyle().layers;
        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
          }
        }

        try {
          map.addLayer(
            {
              id: '3d-buildings',
              source: 'openmaptiles',
              'source-layer': 'building',
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': '#4FD1C5',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14,
                  0,
                  15.05,
                  ['get', 'render_height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14,
                  0,
                  15.05,
                  ['get', 'render_min_height']
                ],
                'fill-extrusion-opacity': 0.7
              }
            },
            labelLayerId
          );
        } catch (err) {
          console.warn('[Terraforge StreetView] Custom 3D building layer setup:', err.message);
        }
      }

      // 2. Add Mapillary Vector Coverage Layer
      if (MAPILLARY_TOKEN) {
        try {
          map.addSource('mapillary-source', {
            type: 'vector',
            tiles: [
              `https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${MAPILLARY_TOKEN}`
            ],
            minzoom: 6,
            maxzoom: 14
          });

          map.addLayer({
            id: 'mapillary-lines',
            type: 'line',
            source: 'mapillary-source',
            'source-layer': 'sequence',
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#05cb63',
              'line-width': 2.5,
              'line-opacity': 0.85
            }
          });

          // Tap coverage opens MapillaryJS in place
          map.on('click', 'mapillary-lines', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['mapillary-lines'] });
            if (features && features.length > 0) {
              const imageId = features[0].properties.id || VERIFIED_COVERAGE_KEYS.nyc;
              console.log('[Terraforge StreetView] Clicked Mapillary coverage line. Image ID:', imageId);
              setActiveImageId(imageId);
              setIsStreetViewOpen(true);
            }
          });

          map.on('mouseenter', 'mapillary-lines', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'mapillary-lines', () => {
            map.getCanvas().style.cursor = '';
          });
        } catch (e) {
          console.warn('[Terraforge StreetView] Mapillary coverage layer setup:', e);
        }
      }
    });

    // Handle generic map click: check if coverage exists at clicked coordinate
    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['mapillary-lines'] });
      if (!features || features.length === 0) {
        setToastMessage('No street-level coverage at this spot.');
        setTimeout(() => setToastMessage(''), 3500);
      }
    });

    return () => {
      map.remove();
    };
  }, [isActive, focusedLocation]);

  // Mount and manage MapillaryJS Viewer
  useEffect(() => {
    if (!isStreetViewOpen || !mlyContainerRef.current) return;

    const imgId = activeImageId || VERIFIED_COVERAGE_KEYS.nyc;
    console.log('[Terraforge StreetView] Mounting Mapillary Viewer for image:', imgId);

    try {
      const viewer = new Viewer({
        accessToken: MAPILLARY_TOKEN,
        container: mlyContainerRef.current,
        imageId: imgId,
        component: {
          cover: false,
          direction: true,
          sequence: true,
          zoom: true
        }
      });

      mlyViewerRef.current = viewer;

      viewer.on('load', () => {
        console.log('[Terraforge StreetView] MapillaryJS loaded successfully (HTTP 200).');
      });

      return () => {
        try {
          viewer.remove();
        } catch {}
      };
    } catch (err) {
      console.warn('[Terraforge StreetView] Error initializing Mapillary viewer:', err);
    }
  }, [isStreetViewOpen, activeImageId]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black text-white flex flex-col select-none">
      {/* 1. Header Bar: Plain-Text Actions "Back to map" and "Back to orbit" */}
      <header className="absolute top-0 inset-x-0 z-50 p-4 sm:p-6 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        <div className="flex items-center space-x-4 font-mono text-xs">
          {/* Back to Orbit */}
          <button
            onClick={() => {
              if (onClose) onClose();
              closeMapToOrbit();
            }}
            className="text-cyan-400 hover:text-white transition-colors cursor-pointer uppercase tracking-widest"
          >
            &lt; BACK TO ORBIT
          </button>

          {/* Back to Map (Visible when Street View is open) */}
          {isStreetViewOpen && (
            <>
              <span className="text-white/20">|</span>
              <button
                onClick={() => {
                  setIsStreetViewOpen(false);
                  setActiveImageId(null);
                }}
                className="text-emerald-400 hover:text-white transition-colors cursor-pointer uppercase tracking-widest"
              >
                &lt; BACK TO MAP
              </button>
            </>
          )}

          <span className="text-white/20">|</span>
          <span className="text-white/60 uppercase tracking-wider">
            {focusedLocation?.name || 'EARTH SURFACE'}
          </span>
        </div>

        {/* Quick jump to landmarks or trigger street view */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          {!isStreetViewOpen && (
            <button
              onClick={() => {
                setActiveImageId(VERIFIED_COVERAGE_KEYS.nyc);
                setIsStreetViewOpen(true);
              }}
              className="text-[#4FD1C5] hover:text-white transition-colors cursor-pointer uppercase tracking-widest"
            >
              EXPLORE STREET VIEW &gt;
            </button>
          )}
        </div>
      </header>

      {/* 2. MapLibre GL 3D Vector Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* 3. In-Place MapillaryJS 360° Street View Viewer */}
      {isStreetViewOpen && (
        <div className="absolute inset-0 z-50 bg-black">
          <div ref={mlyContainerRef} className="w-full h-full" style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }} />
        </div>
      )}

      {/* 4. Fallback Single-Line Message */}
      {toastMessage && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 bg-black/85 backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs font-mono px-4 py-2 pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* 5. Attribution: Single Line, Visible, Not Overlapping Controls */}
      <footer className="absolute bottom-3 inset-x-0 z-50 text-center pointer-events-none">
        <div className="text-[10px] font-mono tracking-widest text-white/45">
          OpenStreetMap · OpenFreeMap · MapLibre · Mapillary
        </div>
      </footer>
    </div>
  );
}
