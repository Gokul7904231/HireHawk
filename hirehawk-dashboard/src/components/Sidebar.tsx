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
    <aside className="w-[240px] h-screen sticky top-0 border-r border-outline-variant bg-surface flex flex-col py-stack-lg px-stack-md justify-between z-50 shrink-0">
      <div className="flex flex-col h-full justify-between">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="mb-stack-lg px-2 py-4">
            <h1 className="font-headline text-lg font-bold text-primary leading-tight">HawkHire</h1>
            <p className="font-sans text-on-surface-variant text-[10px] uppercase tracking-widest mt-1 font-semibold">
              Recruitment Workspace
            </p>
          </div>

          {/* Navigation Section */}
          <nav className="space-y-1">
            <button
              id="nav-dashboard"
              onClick={() => onNavigate('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left font-sans text-sm ${
                currentView === 'dashboard'
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <LayoutDashboard size={18} className={currentView === 'dashboard' ? 'text-primary' : 'text-on-surface-variant'} />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-detail"
              onClick={() => onNavigate('app', selectedId || undefined)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left font-sans text-sm ${
                currentView === 'app'
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase size={18} className={currentView === 'app' ? 'text-primary' : 'text-on-surface-variant'} />
                <span>Applications</span>
              </div>
              {selectedId && (
                <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono font-semibold">
                  Active
                </span>
              )}
            </button>

            <button
              id="nav-settings"
              onClick={() => onNavigate('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left font-sans text-sm ${
                currentView === 'settings'
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <Settings size={18} className={currentView === 'settings' ? 'text-primary' : 'text-on-surface-variant'} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Profile and System Status */}
        <div className="space-y-4">
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-error-container/20 transition-all focus:outline-none"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}

          {/* User Profile Card */}
          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <img
                alt="Recruiter Profile"
                className="w-8 h-8 rounded-full border border-outline-variant"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLzpY2TMvvQoXNFJjvVdx3MWFal2qkx5wd-R8Wcly6VecB2WrOvgRJJDYdUWmKsiO2n74bIWj01GI7tF5gZJHJq2_wUjYmOtEUf4jnXt6ZMZGeKTqrjQqZb1zAngw50vXbA4Us_hk1vCDHTuC2O1b2xav_CL5ar8CdqS5HnFV0lFVHHMqoZbEBGqk8I-JoNgUIQVVHEYaD-OHCjpGlbRwomUZLPbTyxXWZQG0_IVqiCaFdtEMHvyypgGc0sHEGUxJNFvTDzJRyS78"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-on-surface truncate">Alex Sterling</p>
                <p className="text-[10px] text-on-surface-variant truncate">Lead Recruiter</p>
              </div>
            </div>
          </div>

          {/* MCP status info box */}
          <div className="p-3 rounded-xl bg-white border border-outline-variant/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className={isMcpHealthy ? "text-emerald-500" : "text-amber-500 animate-pulse"} size={14} />
                <div className="overflow-hidden">
                  <div className="text-[10px] font-bold text-on-surface truncate">MCP Cluster</div>
                  <div className="text-[8px] text-on-surface-variant truncate">
                    {isMcpHealthy ? "All nodes active" : "Checking servers..."}
                  </div>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${isMcpHealthy ? "bg-emerald-500 shadow-md shadow-emerald-500/20" : "bg-amber-500 animate-ping"}`} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
