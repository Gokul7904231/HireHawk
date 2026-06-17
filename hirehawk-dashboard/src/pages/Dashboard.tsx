import React from 'react';
import MetricCards from '../components/MetricCards';
import TrackerTable from '../components/TrackerTable';
import AgentPanel from '../components/AgentPanel';

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'app' | 'settings', id?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Page Header (inside Dashboard canvas) */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <div>
          <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">Workspace Dashboard</h1>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mt-1">
            Good morning, Alex. You have 12 follow-ups today.
          </p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <MetricCards />

      {/* Bottom Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Left/Center: Table (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-low/40 backdrop-blur-md border border-outline-variant rounded-card p-6 shadow-xl">
          <h3 className="font-headline text-xs font-bold tracking-wider text-on-surface-variant mb-4 uppercase">Application Tracker</h3>
          <TrackerTable onSelectApplication={(id) => onNavigate('app', id)} />
        </div>

        {/* Right: Agent Console (5 cols) */}
        <div className="lg:col-span-5 agent-gradient border border-outline-variant rounded-card p-6 shadow-2xl flex flex-col h-full min-h-[500px]">
          <h3 className="font-headline text-xs font-bold tracking-wider text-white mb-4 uppercase">Live Agent Stream</h3>
          <AgentPanel onApproveSuccess={(id) => onNavigate('app', id)} />
        </div>
      </div>
    </div>
  );
}
