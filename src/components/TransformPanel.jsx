import React, { useState } from 'react';
import * as THREE from 'three';
import { Move, RotateCw, Maximize2, Layers, Eye, RefreshCw, X, Box, Target, Sliders, Copy, Check } from 'lucide-react';

export function TransformPanel({ transform, updateTransform, resetTransform, onClose }) {
  const [showAllSliders, setShowAllSliders] = useState(false);
  const [copiedMatrix, setCopiedMatrix] = useState(false);
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

  // Compute 4x4 transformation matrix elements
  const computeMatrixElements = () => {
    const t = new THREE.Matrix4().makeTranslation(transform.posX, transform.posY, transform.posZ);
    const rx = new THREE.Matrix4().makeRotationX(transform.rotX);
    const ry = new THREE.Matrix4().makeRotationY(transform.rotY);
    const rz = new THREE.Matrix4().makeRotationZ(transform.rotZ + (23.44 * Math.PI) / 180);
    const r = new THREE.Matrix4().multiplyMatrices(rz, ry).multiply(rx);
    const s = new THREE.Matrix4().makeScale(transform.scaleX, transform.scaleY, transform.scaleZ);
    const m = new THREE.Matrix4().multiplyMatrices(t, r).multiply(s);
    return m.elements;
  };

  const copyMatrixToClipboard = () => {
    const el = computeMatrixElements();
    const formatted = `[
  [${el[0].toFixed(3)}, ${el[4].toFixed(3)}, ${el[8].toFixed(3)}, ${el[12].toFixed(3)}],
  [${el[1].toFixed(3)}, ${el[5].toFixed(3)}, ${el[9].toFixed(3)}, ${el[13].toFixed(3)}],
  [${el[2].toFixed(3)}, ${el[6].toFixed(3)}, ${el[10].toFixed(3)}, ${el[14].toFixed(3)}],
  [${el[3].toFixed(3)}, ${el[7].toFixed(3)}, ${el[11].toFixed(3)}, ${el[15].toFixed(3)}]
]`;
    navigator.clipboard.writeText(formatted);
    setCopiedMatrix(true);
    setTimeout(() => setCopiedMatrix(false), 1800);
  };

  return (
    <div className="solar-drawer bg-[#0b0d11]/95 backdrop-blur-2xl border border-white/10 p-3.5 rounded-2xl text-white space-y-3 w-80 max-h-[calc(100vh-140px)] overflow-y-auto shadow-2xl animate-fade-in custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-gray-200">
              Transform Inspector
            </h3>
            <p className="text-[9px] font-mono text-gray-400">3D Matrix & Gizmo Controls</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetTransform}
            title="Reset All Transformations"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition border border-white/5 hover:border-white/15"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Viewport Gizmo Segmented Controller */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span className="uppercase tracking-wider">3D Gizmo Tool</span>
          <span className="text-cyan-400 font-bold uppercase">{activeMode}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => updateTransform('gizmoMode', 'translate')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition ${
              activeMode === 'translate'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Move className="w-3 h-3 text-red-400" /> Move
          </button>
          <button
            onClick={() => updateTransform('gizmoMode', 'rotate')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition ${
              activeMode === 'rotate'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RotateCw className="w-3 h-3 text-emerald-400" /> Rotate
          </button>
          <button
            onClick={() => updateTransform('gizmoMode', 'scale')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition ${
              activeMode === 'scale'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Maximize2 className="w-3 h-3 text-blue-400" /> Scale
          </button>
        </div>
      </div>

      {/* Quick Action Zero Reset Buttons */}
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={resetPos}
          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-gray-300 hover:text-white border border-white/10 transition flex items-center justify-center gap-1"
        >
          <Target className="w-3 h-3 text-red-400" /> Reset Pos
        </button>
        <button
          onClick={resetRot}
          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-gray-300 hover:text-white border border-white/10 transition flex items-center justify-center gap-1"
        >
          <RotateCw className="w-3 h-3 text-emerald-400" /> Reset Rot
        </button>
        <button
          onClick={resetScale}
          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-gray-300 hover:text-white border border-white/10 transition flex items-center justify-center gap-1"
        >
          <Box className="w-3 h-3 text-blue-400" /> 1.0x Scale
        </button>
      </div>

      {/* Viewport Gizmo & Axes Toggles */}
      <div className="space-y-1 bg-white/[0.02] p-2 rounded-xl border border-white/5">
        <div className="flex items-center justify-between py-1 px-1">
          <span className="text-[11px] font-medium flex items-center gap-2 text-gray-300">
            <Box className="w-3.5 h-3.5 text-cyan-400" /> Viewport 3D Gizmo
          </span>
          <button
            onClick={() => updateTransform('showGizmo', !transform.showGizmo)}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
              transform.showGizmo !== false ? 'bg-cyan-500' : 'bg-white/15'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                transform.showGizmo !== false ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-1 px-1 border-t border-white/5">
          <span className="text-[11px] font-medium flex items-center gap-2 text-gray-300">
            <Eye className="w-3.5 h-3.5 text-emerald-400" /> Local Axes (RGB)
          </span>
          <button
            onClick={() => updateTransform('showAxes', !transform.showAxes)}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
              transform.showAxes ? 'bg-emerald-500' : 'bg-white/15'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                transform.showAxes ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dynamic Axis Controllers: Professional Workstation Style */}
      {(showAllSliders || activeMode === 'translate') && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Position (Translation)</span>
            <span className="text-gray-500">X / Y / Z</span>
          </div>
          <div className="space-y-1 bg-black/40 p-2 rounded-xl border border-white/5">
            {[
              { key: 'posX', label: 'X', color: 'text-red-400', min: -3, max: 3, step: 0.1, val: transform.posX },
              { key: 'posY', label: 'Y', color: 'text-emerald-400', min: -3, max: 3, step: 0.1, val: transform.posY },
              { key: 'posZ', label: 'Z', color: 'text-blue-400', min: -3, max: 3, step: 0.1, val: transform.posZ }
            ].map(({ key, label, color, min, max, step, val }) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`font-mono font-bold text-xs ${color} w-3 text-center`}>{label}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={val}
                  onChange={(e) => updateTransform(key, parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="font-mono text-[10px] text-gray-300 w-10 text-right shrink-0">
                  {val.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(showAllSliders || activeMode === 'rotate') && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Rotation (Degrees)</span>
            <span className="text-gray-500">Rx / Ry / Rz</span>
          </div>
          <div className="space-y-1 bg-black/40 p-2 rounded-xl border border-white/5">
            {[
              { key: 'rotX', label: 'X', color: 'text-red-400', val: transform.rotX },
              { key: 'rotY', label: 'Y', color: 'text-emerald-400', val: transform.rotY },
              { key: 'rotZ', label: 'Z', color: 'text-blue-400', val: transform.rotZ }
            ].map(({ key, label, color, val }) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`font-mono font-bold text-xs ${color} w-3 text-center`}>{label}</span>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.05}
                  value={val}
                  onChange={(e) => updateTransform(key, parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <span className="font-mono text-[10px] text-gray-300 w-10 text-right shrink-0">
                  {(val * (180 / Math.PI)).toFixed(0)}°
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(showAllSliders || activeMode === 'scale') && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Scale Multipliers</span>
            <span className="text-gray-500">Sx / Sy / Sz</span>
          </div>
          <div className="space-y-1 bg-black/40 p-2 rounded-xl border border-white/5">
            {[
              { key: 'scaleX', label: 'X', color: 'text-red-400', val: transform.scaleX },
              { key: 'scaleY', label: 'Y', color: 'text-emerald-400', val: transform.scaleY },
              { key: 'scaleZ', label: 'Z', color: 'text-blue-400', val: transform.scaleZ }
            ].map(({ key, label, color, val }) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`font-mono font-bold text-xs ${color} w-3 text-center`}>{label}</span>
                <input
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.05}
                  value={val}
                  onChange={(e) => updateTransform(key, parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
                <span className="font-mono text-[10px] text-gray-300 w-10 text-right shrink-0">
                  {val.toFixed(2)}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show All Parameters Toggle */}
      <button
        onClick={() => setShowAllSliders(!showAllSliders)}
        className="w-full text-center text-[10px] font-mono text-gray-400 hover:text-white py-1 transition flex items-center justify-center gap-1.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg border border-white/5"
      >
        <Sliders className="w-3 h-3 text-cyan-400" /> {showAllSliders ? 'Show Active Mode Only' : 'Expand All Axes (TRS)'}
      </button>

      {/* Composite Mode Toggle */}
      <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-xl border border-white/5">
        <span className="text-[11px] font-medium flex items-center gap-2 text-gray-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> 4x4 Matrix Output
        </span>
        <button
          onClick={() => updateTransform('composite', !transform.composite)}
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
            transform.composite ? 'bg-cyan-500' : 'bg-white/15'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              transform.composite ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Live 4x4 Matrix Inspector (When Composite Mode is Active) */}
      {transform.composite && (
        <div className="bg-black/80 p-2.5 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase text-gray-400">Composite Matrix M = T·R·S</span>
            <button
              onClick={copyMatrixToClipboard}
              className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 transition"
            >
              {copiedMatrix ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              {copiedMatrix ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
            {(() => {
              const el = computeMatrixElements();
              return [
                el[0], el[4], el[8], el[12],
                el[1], el[5], el[9], el[13],
                el[2], el[6], el[10], el[14],
                el[3], el[7], el[11], el[15]
              ].map((val, idx) => (
                <div key={idx} className="bg-white/[0.04] text-cyan-200 border border-white/5 py-1 rounded font-mono font-semibold">
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
