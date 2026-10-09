import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Radio,
  Sliders,
  Cpu,
} from 'lucide-react';

interface SpatialSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const SpatialSidebar: React.FC<SpatialSidebarProps> = ({ currentTab, onSelectTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Cockpit HUD',
      badge: 'LIVE',
      icon: LayoutDashboard,
      color: 'var(--accent-green)',
    },
    {
      id: 'expenses',
      label: 'Ledger & Dials',
      badge: 'CRUD',
      icon: Receipt,
      color: 'var(--accent-yellow)',
    },
    {
      id: 'reports',
      label: 'Visual Reports',
      badge: 'PNG',
      icon: FileText,
      color: 'var(--accent-cyan)',
    },
    {
      id: 'settings',
      label: 'Mesh & Models',
      badge: 'LLM',
      icon: Cpu,
      color: 'var(--accent-magenta)',
    },
  ];

  return (
    <aside
      className={`shrink-0 hidden md:flex flex-col justify-between p-3.5 transition-all duration-300 border-r ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderColor: 'var(--border-main)',
      }}
    >
      <div className="space-y-6">
        {/* Collapse toggle header */}
        <div className="flex items-center justify-between px-2">
          {!isCollapsed && (
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Navigation Deck
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg border transition-colors mx-auto md:ml-auto"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Primary Navigation Rail */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-mono font-bold transition-all relative group border ${
                  active ? 'shadow-md scale-102' : 'hover:scale-101 opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: active ? 'var(--bg-card)' : 'transparent',
                  borderColor: active ? item.color : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {/* Active Glowing Dot */}
                {active && (
                  <div
                    className="absolute left-1.5 w-1.5 h-5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}

                <Icon
                  className="w-4 h-4 shrink-0 transition-colors"
                  style={{ color: active ? item.color : 'var(--text-muted)' }}
                />

                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="tracking-tight">{item.label}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded border font-mono"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: 'var(--border-subtle)',
                        color: item.color,
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Channel Telemetry Nodes */}
        {!isCollapsed && (
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-2.5 px-2" style={{ color: 'var(--text-muted)' }}>
              <span>Channel Telemetry</span>
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-1.5 font-mono">
              <div
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="flex items-center gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Web Engine
                </span>
                <span className="text-[10px] font-bold" style={{ color: 'var(--accent-green)' }}>
                  ACTIVE
                </span>
              </div>

              <div
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="flex items-center gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Telegram
                </span>
                <span className="text-[10px]" style={{ color: 'var(--accent-cyan)' }}>
                  SYNC
                </span>
              </div>

              <div
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="flex items-center gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  WhatsApp
                </span>
                <span className="text-[10px]" style={{ color: 'var(--accent-green)' }}>
                  SYNC
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Security Badge */}
      <div className="pt-4 border-t px-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-green)' }} />
          {!isCollapsed && <span className="truncate">Tenant-Isolated Monolith</span>}
        </div>
      </div>
    </aside>
  );
};
