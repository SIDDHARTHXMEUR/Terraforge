import React from 'react';
import { useAppStore } from '../../state/useAppStore';
import {
  Globe,
  Compass,
  Database,
  FlaskConical,
  Radio,
  Bot,
  Layers,
  Code,
  ShieldCheck,
  Cpu,
  ArrowRight
} from 'lucide-react';

export function OverviewView() {
  const { setActiveView } = useAppStore();

  const pillars = [
    {
      id: 'explorer',
      title: '1. EXPLORE',
      tagline: 'Interactive 3D Planetary Exploration',
      desc: 'Real-time WebGL rendering of 9 celestial bodies featuring custom GLSL atmospheric scattering, day/night terminators, axial tilts, and planetary rings.',
      icon: Compass,
      view: 'explorer'
    },
    {
      id: 'intelligence',
      title: '2. ANALYZE',
      tagline: 'Real Scientific Datasets & Planetary Intelligence',
      desc: 'Synchronized with NASA EONET v3 natural hazard tracking, NASA NeoWs near-Earth asteroid radar, and JPL Horizons ephemerides with zero fabricated data.',
      icon: Database,
      view: 'intelligence'
    },
    {
      id: 'simlab',
      title: '3. SIMULATE',
      tagline: 'Interactive Scientific Computation Lab',
      desc: 'Deterministic physics engines for multi-layer climate radiative forcing, asteroid impact cratering scaling (Collins et al.), and Keplerian two-body mechanics.',
      icon: FlaskConical,
      view: 'simlab'
    },
    {
      id: 'assistant',
      title: '4. ASSIST',
      tagline: 'AI-Powered Scientific Assistant',
      desc: 'Gemini cognitive assistant with direct access to Terraforge state, verified equations, and deterministic calculations without LLM hallucinations.',
      icon: Bot,
      view: 'assistant'
    }
  ];

  return (
    <div className="w-full h-full bg-[#030712] text-gray-200 overflow-y-auto pt-16 px-6 pb-16 font-mono select-text">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto py-12 border-b border-white/10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-4 shadow-[0_0_15px_rgba(0,242,254,0.25)]">
          <Globe className="w-3.5 h-3.5 animate-spin" />
          <span>TERRAFORGE 2.0 • ENTERPRISE SCIENTIFIC RELEASE</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-sans max-w-3xl mx-auto leading-tight mb-4">
          Planetary Intelligence & Scientific Simulation Platform
        </h1>

        <p className="text-sm text-cyan-400 font-semibold tracking-widest uppercase mb-6">
          EXPLORE. ANALYZE. SIMULATE.
        </p>

        <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed font-sans mb-8">
          Engineered for college demonstrations, national hackathons, and research portfolios. Combining high-performance WebGL hardware shaders with NASA observational telemetry and verifiable astrophysical computation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveView('explorer')}
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(0,242,254,0.4)]"
          >
            <span>LAUNCH 3D EXPLORER</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveView('simlab')}
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all"
          >
            <span>OPEN SIMULATION LAB</span>
          </button>
        </div>
      </div>

      {/* Four Pillars */}
      <div className="max-w-6xl mx-auto py-12 border-b border-white/10">
        <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest text-center mb-8">
          THE FOUR ARCHITECTURAL PILLARS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pil) => {
            const Icon = pil.icon;
            return (
              <div
                key={pil.id}
                onClick={() => setActiveView(pil.view)}
                className="p-6 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-cyan-400 tracking-wider">{pil.title}</span>
                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-cyan-300 transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 font-sans">{pil.tagline}</h3>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed">{pil.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-cyan-400 flex items-center gap-1">
                  <span>ENTER MODULE</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Architecture & Syllabus Mapping */}
      <div className="max-w-6xl mx-auto py-12 space-y-6">
        <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest text-center mb-4">
          SCIENTIFIC COMPUTING & GRAPHICS ARCHITECTURE
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
          <div className="bg-black/60 border border-white/10 p-5 rounded-lg">
            <Cpu className="w-5 h-5 text-cyan-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-2 font-mono">1. Custom GLSL Shaders</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Multi-texture blending for Earth (albedo, bump, landmask, nightlights) combined with temperature-driven procedural color ramps (-60°C cryo-ice to +60°C desert) and view-dependent atmospheric limb Fresnel scattering.
            </p>
          </div>

          <div className="bg-black/60 border border-white/10 p-5 rounded-lg">
            <Orbit className="w-5 h-5 text-cyan-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-2 font-mono">2. Keplerian Astrodynamics</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Two-body orbital mechanics solved using the Vis-Viva equation: <code>v = √(μ(2/r - 1/a))</code> and Kepler&apos;s Third Law: <code>T = 2π√(a³/μ)</code> with exact 27.3:1 Moon tidal locking.
            </p>
          </div>

          <div className="bg-black/60 border border-white/10 p-5 rounded-lg">
            <FlaskConical className="w-5 h-5 text-cyan-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-2 font-mono">3. Deterministic Scaling</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Asteroid impact cratering modeled via Collins, Melosh & Marcus (2005) dimensionless pi-group scaling and climate radiative forcing via Myhre et al. (1998): <code>ΔF = 5.35 ln(C/C₀)</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Orbit(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-30 12 12)" />
    </svg>
  );
}
