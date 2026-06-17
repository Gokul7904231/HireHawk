import React from 'react';

interface FitScoreBarProps {
  score: number | null;
}

export default function FitScoreBar({ score }: FitScoreBarProps) {
  const safeScore = score || 0;
  
  // Color configuration - HawkHire brand guidelines
  let strokeColor = 'stroke-rose-500';
  let textColor = 'text-rose-400';
  let badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  let description = 'Low match. Candidate lacks core tech dependencies requested by client.';
  
  if (safeScore >= 85) {
    strokeColor = 'stroke-amber-500'; // Gold Accent
    textColor = 'text-amber-400';
    badgeStyle = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    description = 'High match. Strong alignment on core skills, databases, and culture values.';
  } else if (safeScore >= 70) {
    strokeColor = 'stroke-primary'; // Violet
    textColor = 'text-primary';
    badgeStyle = 'bg-primary/10 text-primary border border-primary/20';
    description = 'Moderate match. Matches basic criteria but lacks secondary framework features.';
  }

  // Circular ring variables
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5 text-center shadow-xl space-y-5">
      <h3 className="font-headline text-[10px] text-on-surface-variant font-bold uppercase tracking-widest block">AI Fit Score</h3>
      
      {/* Radial gauge */}
      <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Base Circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-surface-container-high"
            strokeWidth="7"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className={`transition-all duration-1000 ease-out ${strokeColor}`}
            strokeWidth="7"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Inner Text */}
        <div className="absolute text-center">
          <span className="font-headline text-2xl font-extrabold tracking-tighter text-on-surface font-mono">{safeScore}%</span>
          <div className="text-[8px] font-bold text-on-surface-variant tracking-wider uppercase mt-0.5">Scorer</div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider shadow-sm bg-black/25">
        <span className={`material-symbols-outlined text-sm leading-none ${textColor}`}>star</span>
        <span className={textColor}>
          {safeScore >= 85 ? 'Excellent' : safeScore >= 70 ? 'Fair Match' : 'Unmatched'}
        </span>
      </div>

      <p className="text-xs font-medium text-slate-300 leading-relaxed px-4">
        {description}
      </p>

      {/* Breakdown Checklist */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-outline-variant/50 text-left text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-sm leading-none">check_circle</span>
          <span className="text-on-surface-variant">Core Stack</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-sm leading-none">check_circle</span>
          <span className="text-on-surface-variant">Culture Match</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-sm leading-none">check_circle</span>
          <span className="text-on-surface-variant">Projects Done</span>
        </div>
        <div className="flex items-center gap-2">
          {safeScore >= 70 ? (
            <span className="material-symbols-outlined text-emerald-400 text-sm leading-none">check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-rose-400 text-sm leading-none">cancel</span>
          )}
          <span className="text-on-surface-variant">Experience</span>
        </div>
      </div>
    </div>
  );
}
