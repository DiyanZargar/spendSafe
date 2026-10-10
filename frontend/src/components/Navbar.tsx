import React from 'react';
import { LogOut, Plus, Bot, Wallet } from 'lucide-react';
import { authService } from '../services/auth';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onOpenNewExpense: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenNewExpense,
  onToggleChat,
  isChatOpen,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-slate-900">
            Agentic Expense
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isChatOpen
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        )}

        <button
          onClick={onOpenNewExpense}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Expense</span>
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="hidden md:block text-right">
              <div className="text-xs font-semibold text-slate-900">{user.full_name}</div>
              <div className="text-[11px] text-slate-500">{user.currency} • {user.email}</div>
            </div>
            <button
              onClick={() => authService.logout()}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
