import React, { useState } from 'react';
import { useAppStore } from '../../state/useAppStore';
import {
  Settings,
  Key,
  Shield,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Sliders,
  ExternalLink,
  Info
} from 'lucide-react';

export function SettingsView() {
  const {
    nasaApiKey,
    setNasaApiKey,
    geminiApiKey,
    setGeminiApiKey,
    units,
    toggleUnits
  } = useAppStore();

  const [localNasaKey, setLocalNasaKey] = useState(nasaApiKey || '');
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey || '');
  const [savedStatus, setSavedStatus] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleSaveKeys = (e) => {
    e.preventDefault();
    setNasaApiKey(localNasaKey.trim());
    setGeminiApiKey(localGeminiKey.trim());
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const handleClearCache = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('terraforge_cache_')) {
          localStorage.removeItem(key);
        }
      });
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full h-full bg-[#030712] text-gray-200 overflow-y-auto pt-16 px-6 pb-12 font-mono">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
          <Settings className="w-4 h-4" />
          <span className="tracking-widest uppercase">SYSTEM PREFERENCES & CREDENTIALS</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
          Platform Configuration & Security
        </h1>
        <p className="text-xs text-gray-400 font-sans mt-0.5">
          Manage API keys, scientific unit preferences, telemetry caches, and version checkpoints.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Credentials Card */}
        <div className="bg-black/60 border border-white/10 rounded-lg p-6">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2 font-sans">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>API Credentials</span>
          </h2>
          <p className="text-xs text-gray-400 font-sans mb-4">
            All API keys are strictly retained in your local browser sandbox and transmitted directly to official provider endpoints.
          </p>

          <form onSubmit={handleSaveKeys} className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-300 font-bold">NASA OPEN API KEY:</label>
                <a
                  href="https://api.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Get NASA API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={localNasaKey}
                onChange={(e) => setLocalNasaKey(e.target.value)}
                placeholder="DEMO_KEY"
                className="w-full bg-white/5 border border-white/10 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Default: DEMO_KEY (Rate-limited to 30 requests/hour and 50/day).
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-300 font-bold">GOOGLE GEMINI API KEY:</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Get Gemini API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={localGeminiKey}
                onChange={(e) => setLocalGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-white/5 border border-white/10 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Required for live Gemini natural-language scientific reasoning.
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedStatus && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Credentials saved successfully.</span>
                </div>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold hover:bg-cyan-900 transition-all text-xs"
              >
                SAVE CREDENTIALS
              </button>
            </div>
          </form>
        </div>

        {/* Preferences & Measurement Units */}
        <div className="bg-black/60 border border-white/10 rounded-lg p-6">
          <h2 className="text-sm font-bold text-white mb-3 font-sans flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Display & System Preferences</span>
          </h2>

          <div className="divide-y divide-white/5 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Measurement Standard</div>
                <div className="text-[11px] text-gray-400">
                  Toggle between International System of Units (SI Metric: km, m/s, °C) and Imperial (mi, mph, °F).
                </div>
              </div>
              <button
                onClick={toggleUnits}
                className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-cyan-300 font-bold hover:bg-white/10"
              >
                {units === 'metric' ? 'METRIC (SI)' : 'IMPERIAL'}
              </button>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Data Cache Management</div>
                <div className="text-[11px] text-gray-400">
                  Flush cached responses from NASA EONET, NeoWs, and APOD to force live synchronization.
                </div>
              </div>
              <button
                onClick={handleClearCache}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{cacheCleared ? 'CACHE FLUSHED!' : 'CLEAR CACHE'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Git Checkpoint & Rollback Guarantee */}
        <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-lg p-6 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
            <Shield className="w-4 h-4" />
            <span>VERSION 1 BACKUP CHECKPOINT</span>
          </div>
          <p className="text-gray-300 leading-relaxed font-sans mb-3">
            Your original Terraforge baseline has been permanently locked and pushed to GitHub as **Version 1** (`v1`, `v1.0`, branch `version-1`, commit `09004ee`).
          </p>
          <div className="text-[11px] text-gray-400 font-mono bg-black/60 p-2.5 rounded border border-white/5">
            Rollback command: <code>git checkout version-1</code> or request in chat: <i>&ldquo;Rollback to version 1&rdquo;</i>
          </div>
        </div>
      </div>
    </div>
  );
}
