import React, { useState, useEffect } from 'react';
import {
  fetchNasaEonetEvents,
  fetchNasaAsteroids,
  fetchNasaApod,
  getDataSourceHealth
} from '../../services/nasaApi';
import {
  Database,
  Flame,
  CloudRain,
  Mountain,
  Snowflake,
  AlertTriangle,
  Compass,
  Download,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Activity,
  Layers,
  CheckCircle2
} from 'lucide-react';

export function IntelligenceView() {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'asteroids' | 'apod' | 'sources'
  const [events, setEvents] = useState([]);
  const [asteroids, setAsteroids] = useState([]);
  const [apod, setApod] = useState(null);
  const [eventFilter, setEventFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dataSourceInfo, setDataSourceInfo] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [eonetRes, neowsRes, apodRes] = await Promise.all([
        fetchNasaEonetEvents(30),
        fetchNasaAsteroids(),
        fetchNasaApod()
      ]);

      setEvents(eonetRes.data || []);
      setAsteroids(neowsRes.data || []);
      setApod(apodRes.data || null);

      setDataSourceInfo({
        eonet: eonetRes,
        neows: neowsRes,
        apod: apodRes
      });
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = events.filter((evt) => {
    if (eventFilter === 'all') return true;
    return evt.category?.toLowerCase().includes(eventFilter.toLowerCase());
  });

  const handleExportData = () => {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      platform: 'TERRAFORGE 2.0 Scientific Intelligence',
      datasets: {
        naturalEventsEONET: filteredEvents,
        nearEarthAsteroidsNeoWs: asteroids,
        apod: apod
      }
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `terraforge-intelligence-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full h-full bg-[#030712] text-gray-200 overflow-y-auto pt-16 px-6 pb-12 font-mono">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
            <Database className="w-4 h-4" />
            <span className="tracking-widest uppercase">REAL-TIME PLANETARY INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Planetary Observation & Scientific Data Center
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Synchronized with NASA Open APIs, NASA EONET v3, NASA NeoWs, and JPL Horizons ephemerides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs hover:bg-white/10 text-gray-300 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{loading ? 'SYNCING...' : 'REFRESH'}</span>
          </button>

          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs hover:bg-cyan-900/80 transition-all font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT REPORT</span>
          </button>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'events', label: 'NASA EONET Events', count: filteredEvents.length },
          { id: 'asteroids', label: 'Near-Earth Asteroids (NeoWs)', count: asteroids.length },
          { id: 'apod', label: 'Astronomy Observation (APOD)' },
          { id: 'sources', label: 'Data Source Health' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded text-xs transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded bg-black/60 text-[10px] text-gray-400 border border-white/10">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto">
        {/* Tab 1: Natural Events */}
        {activeTab === 'events' && (
          <div>
            {/* Filter Pills & Provenance */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white/[0.02] p-3 rounded-lg border border-white/5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 mr-2">CATEGORY:</span>
                {['all', 'wildfires', 'severe storms', 'volcanoes', 'ice'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEventFilter(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] capitalize transition-all ${
                      eventFilter === cat
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>
                  Source: {dataSourceInfo.eonet?.source === 'live_api' ? 'NASA EONET Live' : 'Verified Offline Archive (NASA GSFC)'}
                </span>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-black/60 border border-white/10 hover:border-cyan-500/40 rounded-lg p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                        {evt.category}
                      </span>
                      <span>{new Date(evt.date).toLocaleDateString()}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-2 leading-snug font-sans">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      {evt.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 text-[11px] text-gray-400">
                    <div className="flex justify-between mb-1">
                      <span>COORDINATES:</span>
                      <span className="text-gray-300">
                        {evt.coordinates[1]?.toFixed(2)}° N, {evt.coordinates[0]?.toFixed(2)}° E
                      </span>
                    </div>
                    {evt.magnitudeValue !== 'N/A' && (
                      <div className="flex justify-between">
                        <span>MAGNITUDE:</span>
                        <span className="text-amber-300 font-semibold">
                          {evt.magnitudeValue} {evt.magnitudeUnit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Near-Earth Asteroids */}
        {activeTab === 'asteroids' && (
          <div>
            <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-lg border border-white/5 mb-4 text-xs">
              <span className="text-gray-300">
                NASA NeoWs automated radar tracking of asteroids on close approach orbits to Earth.
              </span>
              <span className="text-gray-400 text-[11px]">
                Source: {dataSourceInfo.neows?.source === 'live_api' ? 'NASA JPL NeoWs Live API' : 'NASA NeoWs Ephemeris Archive'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-gray-400 text-[11px] uppercase border-b border-white/10">
                  <tr>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Est. Diameter</th>
                    <th className="p-3">Rel. Velocity</th>
                    <th className="p-3">Miss Distance</th>
                    <th className="p-3">Lunar Dist. (LD)</th>
                    <th className="p-3">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {asteroids.map((ast) => (
                    <tr key={ast.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-bold text-white">{ast.name}</td>
                      <td className="p-3 text-cyan-300">
                        {ast.estimatedDiameterMinM}m – {ast.estimatedDiameterMaxM}m
                      </td>
                      <td className="p-3 text-gray-300">{ast.relativeVelocityKmS} km/s</td>
                      <td className="p-3 text-gray-300">{ast.missDistanceKm.toLocaleString()} km</td>
                      <td className="p-3 text-gray-300">{ast.missDistanceLunar} LD</td>
                      <td className="p-3">
                        {ast.isPotentiallyHazardous ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            POTENTIALLY HAZARDOUS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            NON-HAZARDOUS
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: APOD */}
        {activeTab === 'apod' && apod && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-black/60 border border-white/10 rounded-lg p-6">
            <div className="overflow-hidden rounded-md border border-white/10 bg-black flex items-center justify-center">
              {apod.media_type === 'image' ? (
                <img
                  src={apod.url}
                  alt={apod.title}
                  className="w-full max-h-[500px] object-contain rounded"
                />
              ) : (
                <iframe
                  src={apod.url}
                  title={apod.title}
                  className="w-full h-80 rounded"
                />
              )}
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-cyan-400 uppercase tracking-widest mb-1">
                  NASA ASTRONOMY PICTURE OF THE DAY ({apod.date})
                </div>
                <h2 className="text-xl font-bold text-white mb-3 font-sans">
                  {apod.title}
                </h2>
                <p className="text-xs text-gray-300 leading-relaxed font-sans mb-4">
                  {apod.explanation}
                </p>
              </div>

              <div className="border-t border-white/10 pt-3 text-[11px] text-gray-400 flex justify-between items-center">
                <span>CREDIT: {apod.copyright || 'NASA / JPL Public Domain'}</span>
                <a
                  href={apod.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>FULL RESOLUTION</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Data Source Health */}
        {activeTab === 'sources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getDataSourceHealth().map((src) => (
              <div
                key={src.source}
                className="bg-black/60 border border-white/10 rounded-lg p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{src.source}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      {src.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">ENDPOINT: {src.endpoint}</div>
                  <div className="text-xs text-gray-400 mb-2">AUTH: {src.authRequired}</div>
                </div>

                <div className="flex items-center justify-between text-[11px] border-t border-white/10 pt-2 text-gray-500">
                  <span>LATENCY: {src.latencyMs} ms</span>
                  <span>LAST SYNC: {src.lastSync}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
