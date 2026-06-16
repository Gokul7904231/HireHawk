import React from 'react';
import { Briefcase, Calendar, Star, AlertCircle } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: 'briefcase' | 'calendar' | 'star' | 'alert';
}

const iconMap = {
  briefcase: { component: Briefcase, color: "from-blue-600 to-indigo-500", textColor: "text-blue-400" },
  calendar: { component: Calendar, color: "from-emerald-600 to-teal-500", textColor: "text-emerald-400" },
  star: { component: Star, color: "from-purple-600 to-pink-500", textColor: "text-purple-400" },
  alert: { component: AlertCircle, color: "from-amber-600 to-orange-500", textColor: "text-amber-400" },
};

export default function StatusCard({ title, value, sub, icon }: StatusCardProps) {
  const cfg = iconMap[icon] || iconMap.briefcase;
  const IconComponent = cfg.component;

  return (
    <div className="group relative rounded-xl bg-[#121214] border border-[#1f1f23] p-5 transition-all duration-300 hover:scale-[1.02] hover:border-slate-700/60 hover:bg-[#161619] overflow-hidden">
      {/* Background Glow */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-tr ${cfg.color} opacity-[0.03] blur-lg group-hover:scale-150 transition-transform duration-500`} />
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg bg-[#09090b] border border-[#1f1f23] ${cfg.textColor} group-hover:bg-[#1f1f23] transition-colors duration-300 shadow`}>
          <IconComponent size={18} />
        </div>
      </div>
      
      <div className="mt-4">
        <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
        <p className="text-xs text-slate-500 mt-1.5 font-medium">{sub}</p>
      </div>

      {/* Top Indicator Gradient Line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${cfg.color} opacity-70`} />
    </div>
  );
}
