import React from 'react';
import { Star, CheckCircle, XCircle } from 'lucide-react';

interface FitScoreBarProps {
  score: number | null;
}

export default function FitScoreBar({ score }: FitScoreBarProps) {
  const safeScore = score || 0;
  
  // Color configuration
  let strokeColor = 'stroke-rose-500';
  let textColor = 'text-rose-400';
  let badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  let description = 'Low match. Candidate lacks core tech dependencies requested by client.';
  
  if (safeScore >= 85) {
    strokeColor = 'stroke-purple-500';
    textColor = 'text-purple-400';
    badgeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    description = 'High match. Strong alignment on core skills, databases, and culture values.';
  } else if (safeScore >= 70) {
    strokeColor = 'stroke-amber-500';
    textColor = 'text-amber-400';
    badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    description = 'Moderate match. Matches basic criteria but lacks secondary framework features.';
  }

  // Circular ring variables
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0d1321]/60 p-5 space-y-4">
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Fit Scorer</h3>
        <p className="text-xs text-slate-500 mt-1">
          Automated evaluation from Resume details matched against Job Description.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        {/* Radial gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Base Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-[#1e293b]"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className={`transition-all duration-1000 ease-out ${strokeColor}`}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          {/* Inner Text */}
          <div className="absolute text-center">
            <span className="text-3xl font-extrabold tracking-tighter text-white font-mono">{safeScore}%</span>
            <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">Score</div>
          </div>
        </div>

        {/* Text descriptions */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
              <Star size={12} className="mr-1 fill-current" />
              {safeScore >= 85 ? 'Excellent' : safeScore >= 70 ? 'Fair Match' : 'Unmatched'}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-300 leading-relaxed">
            {description}
          </p>

          {/* Breakdown checklist */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-500 shrink-0" size={14} />
              <span className="text-slate-400">Core Stack Matched</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-500 shrink-0" size={14} />
              <span className="text-slate-400">Culture keywords match</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-500 shrink-0" size={14} />
              <span className="text-slate-400">Projects aligned</span>
            </div>
            <div className="flex items-center gap-2">
              {safeScore >= 70 ? (
                <CheckCircle className="text-emerald-500 shrink-0" size={14} />
              ) : (
                <XCircle className="text-rose-500 shrink-0" size={14} />
              )}
              <span className="text-slate-400">Experience matching</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
