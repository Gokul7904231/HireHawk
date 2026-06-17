import React from 'react';

interface HeaderProps {
  onSearchChange?: (term: string) => void;
}

export default function Header({ onSearchChange }: HeaderProps) {
  const isMock = import.meta.env.VITE_MOCK === 'true';

  const handleNewPostingClick = () => {
    const textarea = document.getElementById('jd-input');
    if (textarea) {
      textarea.focus();
      textarea.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-margin-desktop bg-surface border-b border-outline-variant shadow-sm z-40 shrink-0">
      {/* Left side: Search input */}
      <div className="flex-1 flex items-center max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            id="global-search-input"
            type="text"
            placeholder="Search candidates, roles, or files..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
          />
        </div>
      </div>

      {/* Right side: Actions & Utilities */}
      <div className="flex items-center gap-6">
        {isMock && (
          <span className="text-[10px] font-bold tracking-widest bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full uppercase">
            Mock Mode
          </span>
        )}

        <button className="relative text-on-surface-variant hover:text-primary transition-all flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full border border-surface"></span>
        </button>

        <button className="text-on-surface-variant hover:text-primary transition-all flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">help_outline</span>
        </button>

        <div className="h-6 w-[1px] bg-outline-variant"></div>

        <button
          onClick={handleNewPostingClick}
          className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-primary/25"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Posting
        </button>

        <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant">
          <img
            alt="Recruiter Profile"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLzpY2TMvvQoXNFJjvVdx3MWFal2qkx5wd-R8Wcly6VecB2WrOvgRJJDYdUWmKsiO2n74bIWj01GI7tF5gZJHJq2_wUjYmOtEUf4jnXt6ZMZGeKTqrjQqZb1zAngw50vXbA4Us_hk1vCDHTuC2O1b2xav_CL5ar8CdqS5HnFV0lFVHHMqoZbEBGqk8I-JoNgUIQVVHEYaD-OHCjpGlbRwomUZLPbTyxXWZQG0_IVqiCaFdtEMHvyypgGc0sHEGUxJNFvTDzJRyS78"
          />
        </div>
      </div>
    </header>
  );
}
