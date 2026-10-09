import React from 'react';
import { Sun, Code2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme, isMonokai } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${isMonokai ? 'Light' : 'Monokai'} theme`}
      className={`relative inline-flex items-center gap-1.5 p-1 rounded-full border transition-all duration-300 ${
        isMonokai
          ? 'bg-[#1e1f1c] border-[#49483e] text-[#f8f8f2] shadow-sm hover:border-[#f92672]'
          : 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs hover:border-emerald-500'
      } ${className}`}
    >
      <div
        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
          !isMonokai
            ? 'bg-white text-amber-500 shadow-sm'
            : 'text-[#75715e] opacity-60'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </div>

      <div
        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
          isMonokai
            ? 'bg-[#f92672] text-[#f8f8f2] shadow-md shadow-[#f92672]/30 font-mono font-bold text-[10px]'
            : 'text-slate-400 opacity-60'
        }`}
      >
        <Code2 className="w-3.5 h-3.5" />
      </div>

      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
