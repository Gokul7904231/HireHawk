import React, { useState, useMemo, useEffect } from 'react';
import { useApplicationsQuery } from '../hooks/useTracker';
import { Application, ApplicationStatus } from '../types';

interface TrackerTableProps {
  onSelectApplication?: (id: string) => void;
}

export default function TrackerTable({ onSelectApplication }: TrackerTableProps) {
  const { data: apps, isLoading } = useApplicationsQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'applied_at' | 'fit_score'>('applied_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Listen for global search events from the persistent Header
  useEffect(() => {
    const handleGlobalSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSearchTerm(customEvent.detail || '');
    };
    window.addEventListener('global-search', handleGlobalSearch);
    return () => {
      window.removeEventListener('global-search', handleGlobalSearch);
    };
  }, []);

  // Status badge styling - HawkHire theme
  const statusStyles: Record<ApplicationStatus, string> = {
    applied: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    interview: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    pending: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  };

  const handleSort = (field: 'applied_at' | 'fit_score') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedApps = useMemo(() => {
    if (!apps) return [];

    let result = [...apps];

    // Filter search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        a => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
      );
    }

    // Filter status
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'applied_at') {
        valA = new Date(a.applied_at).getTime();
        valB = new Date(b.applied_at).getTime();
      } else {
        valA = a.fit_score || 0;
        valB = b.fit_score || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [apps, searchTerm, statusFilter, sortBy, sortOrder]);

  if (isLoading) {
    return (
      <div className="rounded-card border border-outline-variant bg-surface-container-low/40 p-10 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table filters and local controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-outline-variant pb-4">
        {/* Left: Quick search info */}
        <div className="text-xs text-on-surface-variant font-medium">
          {searchTerm ? `Found ${filteredAndSortedApps.length} matches` : 'Showing pipeline applications'}
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wider">Status:</span>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-btn bg-surface-container-lowest/60 border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer font-semibold"
          >
            <option className="bg-surface-container" value="all">All Applications</option>
            <option className="bg-surface-container" value="applied">Applied</option>
            <option className="bg-surface-container" value="interview">Interview</option>
            <option className="bg-surface-container" value="pending">Pending</option>
            <option className="bg-surface-container" value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/40 border-b border-outline-variant text-xs font-headline font-bold tracking-wider text-on-surface-variant uppercase">
                <th className="py-4 px-5">Company / Role</th>
                <th className="py-4 px-5">
                  <button onClick={() => handleSort('fit_score')} className="flex items-center gap-1 hover:text-primary transition-colors font-bold uppercase">
                    <span>Fit Score</span>
                    <span className="material-symbols-outlined text-xs leading-none">swap_vert</span>
                  </button>
                </th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">
                  <button onClick={() => handleSort('applied_at')} className="flex items-center gap-1 hover:text-primary transition-colors font-bold uppercase">
                    <span>Date Applied</span>
                    <span className="material-symbols-outlined text-xs leading-none">swap_vert</span>
                  </button>
                </th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {filteredAndSortedApps.length > 0 ? (
                filteredAndSortedApps.map(app => {
                  const fit = app.fit_score || 0;
                  const companyInitial = app.company.charAt(0).toUpperCase();

                  // Score color determinations
                  let scoreColor = 'bg-error';
                  let scoreText = 'text-error';
                  if (fit >= 85) {
                    scoreColor = 'bg-amber-500'; // Gold
                    scoreText = 'text-amber-400';
                  } else if (fit >= 70) {
                    scoreColor = 'bg-primary'; // Violet
                    scoreText = 'text-primary';
                  }

                  return (
                    <tr
                      key={app.id}
                      onClick={() => onSelectApplication?.(app.id)}
                      className="group cursor-pointer hover:bg-surface-container-low/50 transition-colors duration-200"
                    >
                      {/* Company / Role */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-low border border-outline-variant/60 flex items-center justify-center font-bold text-primary shadow-sm group-hover:bg-surface-container-high transition-colors">
                            {companyInitial}
                          </div>
                          <div>
                            <div className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                              {app.company}
                            </div>
                            <div className="text-xs text-on-surface-variant font-medium mt-0.5">{app.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Fit Score Progress Bar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3 w-40">
                          <span className={`text-xs font-bold font-mono ${scoreText}`}>{fit}%</span>
                          <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${fit}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Status badge pill */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyles[app.status]}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>

                      {/* Applied Date */}
                      <td className="py-4 px-5 text-xs text-on-surface-variant font-medium font-mono">
                        {new Date(app.applied_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => onSelectApplication?.(app.id)}
                            className="p-1.5 rounded-btn border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all flex items-center justify-center shadow"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-sm leading-none">visibility</span>
                          </button>
                          {app.jd_url && (
                            <a
                              href={app.jd_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-btn border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all flex items-center justify-center shadow"
                              title="Open Job Description"
                            >
                              <span className="material-symbols-outlined text-sm leading-none">open_in_new</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-semibold text-on-surface-variant">
                    No applications matching criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination info */}
        <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low/10">
          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Showing {filteredAndSortedApps.length} active application(s)
          </p>
          <div className="flex gap-2">
            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant disabled:opacity-50 flex items-center justify-center border border-outline-variant" disabled={true}>
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
