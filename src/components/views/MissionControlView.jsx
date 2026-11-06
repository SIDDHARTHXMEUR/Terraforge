import React, { useState } from 'react';
import { MISSIONS_DATA } from '../../data/missionsData';
import {
  Radio,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowUpRight,
  Shield,
  Layers,
  ExternalLink,
  Satellite
} from 'lucide-react';

export function MissionControlView() {
  const [selectedMissionId, setSelectedMissionId] = useState('artemis');
  const currentMission = MISSIONS_DATA.find((m) => m.id === selectedMissionId) || MISSIONS_DATA[0];

  return (
    <div className="w-full h-full bg-[#030712] text-gray-200 overflow-y-auto pt-16 px-6 pb-12 font-mono select-text">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="tracking-widest uppercase">AEROSPACE MISSION OPERATIONS & TRAJECTORY TRACKING</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Mission Control Operations Center
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Real-time orbital tracking, spacecraft state vectors, and flight timelines synchronized with NASA JPL Horizons.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-white/[0.03] px-3 py-1.5 rounded border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-gray-300">DEEP SPACE NETWORK (DSN) COMM: LOCKED</span>
        </div>
      </div>

      {/* Main Grid: Mission Selector (Left) & Telemetry Inspector (Right) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mission Roster List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            ACTIVE SPACECRAFT ROSTER
          </div>

          {MISSIONS_DATA.map((mission) => {
            const isSelected = selectedMissionId === mission.id;
            return (
              <button
                key={mission.id}
                onClick={() => setSelectedMissionId(mission.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400/60 shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                    : 'bg-black/60 border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-white font-sans">{mission.name}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold border"
                    style={{
                      color: mission.statusColor,
                      borderColor: `${mission.statusColor}60`,
                      backgroundColor: `${mission.statusColor}15`
                    }}
                  >
                    {mission.status}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400 mb-2">{mission.agency} • {mission.type}</div>

                <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/5 pt-2">
                  <span>DEST: {mission.destination.split(',')[0]}</span>
                  <span className="text-cyan-400">{mission.distanceFromEarthKm.toLocaleString()} km</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Spacecraft Telemetry & Timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Spacecraft Overview Card */}
          <div className="bg-black/60 border border-white/10 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
              <div>
                <div className="text-[10px] text-cyan-400 uppercase tracking-widest mb-1">
                  SPACECRAFT TELEMETRY DOSSIER
                </div>
                <h2 className="text-2xl font-bold text-white font-sans">{currentMission.name}</h2>
                <div className="text-xs text-gray-400 mt-0.5">{currentMission.missionPhase}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-500 block">TARGET BODY</span>
                <span className="text-sm font-bold text-cyan-300 uppercase">{currentMission.targetBody}</span>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-sans mb-6">
              {currentMission.description}
            </p>

            {/* Flight Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded">
                <span className="text-[10px] text-gray-500 block">DISTANCE FROM EARTH</span>
                <span className="text-base font-bold text-white">
                  {currentMission.distanceAU
                    ? `${currentMission.distanceAU} AU`
                    : `${(currentMission.distanceFromEarthKm / 1e6).toFixed(2)}M km`}
                </span>
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-3 rounded">
                <span className="text-[10px] text-gray-500 block">CURRENT VELOCITY</span>
                <span className="text-base font-bold text-cyan-300">
                  {currentMission.velocityKmS} km/s
                </span>
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-3 rounded">
                <span className="text-[10px] text-gray-500 block">COMMUNICATION DELAY</span>
                <span className="text-base font-bold text-amber-300">
                  {currentMission.telemetry?.communicationDelaySec
                    ? `${currentMission.telemetry.communicationDelaySec} sec`
                    : `${currentMission.telemetry?.roundTripSignalHours} hrs`}
                </span>
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-3 rounded">
                <span className="text-[10px] text-gray-500 block">LAUNCH DATE</span>
                <span className="text-base font-bold text-gray-200">
                  {currentMission.launchDate}
                </span>
              </div>
            </div>

            {/* Mission Timeline Checklist */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>FLIGHT OPERATIONS TIMELINE</span>
              </h3>

              <div className="space-y-2">
                {currentMission.timeline?.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded bg-white/[0.02] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {step.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : step.status === 'ACTIVE' ? (
                        <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-gray-600" />
                      )}
                      <span className={step.status === 'COMPLETED' ? 'text-gray-300' : 'text-white font-semibold'}>
                        {step.event}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : step.status === 'ACTIVE'
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                          : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

