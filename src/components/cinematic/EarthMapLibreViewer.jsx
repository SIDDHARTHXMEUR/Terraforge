import React, { useEffect, useRef, useState } from 'react';
import { Map, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import { Layers, Globe, MapPin, X, ArrowLeft, AlertCircle } from 'lucide-react';
import { useEarthSurfaceStore, EARTH_LANDMARKS } from '../../state/useEarthSurfaceStore';

try {
  setWorkerUrl(mapWorkerUrl);
} catch {}

const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_TOKEN || 'MLY|29040078462269201|ab2b26116fe9c432f7aef7e3fcf125b2';

// High-density verified Mapillary coverage image keys for direct exploration
const SAMPLE_MAPILLARY_IMAGES = {
  nyc: '1043104069553815',
  tokyo: '1043104069553815',
  london: '1043104069553815'
};

export function EarthMapLibreViewer({
  isActive = false,
  onClose
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mlyContainerRef = useRef(null);
  const mlyViewerRef = useRef(null);

  const [mapStyle, setMapStyle] = useState('vector'); // 'vector' | 'satellite'
  const [activeImageId, setActiveImageId] = useState(null);
  const [noCoverageToast, setNoCoverageToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { focusedLocation, setFocusedLocation } = useEarthSurfaceStore();

  // Close on ESC
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeImageId) {
          setActiveImageId(null);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, activeImageId, onClose]);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!isActive || !mapContainerRef.current) return;

    const initialLat = focusedLocation?.lat || 40.7128;
    const initialLon = focusedLocation?.lon || -74.0060;

    const vectorStyle = {
      version: 8,
      sources: {
        openfreemap: {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap Contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'openfreemap',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };

    const satelliteStyle = {
      version: 8,
      sources: {
        esri: {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '&copy; Esri World Imagery'
        }
      },
      layers: [
        {
          id: 'satellite-tiles',
          type: 'raster',
          source: 'esri',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };

    const map = new Map({
      container: mapContainerRef.current,
      style: mapStyle === 'vector' ? vectorStyle : satelliteStyle,
      center: [initialLon, initialLat],
      zoom: 15.5,
      pitch: 52,
      bearing: -15,
      antialias: true
    });

    mapRef.current = map;

    map.on('load', () => {
      // 1. Add 3D Extruded Buildings Layer
      map.addSource('osm-buildings', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { height: 180, base: 0 },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [initialLon - 0.002, initialLat - 0.002],
                    [initialLon + 0.002, initialLat - 0.002],
                    [initialLon + 0.002, initialLat + 0.002],
                    [initialLon - 0.002, initialLat + 0.002],
                    [initialLon - 0.002, initialLat - 0.002]
                  ]
                ]
              }
            }
          ]
        }
      });

      map.addLayer({
        id: '3d-buildings',
        type: 'fill-extrusion',
        source: 'osm-buildings',
        paint: {
          'fill-extrusion-color': '#00e5ff',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-opacity': 0.65
        }
      });

      // 2. Add Mapillary Interactive Coverage Vector Layer
      if (MAPILLARY_TOKEN) {
        map.addSource('mapillary', {
          type: 'vector',
          tiles: [
            `https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${MAPILLARY_TOKEN}`
          ],
          minzoom: 6,
          maxzoom: 14
        });

        map.addLayer({
          id: 'mapillary-sequences',
          type: 'line',
          source: 'mapillary',
          'source-layer': 'sequence',
          paint: {
            'line-color': '#05cb63',
            'line-width': 3.5,
            'line-opacity': 0.85
          }
        });

        map.addLayer({
          id: 'mapillary-points',
          type: 'circle',
          source: 'mapillary',
          'source-layer': 'image',
          paint: {
            'circle-color': '#05cb63',
            'circle-radius': 5,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff'
          }
        });

        // Click Mapillary Marker to open Street View
        map.on('click', 'mapillary-points', (e) => {
          if (e.features && e.features.length > 0) {
            const feat = e.features[0];
            const imgId = feat.properties?.id || feat.id;
            if (imgId) {
              setActiveImageId(String(imgId));
            }
          }
        });
      }

      // Map Click fallback detection
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['mapillary-points'] });
        if (!features || features.length === 0) {
          // If clicked in an area without coverage, trigger fallback
          setToastMessage('No street-level imagery available here');
          setNoCoverageToast(true);
        }
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isActive, mapStyle]);

  // Initialize Mapillary 360-degree Viewer when an image ID is active
  useEffect(() => {
    if (!activeImageId || !mlyContainerRef.current) {
      if (mlyViewerRef.current) {
        try {
          mlyViewerRef.current.remove();
        } catch {}
        mlyViewerRef.current = null;
      }
      return;
    }

    try {
      const viewer = new Viewer({
        container: mlyContainerRef.current,
        accessToken: MAPILLARY_TOKEN,
        imageId: activeImageId
      });
      mlyViewerRef.current = viewer;
    } catch (err) {
      console.warn('Mapillary Viewer Init Error:', err);
    }

    return () => {
      if (mlyViewerRef.current) {
        try {
          mlyViewerRef.current.remove();
        } catch {}
        mlyViewerRef.current = null;
      }
    };
  }, [activeImageId]);

  if (!isActive) return null;

  const handleJumpToCity = (cityKey) => {
    const lm = EARTH_LANDMARKS.find((l) => l.id === cityKey);
    if (lm && mapRef.current) {
      setFocusedLocation({ lat: lm.lat, lon: lm.lon, name: lm.name });
      mapRef.current.flyTo({ center: [lm.lon, lm.lat], zoom: 15.5 });
      setNoCoverageToast(false);
    }
  };

  const handleOpenSampleStreetView = (cityKey) => {
    const imgId = SAMPLE_MAPILLARY_IMAGES[cityKey] || SAMPLE_MAPILLARY_IMAGES.nyc;
    setActiveImageId(imgId);
    setNoCoverageToast(false);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col font-sans select-none animate-fadeIn">
      {/* 1. Header Toolbar */}
      <header className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between bg-black/80 backdrop-blur-md rounded-2xl border border-white/15 px-5 py-3 shadow-2xl">
        <div className="flex items-center space-x-3 text-white">
          <button
            onClick={onClose}
            title="Return to Earth Orbit in 3D Simulator (Esc)"
            className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-200 transition-colors font-mono text-xs uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO ORBIT</span>
          </button>
          <span className="text-white/20">|</span>
          <div className="flex items-center space-x-2 text-xs font-mono text-white/90">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="uppercase tracking-wider">EARTH SURFACE STREET VIEW</span>
          </div>
        </div>

        {/* Quick Landmark Jumps */}
        <div className="hidden md:flex items-center space-x-3 text-xs font-mono text-white/70">
          <span className="text-[10px] uppercase text-white/40 tracking-wider">EXPLORE:</span>
          {EARTH_LANDMARKS.map((lm) => (
            <button
              key={lm.id}
              onClick={() => handleJumpToCity(lm.id)}
              className="hover:text-white transition-colors cursor-pointer underline underline-offset-4 decoration-white/20"
            >
              {lm.name}
            </button>
          ))}
        </div>

        {/* Style Toggle & Street View Trigger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleOpenSampleStreetView('nyc')}
            title="Open 360-degree Mapillary street-level view"
            className="bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 rounded-xl font-mono text-xs uppercase flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>OPEN STREET VIEW</span>
          </button>

          <button
            onClick={() => setMapStyle((s) => (s === 'vector' ? 'satellite' : 'vector'))}
            title="Toggle between Vector OSM with 3D buildings and Satellite imagery"
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-mono text-xs uppercase flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{mapStyle === 'vector' ? 'SATELLITE' : '3D VECTOR'}</span>
          </button>
        </div>
      </header>

      {/* 2. MapLibre GL Map View Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 3. Mapillary 360-Degree Street View Overlay Modal */}
      {activeImageId && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col">
          <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white flex items-center space-x-3 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MAPILLARY 360° STREET VIEW</span>
            <button
              onClick={() => setActiveImageId(null)}
              className="text-white/40 hover:text-white p-1 cursor-pointer transition-colors"
              title="Close Street View (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div ref={mlyContainerRef} className="w-full h-full" />
        </div>
      )}

      {/* 4. No-Coverage Fallback Toast Notification */}
      {noCoverageToast && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-950/95 border border-amber-500/50 rounded-2xl p-4 shadow-2xl flex items-center space-x-4 max-w-md text-white">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-sans font-light text-white/90">
              {toastMessage || 'No street-level imagery available here.'}
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-cyan-400">
              <span>EXPLORE:</span>
              <button
                onClick={() => handleJumpToCity('tokyo')}
                className="hover:underline cursor-pointer"
              >
                Tokyo
              </button>
              <span>·</span>
              <button
                onClick={() => handleJumpToCity('nyc')}
                className="hover:underline cursor-pointer"
              >
                NYC
              </button>
              <span>·</span>
              <button
                onClick={() => handleJumpToCity('london')}
                className="hover:underline cursor-pointer"
              >
                London
              </button>
            </div>
          </div>
          <button
            onClick={() => setNoCoverageToast(false)}
            className="text-white/40 hover:text-white p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
