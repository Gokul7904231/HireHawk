import React from 'react';
import { CompanyIntel as CompanyIntelType } from '../types';

interface CompanyIntelProps {
  intel: CompanyIntelType;
}

export default function CompanyIntel({ intel }: CompanyIntelProps) {
  const getLogoFallback = () => {
    return intel.company_name.substring(0, 2).toUpperCase();
  };

  const coverUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuABT5ybNMzYC_Nba-9K4DZbHsUBrqNa973KIBV09aafLzs5DbcVoe7eCnti_fcutvLxTwpgwX6FJreP9UsUOF9Z6MPRHsgqzUyhJGtxZuB9WcRkQlhzNPVRgNoN-QgozcFXyD4rWIoztm6QGbGYOht5nLj23p1P1MetdrDjhxNpA36csZczwT7elz3Kn9iI6bELyBT_JSd1WZjZpggRzngmTcRz69QqwMQ06OoslbeOwS-qc9NSoNpRwsKfcPKrd-SsbPQsBtAklu8";

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden shadow-xl">
      {/* Cover Image Header Section */}
      <div className="h-24 relative bg-surface-container">
        <img
          className="w-full h-full object-cover opacity-60"
          alt="Office Banner"
          src={coverUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1122] to-transparent"></div>
        
        {/* Floating Logo Badge */}
        <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-lg border border-outline-variant p-1.5 flex items-center justify-center shadow-md z-10">
          {intel.logo_url ? (
            <img
              src={intel.logo_url}
              alt={`${intel.company_name} logo`}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full rounded bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm">
              {getLogoFallback()}
            </div>
          )}
        </div>
      </div>

      {/* Profile Details (Indented padding) */}
      <div className="pt-10 px-6 pb-6 space-y-5">
        <div>
          <h4 className="font-headline text-lg font-bold text-on-surface leading-tight">{intel.company_name}</h4>
          <span className="text-[9px] text-primary font-bold tracking-widest uppercase mt-0.5 block">Scraped Intel Insights</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Funding</p>
            <p className="text-xs font-bold text-on-surface mt-0.5">Series I ($9B)</p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Size</p>
            <p className="text-xs font-bold text-on-surface mt-0.5">7,000+ Emp</p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Industry</p>
            <p className="text-xs font-bold text-on-surface mt-0.5 truncate">{intel.industry || 'Fintech'}</p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Headquarters</p>
            <p className="text-xs font-bold text-on-surface mt-0.5 truncate">{intel.hq_location || 'SF / Dublin'}</p>
          </div>
        </div>

        <hr className="border-outline-variant" />

        {/* Scraped News Segment */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-base">newspaper</span>
            <span>Recent News</span>
          </h5>

          <div className="space-y-3">
            {intel.recent_news && intel.recent_news.length > 0 ? (
              intel.recent_news.map((item, idx) => {
                const titleText = typeof item === 'string' ? item : item.title;
                const summaryText = typeof item === 'string' ? '' : item.summary;
                const dateText = typeof item === 'string' ? '2 days ago' : item.date || '2 days ago';

                return (
                  <div key={idx} className="group cursor-pointer space-y-0.5">
                    <p className="text-xs text-slate-200 group-hover:text-primary transition-colors leading-relaxed line-clamp-2 font-medium">
                      {titleText}
                    </p>
                    {summaryText && (
                      <p className="text-[11px] text-on-surface-variant leading-normal line-clamp-2">{summaryText}</p>
                    )}
                    <span className="text-[10px] text-on-surface-variant font-mono font-medium block">{dateText}</span>
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
    </div>
  );
}
