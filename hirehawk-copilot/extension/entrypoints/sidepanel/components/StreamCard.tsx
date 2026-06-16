import React from 'react';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

interface StreamCardProps {
  phase: string;
  type: string;
  title: string;
  duration: string;
  status: 'completed' | 'active' | 'pending' | 'error';
}

export default function StreamCard({ phase, type, title, duration, status }: StreamCardProps) {
  let cardStyle = 'border-[#1f1f23] bg-[#09090b] opacity-50';
  let statusLabel = 'Pending';
  let statusIndicator = <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />;

  if (status === 'active') {
    cardStyle = 'border-purple-500/40 bg-[#121214] shadow-md shadow-purple-500/5 opacity-100';
    statusLabel = 'Processing';
    statusIndicator = <Loader2 className="animate-spin text-purple-400" size={14} />;
  } else if (status === 'completed') {
    cardStyle = 'border-emerald-500/30 bg-[#121214]/60 opacity-100';
    statusLabel = 'Completed';
    statusIndicator = <CheckCircle2 className="text-emerald-400" size={14} />;
  } else if (status === 'error') {
    cardStyle = 'border-rose-500/30 bg-[#121214] opacity-100';
    statusLabel = 'Failed';
    statusIndicator = <AlertTriangle className="text-rose-400" size={14} />;
  }

  return (
    <div className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 ${cardStyle}`}>
      <div className="flex items-start justify-between">
        <div>
          {type !== 'NONE' && (
            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">{type}</span>
          )}
          <h4 className="text-xs font-bold text-gray-200 mt-0.5">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {duration && <span className="text-[10px] font-mono font-medium text-gray-400">{duration}</span>}
          {statusIndicator}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#1f1f23] pt-2">
        <span className="text-[9px] text-gray-400 font-semibold tracking-wider uppercase">{statusLabel}</span>
        <span className="text-[9px] text-gray-500 font-mono">{phase}</span>
      </div>
    </div>
  );
}
