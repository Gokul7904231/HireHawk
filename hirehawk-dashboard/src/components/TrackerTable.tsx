import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Eye, ExternalLink } from 'lucide-react';
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

  // Status badge styling - HawkHire theme
  const statusStyles: Record<ApplicationStatus, string> = {
    applied: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
    interview: 'bg-green-100 text-green-700 border-green-200/50',
    rejected: 'bg-error-container text-on-error-container border-error-container/30',
    pending: 'bg-secondary-container text-on-secondary-container border-secondary-container/30'
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
      <div className="rounded-card border border-outline-variant bg-white p-10 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
          <input
            type="text"
            placeholder="Search candidates, roles, or files..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-btn text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status:</span>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-btn bg-white border border-outline-variant text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
          >
            <option value="all">All Applications</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="rounded-card border border-outline-variant bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-xs font-bold tracking-wider text-on-surface-variant uppercase">
                <th className="py-4 px-5">Company / Role</th>
                <th className="py-4 px-5">
                  <button onClick={() => handleSort('fit_score')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span>Fit Score</span>
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">
                  <button onClick={() => handleSort('applied_at')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span>Date Applied</span>
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredAndSortedApps.length > 0 ? (
                filteredAndSortedApps.map(app => {
                  const fit = app.fit_score || 0;
                  
                  // Score color determinations
                  let scoreColor = 'bg-error';
                  let scoreText = 'text-error';
                  let scoreBg = 'bg-error/10';
                  if (fit >= 85) {
                    scoreColor = 'bg-[#B8860B]'; // Gold
                    scoreText = 'text-[#B8860B]';
                    scoreBg = 'bg-[rgba(184,134,11,0.1)]';
                  } else if (fit >= 70) {
                    scoreColor = 'bg-primary'; // Violet
                    scoreText = 'text-primary';
                    scoreBg = 'bg-primary/10';
                  }

                  return (
                    <tr
                      key={app.id}
                      onClick={() => onSelectApplication?.(app.id)}
                      className="group cursor-pointer hover:bg-surface-container-low transition-colors duration-200"
                    >
                      {/* Company / Role */}
                      <td className="py-4 px-5">
                        <div>
                          <div className="font-bold text-on-surface group-hover:text-primary transition-colors">
                            {app.company}
                          </div>
                          <div className="text-xs text-on-surface-variant font-medium mt-0.5">{app.role}</div>
                        </div>
                      </td>

                      {/* Fit Score Progress Bar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3 w-40">
                          <span className={`text-sm font-bold font-mono ${scoreText}`}>{fit}%</span>
                          <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${fit}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Status badge pill */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyles[app.status]}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>

                      {/* Applied Date */}
                      <td className="py-4 px-5 text-sm text-on-surface-variant">
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
                            className="p-1.5 rounded-btn border border-outline-variant bg-white text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          {app.jd_url && (
                            <a
                              href={app.jd_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-btn border border-outline-variant bg-white text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all"
                              title="Open Job Description"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm font-medium text-on-surface-variant">
                    No applications matching criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
