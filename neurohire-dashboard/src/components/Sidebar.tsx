import React from 'react';
import { LayoutDashboard, Settings, Briefcase, Activity, LogOut } from 'lucide-react';
import { useMcpStatusQuery } from '../hooks/useTracker';

interface SidebarProps {
  currentView: 'dashboard' | 'app' | 'settings';
  onNavigate: (view: 'dashboard' | 'app' | 'settings', id?: string) => void;
  selectedId: string | null;
  onLogout?: () => void;
}

export default function Sidebar({ currentView, onNavigate, selectedId, onLogout }: SidebarProps) {
  const { data: mcpStatus } = useMcpStatusQuery();

  const isMcpHealthy = mcpStatus 
    ? Object.values(mcpStatus).every(status => status === 'healthy')
    : false;

  return (
    <aside className="w-64 border-r border-[#1e293b] bg-[#0b0f19] flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col h-full justify-between">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1e293b] bg-[#070b13]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
              NH
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-white uppercase">NeuroHire</h1>
              <span className="text-[10px] text-purple-400 font-medium tracking-widest uppercase">Agentic Recruiter</span>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="p-4 space-y-1.5 flex-1">
            <button
              id="nav-dashboard"
              onClick={() => onNavigate('dashboard')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === 'dashboard'
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121b2d] border border-transparent'
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-detail"
              onClick={() => onNavigate('app', selectedId || undefined)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === 'app'
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121b2d] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Briefcase size={18} />
                <span>Application Details</span>
              </div>
              {selectedId && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Active
                </span>
              )}
            </button>

            <button
              id="nav-settings"
              onClick={() => onNavigate('settings')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === 'settings'
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121b2d] border border-transparent'
              }`}
            >
              <Settings size={18} />
              <span>Candidate Profile</span>
            </button>
          </nav>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <div className="p-4 border-t border-[#1e293b]/50">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent transition-all duration-200 focus:outline-none"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* System Status Indicators */}
      <div className="p-4 border-t border-[#1e293b] bg-[#070b13]">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b0f19] border border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <Activity className={isMcpHealthy ? "text-emerald-500" : "text-amber-500 animate-pulse"} size={16} />
            <div>
              <div className="text-[11px] font-semibold text-slate-300">MCP Orchestrator</div>
              <div className="text-[9px] text-slate-500">
                {isMcpHealthy ? "All systems active" : "Checking servers..."}
              </div>
            </div>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${isMcpHealthy ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-amber-500 animate-ping"}`} />
        </div>
      </div>
    </aside>
  );
}
