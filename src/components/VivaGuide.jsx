import React from 'react';
import { BookOpen, X, CheckCircle2, ChevronRight, MessageSquareQuote } from 'lucide-react';

export function VivaGuide({ onClose }) {
  const syllabusItems = [
    { topic: '3D Modelling', location: 'Planet, cloud, and atmosphere spheres' },
    { topic: 'Translation / Rotation / Scaling', location: 'Transform Panel sliders (X, Y, Z)' },
    { topic: 'Composite Transformation', location: 'Transform Panel Composite Mode (T × R × S matrix)' },
    { topic: 'Viewing Transformation', location: 'OrbitControls (orbit, zoom, pan, damping)' },
    { topic: 'Perspective / Orthographic Projection', location: 'Camera Projection Toggle' },
    { topic: 'Texture Mapping', location: 'Procedural Earth, Ice, Desert & Cloud maps' },
    { topic: 'Lighting / Illumination / Shading', location: 'Sun DirectionalLight & day/night line' },
    { topic: 'Animation / Motion Specification', location: 'Continuous planet/cloud spin + speed slider' },
    { topic: 'Interpolation / Tweening', location: 'Preset 1.5s smooth lerp transitions' },
    { topic: 'Real-time Rendering', location: 'React Three Fiber (WebGL) 60FPS render loop' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="solar-drawer border border-white/20 rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 text-white space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00f2fe]/20 text-[#00f2fe]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-outfit font-bold text-lg text-white">CGM Viva & Syllabus Guide</h2>
              <p className="text-xs text-gray-400">RTU Computer Graphics & Multimedia Lab Project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viva One-Liner Quote */}
        <div className="bg-black/60 p-4 rounded-xl border border-[#00f2fe]/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00f2fe] uppercase tracking-wider">
            <MessageSquareQuote className="w-4 h-4 text-[#00f2fe]" /> Viva Answer
          </div>
          <p className="text-xs italic text-gray-200 leading-relaxed">
            "This is an interactive 3D graphics environment built around a simplified planetary simulation. We used it to demonstrate modelling, texture mapping, transformations and composite transformation, viewing and projection, lighting and illumination, animation, and interpolation — all in real time via WebGL. The simulation relationships are intentionally simplified since the goal is a Computer Graphics demonstration, not scientific accuracy."
          </p>
        </div>

        {/* Syllabus Checklist */}
        <div className="space-y-2">
          <h3 className="font-outfit font-semibold text-xs text-gray-400 uppercase tracking-wider">
            Syllabus Topics Verified (10/10)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {syllabusItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00f2fe] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">{item.topic}</div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <ChevronRight className="w-3 h-3 text-[#00f2fe] shrink-0" /> {item.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#00f2fe] text-black font-bold text-xs hover:bg-cyan-300 transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
