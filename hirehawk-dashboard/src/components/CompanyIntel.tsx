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
    <div className="rounded-card border border-outline-variant bg-white p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-4 border-b border-outline-variant pb-4">
        {/* Company Logo Image or Fallback */}
        {intel.logo_url ? (
          <img
            src={intel.logo_url}
            alt={`${intel.company_name} logo`}
            className="w-12 h-12 rounded-lg bg-white border border-outline-variant p-1.5 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-container to-primary text-white flex items-center justify-center font-bold text-sm shadow">
            {getLogoFallback()}
          </div>
        )}

        <div>
          <h3 className="font-headline text-base font-bold text-on-surface">{intel.company_name}</h3>
          <span className="text-[10px] text-primary font-semibold tracking-wider uppercase">Scraped Company Profile</span>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
          <Building2 className="text-on-surface-variant shrink-0" size={14} />
          <div>
            <span className="text-[9px] text-on-surface-variant font-bold block uppercase tracking-wider">Industry</span>
            <span className="font-medium text-on-surface">{intel.industry || 'Unknown'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
          <MapPin className="text-on-surface-variant shrink-0" size={14} />
          <div>
            <span className="text-[9px] text-on-surface-variant font-bold block uppercase tracking-wider">Headquarters</span>
            <span className="font-medium text-on-surface">{intel.hq_location || 'Unknown'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
          <Calendar className="text-on-surface-variant shrink-0" size={14} />
          <div>
            <span className="text-[9px] text-on-surface-variant font-bold block uppercase tracking-wider">Founded</span>
            <span className="font-medium text-on-surface">{intel.founding_year || 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
          <Globe className="text-on-surface-variant shrink-0" size={14} />
          <div>
            <span className="text-[9px] text-on-surface-variant font-bold block uppercase tracking-wider">Website</span>
            {intel.website ? (
              <a
                href={intel.website}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline hover:text-primary-container truncate block max-w-[120px]"
              >
                {intel.website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <span className="font-medium text-on-surface-variant">N/A</span>
            )}
          </div>
        </div>
      </div>

      {/* Scraped News Segment */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          <Newspaper size={14} className="text-on-surface-variant" />
          <span>Scraped News Insights</span>
        </div>

        <div className="space-y-2">
          {intel.recent_news && intel.recent_news.length > 0 ? (
            intel.recent_news.map((item, idx) => {
              if (typeof item === 'string') {
                return (
                  <div key={idx} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/45 text-xs text-on-surface leading-relaxed font-medium">
                    {item}
                  </div>
                );
              }

              return (
                <div key={idx} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/45 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                    <span className="font-bold text-on-surface-variant">{item.source || 'Scraped Source'}</span>
                    <span>{item.date || ''}</span>
                  </div>
                  <h4 className="text-xs font-bold text-on-surface leading-relaxed">{item.title}</h4>
                  <p className="text-[11px] text-on-surface-variant leading-normal pt-0.5">{item.summary}</p>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-on-surface-variant italic font-medium py-3 text-center">
              No recent news snippets extracted.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
