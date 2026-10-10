import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Delete,
  RotateCcw,
  Tag,
  CheckCircle2,
  Zap,
  Bot,
  Store,
} from 'lucide-react';
import { Category, ExpenseCreatePayload } from '../types';
import { CURRENCY_SYMBOLS } from '../utils/formatters';

interface TactileExpenseDialPadProps {
  isOpen?: boolean;
  onClose: () => void;
  onSwitchToCopilot?: () => void;
  onSubmit: (data: ExpenseCreatePayload) => Promise<void>;
  categories: Category[];
  currency?: string;
}

const QUICK_MERCHANTS = ['Coffee', 'Uber', 'Amazon', 'Groceries', 'Dinner', 'Sub'];
const INCREMENTS = [10, 25, 50, 100];

export const TactileExpenseDialPad: React.FC<TactileExpenseDialPadProps> = ({
  isOpen = true,
  onClose,
  onSwitchToCopilot,
  onSubmit,
  categories,
  currency = 'USD',
}) => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPing, setSuccessPing] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Set default category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  // Reset fields on modal open
  useEffect(() => {
    if (isOpen) {
      setAmountStr('0');
      setMerchant('');
      setSuccessPing(false);
    }
  }, [isOpen]);

  const handleKeyPress = useCallback((val: string) => {
    setActiveKey(val);
    setTimeout(() => setActiveKey(null), 100);

    setAmountStr((prev) => {
      if (val === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      if (val === '00') {
        if (prev === '0') return '0';
        if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
        return prev + '00';
      }
      if (prev === '0') {
        return val;
      }
      // Limit decimals to 2 places
      if (prev.includes('.') && prev.split('.')[1].length >= 2) {
        return prev;
      }
      // Max 7 digits before decimal
      if (!prev.includes('.') && prev.length >= 7) {
        return prev;
      }
      return prev + val;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setActiveKey('backspace');
    setTimeout(() => setActiveKey(null), 100);
    setAmountStr((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, []);

  const handleClear = useCallback(() => {
    setActiveKey('clear');
    setTimeout(() => setActiveKey(null), 100);
    setAmountStr('0');
  }, []);

  const handleAddIncrement = (inc: number) => {
    const current = parseFloat(amountStr) || 0;
    const next = (current + inc).toFixed(2).replace(/\.00$/, '');
    setAmountStr(next);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleKeyPress('.');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyPress, handleBackspace, onClose]);

  const handleCommit = async () => {
    const num = parseFloat(amountStr);
    if (!num || num <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount: num,
        currency,
        category: selectedCategory || categories[0]?.name || 'General',
        merchant: merchant.trim() || undefined,
        occurred_at: new Date().toISOString(),
        source: 'dial_pad',
      });
      setSuccessPing(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setAmountStr('0');
        setMerchant('');
        setSuccessPing(false);
      }, 700);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currencySymbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || '$';

  return (
    <div
      className="flex flex-col w-full rounded-3xl border transition-all overflow-hidden shadow-2xl font-mono text-xs select-none"
      style={{
        backgroundColor: 'var(--bg-card-elevated)',
        borderColor: 'var(--border-main)',
        maxHeight: '500px',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.4), 0 0 24px rgba(230, 219, 116, 0.2)',
      }}
    >
      {/* Header Bar */}
      <div
        className="px-4 py-2.5 flex items-center justify-between border-b shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-sidebar)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-yellow)',
            }}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            <span>Tactile Dial</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onSwitchToCopilot && (
            <button
              onClick={onSwitchToCopilot}
              title="Switch to Co-Pilot"
              className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-hover)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-purple)',
              }}
            >
              <Bot className="w-3 h-3" />
              <span>Co-Pilot</span>
            </button>
          )}

          <button
            onClick={onClose}
            title="Close Dial Pad"
            className="p-1 rounded-lg border transition-colors hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-2.5 overflow-y-auto">
        {/* OLED / LCD Display Screen */}
        <div
          className="rounded-2xl p-3 border font-mono transition-all"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-active)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
            <span className="uppercase font-bold tracking-wider">Amount ({currency})</span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live Ready
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl font-extrabold" style={{ color: 'var(--accent-yellow)' }}>
              {currencySymbol}
            </span>
            <div
              className="text-3xl font-black tracking-tight text-right flex-1 truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {amountStr}
            </div>
          </div>

          {/* Sub-telemetry ribbon */}
          <div className="mt-1.5 pt-1.5 flex items-center justify-between border-t text-[10px]" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-1 truncate">
              <Tag className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold text-emerald-400">
                {selectedCategory || 'Select Category'}
              </span>
            </div>
            <div className="truncate max-w-[120px]" style={{ color: 'var(--text-muted)' }}>
              {merchant || 'No Vendor'}
            </div>
          </div>
        </div>

        {/* Quick Increment Pills */}
        <div className="flex items-center gap-1.5 justify-between">
          <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Quick:
          </span>
          <div className="flex items-center gap-1 flex-1 justify-end">
            {INCREMENTS.map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => handleAddIncrement(inc)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--accent-cyan)',
                }}
              >
                +{inc}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Merchant Compact Control Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2 py-1 rounded-xl text-[11px] border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-main)',
                color: 'var(--text-primary)',
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Merchant input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Merchant / Note"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-2 py-1 rounded-xl text-[11px] border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-main)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Quick Merchant Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {QUICK_MERCHANTS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMerchant(m)}
              className="px-2 py-0.5 rounded-lg text-[10px] border transition-colors shrink-0"
              style={{
                backgroundColor: merchant === m ? 'var(--bg-hover)' : 'var(--bg-card)',
                borderColor: merchant === m ? 'var(--accent-yellow)' : 'var(--border-subtle)',
                color: merchant === m ? 'var(--accent-yellow)' : 'var(--text-muted)',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* PHYSICAL TACTILE DIAL PAD GRID (4x4) */}
        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          {/* Row 1: 1, 2, 3, C */}
          {['1', '2', '3'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeyPress(key)}
              className={`h-9 rounded-xl font-mono text-base font-bold border transition-all flex items-center justify-center active:scale-95 ${
                activeKey === key ? 'scale-90 bg-[var(--bg-hover)]' : ''
              }`}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-main)',
                color: 'var(--text-primary)',
              }}
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            title="Clear (C)"
            className="h-9 rounded-xl font-mono text-xs font-bold border transition-all flex items-center justify-center active:scale-95"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-main)',
              color: 'var(--accent-orange)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Row 2: 4, 5, 6, ⌫ */}
          {['4', '5', '6'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeyPress(key)}
              className={`h-9 rounded-xl font-mono text-base font-bold border transition-all flex items-center justify-center active:scale-95 ${
                activeKey === key ? 'scale-90 bg-[var(--bg-hover)]' : ''
              }`}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-main)',
                color: 'var(--text-primary)',
              }}
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            title="Backspace"
            className="h-9 rounded-xl font-mono text-xs font-bold border transition-all flex items-center justify-center active:scale-95"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-main)',
              color: 'var(--accent-magenta)',
            }}
          >
            <Delete className="w-3.5 h-3.5" />
          </button>

          {/* Row 3: 7, 8, 9, 00 */}
          {['7', '8', '9'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeyPress(key)}
              className={`h-9 rounded-xl font-mono text-base font-bold border transition-all flex items-center justify-center active:scale-95 ${
                activeKey === key ? 'scale-90 bg-[var(--bg-hover)]' : ''
              }`}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-main)',
                color: 'var(--text-primary)',
              }}
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleKeyPress('00')}
            className="h-9 rounded-xl font-mono text-xs font-bold border transition-all flex items-center justify-center active:scale-95"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-main)',
              color: 'var(--text-primary)',
            }}
          >
            00
          </button>

          {/* Row 4: ., 0, and Commit Button (col-span-2) */}
          <button
            type="button"
            onClick={() => handleKeyPress('.')}
            className="h-9 rounded-xl font-mono text-base font-black border transition-all flex items-center justify-center active:scale-95"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-main)',
              color: 'var(--text-primary)',
            }}
          >
            .
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-9 rounded-xl font-mono text-base font-bold border transition-all flex items-center justify-center active:scale-95"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-main)',
              color: 'var(--text-primary)',
            }}
          >
            0
          </button>

          {/* COMMIT BUTTON */}
          <button
            type="button"
            onClick={handleCommit}
            disabled={isSubmitting || parseFloat(amountStr) <= 0}
            className="col-span-2 h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-40"
            style={{
              backgroundColor: successPing ? 'var(--accent-green)' : 'var(--accent-primary)',
              color: 'var(--accent-primary-fg)',
              boxShadow: '0 4px 12px var(--accent-primary-glow)',
            }}
          >
            {successPing ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" />
                <span>Committed!</span>
              </>
            ) : isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Commit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
