import React, { useState, useEffect } from 'react';
import { MousePointer, Sparkles, X } from 'lucide-react';

export function FirstLoadHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-xl border border-[#00f2fe]/40 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 font-sans text-xs animate-fade-in">
      <Sparkles className="w-4 h-4 text-[#00f2fe] animate-pulse" />
      <span className="text-gray-200">
        <strong className="text-white font-semibold">Interactive Viewport:</strong> Drag to orbit • Scroll to zoom • Press <kbd className="px-1.5 py-0.5 bg-white/15 rounded text-[10px] font-mono text-[#00f2fe]">Space</kbd> play/pause • <kbd className="px-1.5 py-0.5 bg-white/15 rounded text-[10px] font-mono text-[#00f2fe]">1-3</kbd> presets
      </span>
      <button
        onClick={() => setVisible(false)}
        className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
