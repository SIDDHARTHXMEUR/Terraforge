import React from 'react';
import { Navigation } from './components/Navigation';
import { ExplorerView } from './components/views/ExplorerView';
import { IntelligenceView } from './components/views/IntelligenceView';
import { SimulationLabView } from './components/views/SimulationLabView';
import { MissionControlView } from './components/views/MissionControlView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { WorkspaceView } from './components/views/WorkspaceView';
import { SettingsView } from './components/views/SettingsView';
import { OverviewView } from './components/views/OverviewView';
import { useAppStore } from './state/useAppStore';

export default function App() {
  const { activeView } = useAppStore();

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none">
      {/* Top Aerospace Mission Control Navigation Bar */}
      <Navigation />

      {/* Primary 3D Universal Explorer (Persisted in DOM to avoid WebGL context drops) */}
      <div
        className={`w-full h-full ${
          activeView === 'explorer' ? 'block' : 'hidden'
        }`}
      >
        <ExplorerView />
      </div>

      {/* Workspace & Scientific Views */}
      {activeView === 'intelligence' && <IntelligenceView />}
      {activeView === 'simlab' && <SimulationLabView />}
      {activeView === 'missioncontrol' && <MissionControlView />}
      {activeView === 'assistant' && <AIAssistantView />}
      {activeView === 'workspace' && <WorkspaceView />}
      {activeView === 'settings' && <SettingsView />}
      {activeView === 'overview' && <OverviewView />}
    </div>
  );
}
