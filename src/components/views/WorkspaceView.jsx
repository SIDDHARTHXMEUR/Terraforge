import React from 'react';
import { useAppStore } from '../../state/useAppStore';
import { getDataSourceHealth } from '../../services/nasaApi';
import {
  LayoutDashboard,
  Activity,
  Database,
  FlaskConical,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download
} from 'lucide-react';

export function WorkspaceView() {
  const { setActiveView, simulationHistory, selectedBody } = useAppStore();
  const dataHealth = getDataSourceHealth();

  return (
    <div className="w-full h-full bg-[#030712] text-gray-200 overflow-y-auto pt-16 px-6 pb-12 font-mono">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span className="tracking-widest uppercase">EXECUTIVE SCIENTIFIC DASHBOARD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Planetary Analytics & Simulation Workspace
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Unified telemetry console consolidating planetary observation feeds, simulation histories, and data health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('simlab')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs hover:bg-cyan-900/80 font-bold"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>LAUNCH SIMULATION</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => setActiveView('explorer')}
            className="bg-black/60 border border-white/10 hover:border-cyan-500/50 p-5 rounded-lg cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <Compass className="w-5 h-5 text-cyan-400" />
                <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-300 transition-colors" />
              </div>
              <h3 className="text-base font-bold text-white mb-1 font-sans">3D Universal Explorer</h3>
              <p className="text-xs text-gray-400 font-sans">
                Full-screen 3D exploration of all 9 major solar system bodies with custom GLSL atmospheric shaders.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-cyan-400">
              EXPLORE ACTIVE SYSTEM →
            </div>
          </div>

          <div
            onClick={() => setActiveView('simlab')}
            className="bg-black/60 border border-white/10 hover:border-cyan-500/50 p-5 rounded-lg cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-300 transition-colors" />
              </div>
              <h3 className="text-base font-bold text-white mb-1 font-sans">Scientific Simulation Lab</h3>
              <p className="text-xs text-gray-400 font-sans">
                Multi-layer thermodynamic climate forcing, asteroid impact cratering physics, and Keplerian orbital solvers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-cyan-400">
              RUN PHYSICS SIMULATION →
            </div>
          </div>

          <div
            onClick={() => setActiveView('intelligence')}
            className="bg-black/60 border border-white/10 hover:border-cyan-500/50 p-5 rounded-lg cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <Database className="w-5 h-5 text-cyan-400" />
                <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-300 transition-colors" />
              </div>
              <h3 className="text-base font-bold text-white mb-1 font-sans">Planetary Intelligence</h3>
              <p className="text-xs text-gray-400 font-sans">
                Live natural event monitoring (EONET), near-Earth hazardous asteroid radars (NeoWs), and APOD.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-cyan-400">
              INSPECT LIVE FEEDS →
            </div>
          </div>
        </div>

        {/* Lower Two Columns: Data Source Health (Left) & Simulation History Log (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Source Health */}
          <div className="bg-black/60 border border-white/10 rounded-lg p-5">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DATA PIPELINE HEALTH & PROVENANCE</span>
            </h2>

            <div className="space-y-2.5">
              {dataHealth.map((src) => (
                <div
                  key={src.source}
                  className="flex items-center justify-between p-3 rounded bg-white/[0.02] border border-white/5 text-xs"
                >
                  <div>
                    <div className="font-bold text-white font-sans">{src.source}</div>
                    <div className="text-[10px] text-gray-500">{src.endpoint}</div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      {src.status} ({src.latencyMs}ms)
                    </span>
                    <div className="text-[10px] text-gray-500 mt-0.5">Sync: {src.lastSync}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Run History */}
          <div className="bg-black/60 border border-white/10 rounded-lg p-5">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>RECENT SIMULATION RUNS</span>
            </h2>

            {simulationHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No simulations executed in this session yet. Launch a run in the Simulation Lab!
              </div>
            ) : (
              <div className="space-y-2">
                {simulationHistory.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white uppercase">{rec.module} SIMULATION</span>
                      <div className="text-[10px] text-gray-500">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px]">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

