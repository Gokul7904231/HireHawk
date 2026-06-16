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
    <div className="rounded-card border border-outline-variant bg-white p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant pb-3">
        <div>
          <h3 className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider">Claims Adjudication Trace</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Verification checks comparing generated claims against resume ground truth.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-surface-container-low border border-outline-variant text-primary px-2.5 py-1 rounded-lg">
          {verifiedCount} / {claims.length} Valid
        </span>
      </div>

      <div className="space-y-2.5">
        {claims.map((item, idx) => {
          const isExpanded = !!expandedClaims[idx];
          return (
            <div
              key={idx}
              className={`rounded-card border transition-colors duration-200 overflow-hidden ${
                item.supported_by_baseline
                  ? 'border-green-200 bg-green-50/10 hover:bg-green-50/20'
                  : 'border-error-container bg-error-container/5 hover:bg-error-container/10'
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
                      <ShieldCheck className="text-emerald-600 shrink-0" size={16} />
                    ) : (
                      <ShieldAlert className="text-error shrink-0" size={16} />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface leading-relaxed block">
                      {item.claim}
                    </span>
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider mt-1.5 ${
                      item.supported_by_baseline ? 'text-emerald-700' : 'text-error'
                    }`}>
                      {item.supported_by_baseline ? 'Supported' : 'Fabricated / Flagged'}
                    </span>
                  </div>
                </div>

                <div className="text-on-surface-variant p-1 rounded-btn bg-white border border-outline-variant">
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Collapsible reasoning details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1.5 border-t border-outline-variant/30 bg-surface-container-low/40 text-xs text-on-surface-variant leading-relaxed space-y-1.5 animate-slide-in">
                  <span className="font-bold text-on-surface uppercase text-[9px] tracking-wider">Ground Truth Adjudication:</span>
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
