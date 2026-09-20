import React, { useState } from 'react';
import * as THREE from 'three';
import { Move, RotateCw, Maximize2, Layers, Eye, RefreshCw, X, Box, Target, Sliders } from 'lucide-react';

export function TransformPanel({ transform, updateTransform, resetTransform, onClose }) {
  const [showAllSliders, setShowAllSliders] = useState(false);
  const activeMode = transform.gizmoMode || 'translate';

  const resetPos = () => {
    updateTransform('posX', 0);
    updateTransform('posY', 0);
    updateTransform('posZ', 0);
  };

  const resetRot = () => {
    updateTransform('rotX', 0);
    updateTransform('rotY', 0);
    updateTransform('rotZ', 0);
  };

  const resetScale = () => {
    updateTransform('scaleX', 1);
    updateTransform('scaleY', 1);
    updateTransform('scaleZ', 1);
  };

  return (
    <div className="solar-drawer bg-[#0f1115]/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl text-white space-y-3.5 w-80 shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <h3 className="font-outfit font-bold text-xs flex items-center gap-2 text-[#00f2fe] uppercase tracking-wider">
          <Move className="w-4 h-4 text-[#00f2fe]" /> 3D Transform & Gizmo
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={resetTransform}
            title="Reset All Transformations"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#00f2fe]/20 text-gray-300 hover:text-[#00f2fe] transition border border-transparent hover:border-[#00f2fe]/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Viewport Gizmo Mode Switcher Tabs */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>Active 3D Gizmo Mode</span>
          <span className="text-[#00f2fe] font-bold uppercase">{activeMode}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => updateTransform('gizmoMode', 'translate')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeMode === 'translate'
                ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/50 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Move className="w-3.5 h-3.5" /> Move
          </button>
          <button
            onClick={() => updateTransform('gizmoMode', 'rotate')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeMode === 'rotate'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" /> Rotate
          </button>
          <button
            onClick={() => updateTransform('gizmoMode', 'scale')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeMode === 'scale'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" /> Scale
          </button>
        </div>
      </div>

      {/* Quick Action Reset Badges */}
      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
        <button
          onClick={resetPos}
          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-[#00f2fe]/20 text-[10px] font-mono text-gray-300 hover:text-[#00f2fe] border border-white/10 transition flex items-center justify-center gap-1"
        >
          <Target className="w-3 h-3 text-[#00f2fe]" /> Zero Pos
        </button>
        <button
          onClick={resetRot}
          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-amber-500/20 text-[10px] font-mono text-gray-300 hover:text-amber-300 border border-white/10 transition flex items-center justify-center gap-1"
        >
          <RotateCw className="w-3 h-3 text-amber-400" /> Zero Spin
        </button>
        <button
          onClick={resetScale}
          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-[10px] font-mono text-gray-300 hover:text-rose-300 border border-white/10 transition flex items-center justify-center gap-1"
        >
          <Box className="w-3 h-3 text-rose-400" /> 1.0x Scale
        </button>
      </div>

      {/* Viewport 3D Handle Toggle & Axes Helper */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] p-2 rounded-xl border border-white/[0.06] transition">
          <span className="text-xs font-semibold flex items-center gap-2 text-gray-200">
            <Box className="w-4 h-4 text-[#00f2fe]" /> 3D Viewport Gizmo
          </span>
          <button
            onClick={() => updateTransform('showGizmo', !transform.showGizmo)}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${
              transform.showGizmo !== false ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(0,242,254,0.4)]' : 'bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                transform.showGizmo !== false ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] p-2 rounded-xl border border-white/[0.06] transition">
          <span className="text-xs font-semibold flex items-center gap-2 text-gray-200">
            <Eye className="w-4 h-4 text-emerald-400" /> Local Object Axes
          </span>
          <button
            onClick={() => updateTransform('showAxes', !transform.showAxes)}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${
              transform.showAxes ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                transform.showAxes ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dynamic Sliders Section */}
      {(showAllSliders || activeMode === 'translate') && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Move className="w-3.5 h-3.5 text-[#00f2fe]" /> Translate (X, Y, Z)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['posX', 'posY', 'posZ'].map((axis, i) => (
              <div key={axis} className="bg-white/[0.03] hover:bg-white/[0.06] p-2 rounded-xl text-center border border-white/[0.06] transition">
                <label className="text-[10px] font-mono text-[#00f2fe] uppercase block mb-1 font-bold">
                  {['X', 'Y', 'Z'][i]}: {transform[axis].toFixed(1)}
                </label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={transform[axis]}
                  onChange={(e) => updateTransform(axis, parseFloat(e.target.value))}
                  className="w-full accent-[#00f2fe] cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {(showAllSliders || activeMode === 'rotate') && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5"><RotateCw className="w-3.5 h-3.5 text-amber-400" /> Rotate (X, Y, Z)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['rotX', 'rotY', 'rotZ'].map((axis, i) => (
              <div key={axis} className="bg-white/[0.03] hover:bg-white/[0.06] p-2 rounded-xl text-center border border-white/[0.06] transition">
                <label className="text-[10px] font-mono text-amber-300 uppercase block mb-1 font-bold">
                  {['X', 'Y', 'Z'][i]}: {(transform[axis] * (180 / Math.PI)).toFixed(0)}°
                </label>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step="0.05"
                  value={transform[axis]}
                  onChange={(e) => updateTransform(axis, parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {(showAllSliders || activeMode === 'scale') && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Maximize2 className="w-3.5 h-3.5 text-rose-400" /> Scale (X, Y, Z)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['scaleX', 'scaleY', 'scaleZ'].map((axis, i) => (
              <div key={axis} className="bg-white/[0.03] hover:bg-white/[0.06] p-2 rounded-xl text-center border border-white/[0.06] transition">
                <label className="text-[10px] font-mono text-rose-300 uppercase block mb-1 font-bold">
                  {['X', 'Y', 'Z'][i]}: {transform[axis].toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={transform[axis]}
                  onChange={(e) => updateTransform(axis, parseFloat(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show All Parameters Toggle */}
      <button
        onClick={() => setShowAllSliders(!showAllSliders)}
        className="w-full text-center text-[10px] font-mono text-gray-400 hover:text-white py-1 transition flex items-center justify-center gap-1"
      >
        <Sliders className="w-3 h-3" /> {showAllSliders ? 'Show Active Mode Only' : 'Expand All Sliders'}
      </button>

      {/* Composite Mode Toggle */}
      <div className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] p-2 rounded-xl border border-white/[0.06] transition">
        <span className="text-xs font-semibold flex items-center gap-2 text-gray-200">
          <Layers className="w-4 h-4 text-[#00f2fe]" /> Composite Mode
        </span>
        <button
          onClick={() => updateTransform('composite', !transform.composite)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${
            transform.composite ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(0,242,254,0.4)]' : 'bg-white/10'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              transform.composite ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Live 4x4 Matrix Preview Grid (When Composite Mode is Active) */}
      {transform.composite && (
        <div className="bg-black/90 p-3 rounded-xl border border-[#00f2fe]/30 font-mono text-[9px] text-[#00f2fe] space-y-2 shadow-[0_0_20px_rgba(0,242,254,0.12)]">
          <div className="text-[10px] font-sans font-semibold text-[#00f2fe] uppercase tracking-wider flex items-center justify-between">
            <span>Composite Matrix (M = T × R × S)</span>
            <span className="text-[8px] bg-[#00f2fe]/15 text-cyan-300 px-1.5 py-0.5 rounded border border-[#00f2fe]/30 font-mono font-bold">4x4 Float</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center bg-black/60 p-1.5 rounded-lg border border-white/10 font-mono">
            {(() => {
              const t = new THREE.Matrix4().makeTranslation(transform.posX, transform.posY, transform.posZ);
              const rx = new THREE.Matrix4().makeRotationX(transform.rotX);
              const ry = new THREE.Matrix4().makeRotationY(transform.rotY);
              const rz = new THREE.Matrix4().makeRotationZ(transform.rotZ + (23.44 * Math.PI) / 180);
              const r = new THREE.Matrix4().multiplyMatrices(rz, ry).multiply(rx);
              const s = new THREE.Matrix4().makeScale(transform.scaleX, transform.scaleY, transform.scaleZ);
              const m = new THREE.Matrix4().multiplyMatrices(t, r).multiply(s);
              const el = m.elements;
              return [
                el[0], el[4], el[8], el[12],
                el[1], el[5], el[9], el[13],
                el[2], el[6], el[10], el[14],
                el[3], el[7], el[11], el[15]
              ].map((val, idx) => (
                <div key={idx} className="bg-[#00f2fe]/10 text-cyan-200 border border-[#00f2fe]/20 py-1 px-1 rounded text-center font-mono text-[10px] font-bold shadow-inner">
                  {val.toFixed(2)}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
