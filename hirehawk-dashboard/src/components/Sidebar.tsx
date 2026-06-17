import React from 'react';
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

  const userName = localStorage.getItem('hirehawk_user_name') || 'Alex Sterling';
  const userRole = localStorage.getItem('hirehawk_user_role') || 'Lead Recruiter';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <aside className="w-[240px] h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface flex flex-col py-stack-lg px-stack-md z-50 justify-between">
      <div className="flex flex-col h-full justify-between">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="mb-8 px-2">
            <h1 className="font-headline text-xl font-extrabold tracking-wider bg-gradient-to-r from-primary via-indigo-400 to-cyan-400 bg-clip-text text-transparent leading-tight">HawkHire</h1>
            <p className="font-sans text-on-surface-variant text-[9px] uppercase tracking-widest mt-1 font-semibold">
              Recruitment Workspace
            </p>
          </div>

          {/* Navigation Section */}
          <nav className="space-y-1">
            <button
              id="nav-dashboard"
              onClick={() => onNavigate('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left font-sans text-sm ${
                currentView === 'dashboard'
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low/80'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/40'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${currentView === 'dashboard' ? 'text-primary' : 'text-on-surface-variant'}`}>dashboard</span>
              <span>Dashboard</span>
            </button>

            <button
              id="nav-detail"
              onClick={() => onNavigate('app', selectedId || undefined)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left font-sans text-sm ${
                currentView === 'app'
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low/80'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-lg ${currentView === 'app' ? 'text-primary' : 'text-on-surface-variant'}`}>description</span>
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left font-sans text-sm ${
                currentView === 'settings'
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low/80'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/40'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${currentView === 'settings' ? 'text-primary' : 'text-on-surface-variant'}`}>settings</span>
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
              <span className="material-symbols-outlined text-base text-error">logout</span>
              <span>Sign Out</span>
            </button>
          )}

          {/* User Profile Monogram Card */}
          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold text-xs">
                {userInitials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-on-surface truncate">{userName}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{userRole}</p>
              </div>
            </div>
          </div>

          {/* MCP status info box */}
          <div className="p-3 rounded-xl bg-surface-container-low/40 border border-outline-variant/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-base ${isMcpHealthy ? "text-emerald-400" : "text-amber-400 animate-pulse"}`}>
                  dns
                </span>
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
