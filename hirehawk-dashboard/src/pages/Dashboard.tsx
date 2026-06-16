import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatusCard from '../components/StatusCard';
import TrackerTable from '../components/TrackerTable';
import AgentPanel from '../components/AgentPanel';
import { useStatsQuery, useApplicationsQuery } from '../hooks/useTracker';

interface DashboardProps {
  currentView: 'dashboard' | 'app' | 'settings';
  onNavigate: (view: 'dashboard' | 'app' | 'settings', id?: string) => void;
  selectedId: string | null;
  onLogout?: () => void;
}

export default function Dashboard({ currentView, onNavigate, selectedId, onLogout }: DashboardProps) {
  const { data: stats } = useStatsQuery();
  const { data: apps } = useApplicationsQuery();

  // Find apps that haven't had activity in 7 days (follow-ups)
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const followupsCount = apps
    ? apps.filter(a => new Date(a.last_activity).getTime() < cutoff && a.status !== 'rejected').length
    : 0;

  return (
    <div className="flex h-screen bg-[#09090b] text-white font-sans overflow-hidden">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        selectedId={selectedId}
        onLogout={onLogout}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 py-6">
        <Header title="Recruitment Workspace" subtitle="ACTIVE APPLICATIONS & HISTORIC METRICS" />

        <div className="flex-1 overflow-y-auto space-y-8 mt-6 pr-2">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatusCard
              title="TOTAL APPLICATIONS"
              value={stats?.total || 0}
              sub={`${stats?.by_status?.applied || 0} applied | ${stats?.by_status?.pending || 0} pending`}
              icon="briefcase"
            />
            <StatusCard
              title="INTERVIEWS SCHEDULED"
              value={stats?.interviews || 0}
              sub="Live pipeline activity"
              icon="calendar"
            />
            <StatusCard
              title="AVERAGE FIT SCORE"
              value={stats?.avg_fit_score ? `${stats.avg_fit_score}%` : "0%"}
              sub="Computed by agent scorer"
              icon="star"
            />
            <StatusCard
              title="FOLLOW-UPS DUE"
              value={followupsCount}
              sub="> 7 days since last update"
              icon="alert"
            />
          </div>

          {/* Bottom Grid Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Center: Table */}
            <div className="lg:col-span-2 bg-[#121214] border border-[#1f1f23] rounded-xl p-6">
              <h3 className="text-sm font-semibold tracking-wider text-gray-400 mb-4 uppercase">Application Tracker</h3>
              <TrackerTable onSelectApplication={(id) => onNavigate('app', id)} />
            </div>

            {/* Right: Agent Console */}
            <div className="bg-[#121214] border border-[#1f1f23] rounded-xl p-6">
              <h3 className="text-sm font-semibold tracking-wider text-purple-400 mb-4 uppercase">Live Agent Stream</h3>
              <AgentPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

