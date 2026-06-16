import React from 'react';
import { Briefcase, Calendar, Star, AlertCircle } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: 'briefcase' | 'calendar' | 'star' | 'alert';
}

const iconMap = {
  briefcase: { component: Briefcase, color: "bg-primary/10", textColor: "text-primary" },
  calendar: { component: Calendar, color: "bg-emerald-100", textColor: "text-emerald-700" },
  star: { component: Star, color: "bg-secondary-container/50", textColor: "text-secondary" },
  alert: { component: AlertCircle, color: "bg-error-container/50", textColor: "text-error" },
};

export default function StatusCard({ title, value, sub, icon }: StatusCardProps) {
  const cfg = iconMap[icon] || iconMap.briefcase;
  const IconComponent = cfg.component;

  return (
    <div className="group relative rounded-card bg-white border border-outline-variant p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${cfg.color} ${cfg.textColor} transition-colors duration-300 shadow-sm`}>
          <IconComponent size={18} />
        </div>
      </div>
      
      <div className="mt-4">
        <span className="font-headline text-3xl font-bold tracking-tight text-on-surface">{value}</span>
        <p className="text-xs text-on-surface-variant mt-1.5 font-medium">{sub}</p>
      </div>

      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-primary/20`} />
    </div>
  );
}
