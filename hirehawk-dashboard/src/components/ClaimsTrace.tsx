import React, { useState } from 'react';
import { Claim } from '../types';

interface ClaimsTraceProps {
  claims: Claim[];
}

export default function ClaimsTrace({ claims }: ClaimsTraceProps) {
  const [expandedClaims, setExpandedClaims] = useState<Record<number, boolean>>({});

  const toggleClaim = (index: number) => {
    setExpandedClaims(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const verifiedCount = claims.filter(c => c.supported_by_baseline).length;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low/40 backdrop-blur-md p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-outline-variant pb-3">
        <div>
          <h3 className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider">Claims Adjudication Trace</h3>
          <p className="text-xs text-on-surface-variant mt-1 font-medium">
            Verification checks comparing generated claims against resume ground truth.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-surface-container-low border border-outline-variant/60 text-primary px-2.5 py-1 rounded-lg shadow-sm">
          {verifiedCount} / {claims.length} Valid
        </span>
      </div>

      <div className="space-y-2.5">
        {claims.map((item, idx) => {
          const isExpanded = !!expandedClaims[idx];
          return (
            <div
              key={idx}
              className={`rounded-xl border transition-colors duration-200 overflow-hidden ${
                item.supported_by_baseline
                  ? 'border-emerald-500/20 bg-emerald-950/15 hover:bg-emerald-950/25'
                  : 'border-rose-500/20 bg-rose-950/15 hover:bg-rose-950/25'
              }`}
            >
              {/* Claim Header Clickable */}
              <button
                onClick={() => toggleClaim(idx)}
                className="w-full text-left p-3.5 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex items-center justify-center">
                    {item.supported_by_baseline ? (
                      <span className="material-symbols-outlined text-emerald-400 text-base leading-none">gpp_good</span>
                    ) : (
                      <span className="material-symbols-outlined text-rose-400 text-base leading-none">gpp_maybe</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface leading-relaxed block">
                      {item.claim}
                    </span>
                    <span className={`inline-block text-[9px] font-headline font-bold uppercase tracking-wider mt-1.5 ${
                      item.supported_by_baseline ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {item.supported_by_baseline ? 'Supported' : 'Fabricated / Flagged'}
                    </span>
                  </div>
                </div>

                <div className="text-on-surface-variant p-1 rounded-btn bg-surface-container-low border border-outline-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm leading-none">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </button>

              {/* Collapsible reasoning details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1.5 border-t border-outline-variant/20 bg-surface-container-lowest/30 text-xs text-on-surface-variant leading-relaxed space-y-1.5 animate-slide-in">
                  <span className="font-bold text-on-surface uppercase text-[9px] tracking-wider block">Ground Truth Adjudication:</span>
                  <p className="font-medium text-slate-300">{item.reasoning}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
