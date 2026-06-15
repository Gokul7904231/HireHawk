import React from 'react';
import { Briefcase, Calendar, Star, AlertCircle } from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-[#0d1321] border border-[#1e293b] animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Applications",
      value: stats?.total || 0,
      icon: Briefcase,
      color: "from-blue-600 to-indigo-500",
      textColor: "text-blue-400",
      description: `${stats?.by_status?.applied || 0} applied | ${stats?.by_status?.pending || 0} pending`
    },
    {
      title: "Interviews Scheduled",
      value: stats?.interviews || 0,
      icon: Calendar,
      color: "from-emerald-600 to-teal-500",
      textColor: "text-emerald-400",
      description: "Live pipeline activity"
    },
    {
      title: "Average Fit Score",
      value: stats?.avg_fit_score ? `${stats.avg_fit_score}%` : "0%",
      icon: Star,
      color: "from-purple-600 to-pink-500",
      textColor: "text-purple-400",
      description: "Computed by agent scorer"
    },
    {
      title: "Follow-ups Due",
      value: followupsCount,
      icon: AlertCircle,
      color: "from-amber-600 to-orange-500",
      textColor: "text-amber-400",
      description: "> 7 days since last update"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="group relative rounded-xl bg-[#0d1321]/60 border border-[#1e293b] p-5 transition-all duration-300 hover:scale-[1.02] hover:border-slate-700/60 hover:bg-[#121b2d] overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-tr ${c.color} opacity-[0.03] blur-lg group-hover:scale-150 transition-transform duration-500`} />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.title}</span>
              <div className={`p-2 rounded-lg bg-[#0b0f19] border border-[#1e293b]/70 ${c.textColor} group-hover:bg-[#1a2333] transition-colors duration-300 shadow`}>
                <Icon size={18} />
              </div>
            </div>
            
            <div className="mt-4">
              <span className="text-3xl font-bold tracking-tight text-white">{c.value}</span>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">{c.description}</p>
            </div>

            {/* Top Indicator Gradient Line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${c.color} opacity-70`} />
          </div>
        );
      })}
    </div>
  );
}
