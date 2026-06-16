import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const isMock = import.meta.env.VITE_MOCK === 'true';

  return (
    <div className="flex items-center justify-between border-b border-outline-variant pb-5">
      <div>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">{title}</h1>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mt-1">
          {subtitle}
        </p>
      </div>
      {isMock && (
        <span className="text-[10px] font-bold tracking-widest bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full uppercase">
          Mock Mode Active
        </span>
      )}
    </div>
  );
}
