import React from 'react';
import {
  Zap,
  Bot,
  Search,
  LogOut,
  Terminal,
} from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/auth';
import { ThemeToggle } from './ThemeToggle';

interface SpatialNavbarProps {
  user: User | null;
  onOpenDialPad: () => void;
  onOpenNewExpense: () => void;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
  isDialPadOpen?: boolean;
  onSearchFocus?: () => void;
}

export const SpatialNavbar: React.FC<SpatialNavbarProps> = ({
  user,
  onOpenDialPad,
  onToggleAiDrawer,
  isAiDrawerOpen,
  isDialPadOpen = false,
  onSearchFocus,
}) => {
  return (
    <header
      className="sticky top-0 z-40 px-4 sm:px-6 py-2.5 transition-colors duration-200 border-b backdrop-blur-xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-sidebar) 85%, transparent)',
        borderColor: 'var(--border-main)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Left */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-fg)',
              boxShadow: '0 4px 14px var(--accent-primary-glow)',
            }}
          >
            <Terminal className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight font-mono" style={{ color: 'var(--text-primary)' }}>
                EXPENSE<span style={{ color: 'var(--accent-magenta)' }}>//</span>COCKPIT
              </span>
            </div>
            <div className="text-[10px] font-mono hidden md:flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Isolated Tenant • AES-Fernet</span>
            </div>
          </div>
        </div>

        {/* Center Search / Action trigger */}
        <div className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
          <div
            onClick={onSearchFocus}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-2xl border text-xs cursor-pointer transition-all hover:scale-101"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-main)',
              color: 'var(--text-muted)',
            }}
          >
            <div className="flex items-center gap-2 font-mono">
              <Search className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
              <span>Type / query or dial ledger...</span>
            </div>
            <kbd
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--bg-hover)',
                borderColor: 'var(--border-active)',
                color: 'var(--text-muted)',
              }}
            >
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Action Controls Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Quick Console Tools (Dial Pad & Co-Pilot Group) */}
          <div
            className="flex items-center p-1 rounded-2xl border gap-1"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-main)',
            }}
          >
            <button
              onClick={onOpenDialPad}
              title="Tactile Quick-Dial Pad (Cmd+D)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                isDialPadOpen
                  ? 'shadow-md border'
                  : 'hover:bg-[var(--bg-hover)] opacity-85 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isDialPadOpen ? 'var(--bg-hover)' : 'transparent',
                borderColor: isDialPadOpen ? 'var(--accent-yellow)' : 'transparent',
                color: 'var(--accent-yellow)',
              }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Tactile Dial</span>
            </button>

            <button
              onClick={onToggleAiDrawer}
              title="Neural Co-Pilot (Cmd+K)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                isAiDrawerOpen
                  ? 'shadow-md border'
                  : 'hover:bg-[var(--bg-hover)] opacity-85 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isAiDrawerOpen ? 'var(--bg-hover)' : 'transparent',
                borderColor: isAiDrawerOpen ? 'var(--accent-purple)' : 'transparent',
                color: 'var(--accent-purple)',
              }}
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Co-Pilot</span>
            </button>
          </div>

          {/* User Profile & Logout */}
          {user && (
            <div
              className="flex items-center gap-2.5 pl-2.5 border-l"
              style={{ borderColor: 'var(--border-main)' }}
            >
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold font-mono truncate max-w-[120px]" style={{ color: 'var(--text-primary)' }}>
                  {user.full_name || user.email.split('@')[0]}
                </div>
                <div className="text-[10px] font-mono" style={{ color: 'var(--accent-cyan)' }}>
                  {user.currency || 'USD'}
                </div>
              </div>
              <button
                onClick={() => authService.logout()}
                title="Disconnect / Logout"
                className="p-2 rounded-xl transition-all hover:scale-110"
                style={{
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-hover)',
                }}
              >
                <LogOut className="w-3.5 h-3.5 hover:text-[#f92672]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
