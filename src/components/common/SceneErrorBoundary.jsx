import React from 'react';

export class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SceneErrorBoundary] Uncaught 3D Scene Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleSafeMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('safe', '1');
    window.location.href = url.toString();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 bg-[#08080c] text-white flex flex-col items-center justify-center p-6 font-mono select-text">
          <div className="max-w-md w-full bg-black/80 border border-red-500/40 p-6 rounded-lg shadow-2xl space-y-4">
            <div className="text-red-400 font-bold text-sm tracking-widest uppercase">
              3D Graphics Engine Encountered an Error
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-sans">
              The WebGL simulation encountered an unexpected rendering error. You can reload the simulator or enter Safe Mode with minimal graphics.
            </p>
            {this.state.error && (
              <pre className="text-[11px] bg-red-950/30 text-red-300 p-3 rounded border border-red-800/30 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-2 px-4 rounded border border-white/20 transition-colors uppercase font-mono"
              >
                Reload
              </button>
              <button
                onClick={this.handleSafeMode}
                className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs py-2 px-4 rounded border border-amber-500/40 transition-colors uppercase font-mono"
              >
                Launch Safe Mode
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
