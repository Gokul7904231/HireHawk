import React from 'react';
import { Building2, MapPin, Calendar, Globe, Newspaper } from 'lucide-react';
import { CompanyIntel as CompanyIntelType } from '../types';

interface CompanyIntelProps {
  intel: CompanyIntelType;
}

export default function CompanyIntel({ intel }: CompanyIntelProps) {
  const getLogoFallback = () => {
    return intel.company_name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0d1321]/60 p-5 space-y-4">
      <div className="flex items-center gap-4 border-b border-[#1e293b]/70 pb-4">
        {/* Company Logo Image or Fallback */}
        {intel.logo_url ? (
          <img
            src={intel.logo_url}
            alt={`${intel.company_name} logo`}
            className="w-12 h-12 rounded-lg bg-[#0b0f19] border border-[#1e293b] p-1.5 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow">
            {getLogoFallback()}
          </div>
        )}

        <div>
          <h3 className="text-base font-bold text-white">{intel.company_name}</h3>
          <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">Scraped Company Profile</span>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#070b13]/50 border border-[#1e293b]/40">
          <Building2 className="text-slate-400 shrink-0" size={14} />
          <div>
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Industry</span>
            <span className="font-medium text-slate-200">{intel.industry || 'Unknown'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#070b13]/50 border border-[#1e293b]/40">
          <MapPin className="text-slate-400 shrink-0" size={14} />
          <div>
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Headquarters</span>
            <span className="font-medium text-slate-200">{intel.hq_location || 'Unknown'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#070b13]/50 border border-[#1e293b]/40">
          <Calendar className="text-slate-400 shrink-0" size={14} />
          <div>
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Founded</span>
            <span className="font-medium text-slate-200">{intel.founding_year || 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#070b13]/50 border border-[#1e293b]/40">
          <Globe className="text-slate-400 shrink-0" size={14} />
          <div>
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Website</span>
            {intel.website ? (
              <a
                href={intel.website}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-purple-400 hover:underline hover:text-purple-300 truncate block max-w-[120px]"
              >
                {intel.website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <span className="font-medium text-slate-400">N/A</span>
            )}
          </div>
        </div>
      </div>

      {/* Scraped News Segment */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Newspaper size={14} />
          <span>Scraped News Insights</span>
        </div>

        <div className="space-y-2">
          {intel.recent_news && intel.recent_news.length > 0 ? (
            intel.recent_news.map((item, idx) => {
              if (typeof item === 'string') {
                return (
                  <div key={idx} className="p-3 rounded-lg bg-[#070b13]/40 border border-[#1e293b]/40 text-xs text-slate-300 leading-relaxed font-medium">
                    {item}
                  </div>
                );
              }

              return (
                <div key={idx} className="p-3 rounded-lg bg-[#070b13]/40 border border-[#1e293b]/40 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="font-bold text-slate-400">{item.source || 'Scraped Source'}</span>
                    <span>{item.date || ''}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 leading-relaxed">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-normal pt-0.5">{item.summary}</p>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-slate-500 italic font-medium py-3 text-center">
              No recent news snippets extracted.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
