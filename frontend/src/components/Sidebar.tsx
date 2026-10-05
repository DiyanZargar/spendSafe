import React from 'react';
import { LayoutDashboard, Receipt, FileText, Settings, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Reports & PNGs', icon: FileText },
    { id: 'settings', label: 'Channels & Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col justify-between bg-white border-r border-slate-200 p-4 shadow-xs">
      <div className="space-y-6">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Channel integrations badge */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-3">
            Active Integrations
          </div>
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Web Client
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold font-mono">Live</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Telegram
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Ready</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                WhatsApp
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 px-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>User-Isolated Monolith</span>
        </div>
      </div>
    </aside>
  );
};
