import React from 'react';
import { useStatsQuery, useApplicationsQuery } from '../hooks/useTracker';

export default function MetricCards() {
  const { data: stats, isLoading } = useStatsQuery();
  const { data: apps } = useApplicationsQuery();

  // Find apps that haven't had activity in 7 days (follow-ups)
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const followupsCount = apps
    ? apps.filter(a => new Date(a.last_activity).getTime() < cutoff && a.status !== 'rejected').length
    : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-surface-container-low border border-outline-variant animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Applications",
      value: stats?.total || 0,
      icon: "description",
      bgClass: "bg-primary-container/10 text-primary",
      gradient: "from-primary to-indigo-500",
      description: `${stats?.by_status?.applied || 0} applied | ${stats?.by_status?.pending || 0} pending`
    },
    {
      title: "Interviews Scheduled",
      value: stats?.interviews || 0,
      icon: "event_available",
      bgClass: "bg-emerald-500/10 text-emerald-400",
      gradient: "from-emerald-600 to-teal-500",
      description: "Live pipeline activity"
    },
    {
      title: "Average Fit Score",
      value: stats?.avg_fit_score ? `${stats.avg_fit_score}%` : "0%",
      icon: "stars",
      bgClass: "bg-amber-500/10 text-amber-400",
      gradient: "from-amber-500 to-amber-600",
      description: "Global Avg Fit Scorer"
    },
    {
      title: "Follow-ups Due",
      value: followupsCount,
      icon: "notification_important",
      bgClass: "bg-rose-500/10 text-rose-400",
      gradient: "from-rose-600 to-orange-500",
      description: "Require attention"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
      {cards.map((c, i) => {
        return (
          <div
            key={i}
            className="group relative rounded-xl bg-surface-container-low border border-outline-variant p-5 transition-all duration-300 hover:scale-[1.02] hover:border-outline hover:bg-surface-container-low/80 overflow-hidden shadow-md"
          >
            {/* Background Glow */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-tr ${c.gradient} opacity-[0.03] blur-lg group-hover:scale-150 transition-transform duration-500`} />
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-headline font-bold text-on-surface-variant uppercase tracking-wider">{c.title}</span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bgClass} border border-outline-variant shadow`}>
                <span className="material-symbols-outlined text-lg">{c.icon}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <span className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">{c.value}</span>
              <p className="text-xs text-on-surface-variant mt-1.5 font-medium">{c.description}</p>
            </div>

            {/* Top Indicator Gradient Line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${c.gradient} opacity-70`} />
          </div>
        );
      })}
    </div>
  );
}
