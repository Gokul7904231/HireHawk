import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="rounded-xl border border-[#1e293b] bg-[#0d1321]/60 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#1e293b]/70 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Claims Adjudication Trace</h3>
          <p className="text-xs text-slate-500 mt-1">
            Verification checks comparing generated claims against resume ground truth.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-[#0b0f19] border border-[#1e293b] text-purple-400 px-2.5 py-1 rounded-lg">
          {verifiedCount} / {claims.length} Valid
        </span>
      </div>

      <div className="space-y-2.5">
        {claims.map((item, idx) => {
          const isExpanded = !!expandedClaims[idx];
          return (
            <div
              key={idx}
              className={`rounded-lg border transition-colors duration-200 overflow-hidden ${
                item.supported_by_baseline
                  ? 'border-emerald-500/15 bg-emerald-500/[0.01] hover:bg-emerald-500/[0.03]'
                  : 'border-rose-500/15 bg-rose-500/[0.01] hover:bg-rose-500/[0.03]'
              }`}
            >
              {/* Claim Header Clickable */}
              <button
                onClick={() => toggleClaim(idx)}
                className="w-full text-left p-3.5 flex items-center justify-between gap-4 focus:outline-none"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.supported_by_baseline ? (
                      <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
                    ) : (
                      <ShieldAlert className="text-rose-500 shrink-0" size={16} />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-200 leading-relaxed block">
                      {item.claim}
                    </span>
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider mt-1.5 ${
                      item.supported_by_baseline ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {item.supported_by_baseline ? 'Supported' : 'Fabricated / Flagged'}
                    </span>
                  </div>
                </div>

                <div className="text-slate-400 p-1 rounded-md bg-[#0b0f19] border border-[#1e293b]/50">
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Collapsible reasoning details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1.5 border-t border-[#1e293b]/30 bg-[#070b13]/40 text-xs text-slate-400 leading-relaxed space-y-1.5 animate-slide-in">
                  <span className="font-bold text-slate-300 uppercase text-[9px] tracking-wider">Ground Truth Adjudication:</span>
                  <p className="font-medium">{item.reasoning}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
