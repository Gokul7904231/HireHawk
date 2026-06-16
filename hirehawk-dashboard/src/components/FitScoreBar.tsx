import React from 'react';
import { Star, CheckCircle, XCircle } from 'lucide-react';

interface FitScoreBarProps {
  score: number | null;
}

export default function FitScoreBar({ score }: FitScoreBarProps) {
  const safeScore = score || 0;
  
  // Color configuration - HawkHire brand guidelines
  let strokeColor = 'stroke-error';
  let textColor = 'text-error';
  let badgeStyle = 'bg-error-container text-error border-error-container/35';
  let description = 'Low match. Candidate lacks core tech dependencies requested by client.';
  
  if (safeScore >= 85) {
    strokeColor = 'stroke-[#B8860B]'; // Gold Accent
    textColor = 'text-[#B8860B]';
    badgeStyle = 'bg-[rgba(184,134,11,0.1)] text-[#B8860B] border-[rgba(184,134,11,0.2)]';
    description = 'High match. Strong alignment on core skills, databases, and culture values.';
  } else if (safeScore >= 70) {
    strokeColor = 'stroke-primary'; // Violet
    textColor = 'text-primary';
    badgeStyle = 'bg-primary/10 text-primary border-primary/20';
    description = 'Moderate match. Matches basic criteria but lacks secondary framework features.';
  }

  // Circular ring variables
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="rounded-card border border-outline-variant bg-white p-5 space-y-4 shadow-sm">
      <div>
        <h3 className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider">Overall Fit Scorer</h3>
        <p className="text-xs text-on-surface-variant mt-1">
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
              className="stroke-surface-container"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className={`transition-all duration-1000 ease-out ${strokeColor}`}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          {/* Inner Text */}
          <div className="absolute text-center">
            <span className="font-headline text-2xl font-extrabold tracking-tighter text-on-surface font-mono">{safeScore}%</span>
            <div className="text-[8px] font-bold text-on-surface-variant tracking-wider uppercase mt-0.5">Score</div>
          </div>
        </div>

        {/* Text descriptions */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeStyle}`}>
              <Star size={12} className="mr-1 fill-current animate-pulse" />
              {safeScore >= 85 ? 'Excellent' : safeScore >= 70 ? 'Fair Match' : 'Unmatched'}
            </span>
          </div>
          <p className="text-xs font-medium text-on-surface leading-relaxed">
            {description}
          </p>

          {/* Breakdown checklist */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-600 shrink-0" size={14} />
              <span className="text-on-surface-variant">Core Stack Matched</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-600 shrink-0" size={14} />
              <span className="text-on-surface-variant">Culture keywords match</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-600 shrink-0" size={14} />
              <span className="text-on-surface-variant">Projects aligned</span>
            </div>
            <div className="flex items-center gap-2">
              {safeScore >= 70 ? (
                <CheckCircle className="text-emerald-600 shrink-0" size={14} />
              ) : (
                <XCircle className="text-error shrink-0" size={14} />
              )}
              <span className="text-on-surface-variant">Experience matching</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
