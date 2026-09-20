import React from 'react';
import * as THREE from 'three';
import { Move, RotateCw, Maximize2, Layers, Eye, RefreshCw, X } from 'lucide-react';

export function TransformPanel({ transform, updateTransform, resetTransform, onClose }) {
  return (
    <div className="solar-drawer bg-[#0f1115]/90 backdrop-blur-2xl border border-white/15 p-4 rounded-2xl text-white space-y-3.5 w-80 shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <h3 className="font-outfit font-semibold text-xs flex items-center gap-2 text-[#00f2fe] uppercase tracking-wider">
          <Move className="w-4 h-4 text-[#00f2fe]" /> Transform Matrix
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={resetTransform}
            title="Reset Transformations"
            className="p-1 rounded-lg bg-white/5 hover:bg-[#00f2fe]/20 text-gray-300 hover:text-[#00f2fe] border border-white/10 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white border border-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Composite Mode Toggle */}
      <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
        <span className="text-xs font-semibold flex items-center gap-2 text-gray-200">
          <Layers className="w-4 h-4 text-[#00f2fe]" /> Composite Mode
        </span>
        <button
          onClick={() => updateTransform('composite', !transform.composite)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
            transform.composite ? 'bg-[#00f2fe]' : 'bg-gray-800'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
              transform.composite ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Axes Helper Toggle */}
      <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
        <span className="text-xs font-semibold flex items-center gap-2 text-gray-200">
          <Eye className="w-4 h-4 text-emerald-400" /> Local Object Axes
        </span>
        <button
          onClick={() => updateTransform('showAxes', !transform.showAxes)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
            transform.showAxes ? 'bg-emerald-500' : 'bg-gray-800'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
              transform.showAxes ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Translate Sliders */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Move className="w-3 h-3 text-[#00f2fe]" /> Translate (X, Y, Z)
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['posX', 'posY', 'posZ'].map((axis, i) => (
            <div key={axis} className="bg-black/60 p-2 rounded-xl text-center border border-white/10">
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
                className="w-full accent-[#00f2fe] cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rotate Sliders */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <RotateCw className="w-3 h-3 text-amber-400" /> Rotate (X, Y, Z)
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['rotX', 'rotY', 'rotZ'].map((axis, i) => (
            <div key={axis} className="bg-black/60 p-2 rounded-xl text-center border border-white/10">
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
                className="w-full accent-amber-400 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scale Sliders */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Maximize2 className="w-3 h-3 text-rose-400" /> Scale (X, Y, Z)
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['scaleX', 'scaleY', 'scaleZ'].map((axis, i) => (
            <div key={axis} className="bg-black/60 p-2 rounded-xl text-center border border-white/10">
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
                className="w-full accent-rose-400 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Live 4x4 Matrix Preview Grid (When Composite Mode is Active) */}
      {transform.composite && (
        <div className="bg-black/80 p-3 rounded-xl border border-[#00f2fe]/40 font-mono text-[9px] text-[#00f2fe] space-y-2 shadow-[0_0_15px_rgba(0,242,254,0.1)]">
          <div className="text-[10px] font-sans font-semibold text-[#00f2fe] uppercase tracking-wider flex items-center justify-between">
            <span>Composite Matrix (M = T × R × S)</span>
            <span className="text-[8px] bg-[#00f2fe]/20 text-cyan-300 px-1.5 py-0.5 rounded border border-[#00f2fe]/30 font-mono">4x4 Float</span>
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
                <div key={idx} className="bg-[#00f2fe]/10 text-cyan-200 border border-[#00f2fe]/20 py-1 px-1 rounded text-center font-mono text-[10px]">
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
