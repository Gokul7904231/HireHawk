import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const isMock = import.meta.env.VITE_MOCK === 'true';

  return (
    <div className="flex items-center justify-between border-b border-[#1f1f23] pb-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
          {subtitle}
        </p>
      </div>
      {isMock && (
        <span className="text-[10px] font-bold tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full uppercase">
          Mock Mode Active
        </span>
      )}
    </div>
  );
}
