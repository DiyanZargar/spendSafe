import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Delete,
  RotateCcw,
  Tag,
  Store,
  Calendar,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Category, ExpenseCreatePayload } from '../types';
import { CURRENCY_SYMBOLS } from '../utils/formatters';

interface TactileExpenseDialPadProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseCreatePayload) => Promise<void>;
  categories: Category[];
  currency?: string;
}

const QUICK_MERCHANTS = ['Starbucks', 'Uber', 'Amazon', 'Groceries', 'Restaurant', 'Netflix', 'Pharmacy'];
const INCREMENTS = [10, 25, 50, 100, 250];

export const TactileExpenseDialPad: React.FC<TactileExpenseDialPadProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  currency = 'USD',
}) => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [occurredAt, setOccurredAt] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPing, setSuccessPing] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Set default category on open
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
      setDescription('');
      setOccurredAt(new Date().toISOString().slice(0, 10));
      setSuccessPing(false);
    }
  }, [isOpen]);

  const handleKeyPress = useCallback((val: string) => {
    setActiveKey(val);
    setTimeout(() => setActiveKey(null), 120);

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
      // Max 8 digits before decimal
      if (!prev.includes('.') && prev.length >= 8) {
        return prev;
      }
      return prev + val;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setActiveKey('backspace');
    setTimeout(() => setActiveKey(null), 120);
    setAmountStr((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, []);

  const handleClear = useCallback(() => {
    setActiveKey('clear');
    setTimeout(() => setActiveKey(null), 120);
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
        return; // Don't intercept if typing in merchant or note field
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
        description: description.trim() || undefined,
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
        source: 'dial_pad',
      });
      setSuccessPing(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 400);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currencySymbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || '$';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-card-elevated)',
          borderColor: 'var(--border-main)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 40px var(--accent-primary-glow)',
        }}
      >
        {/* Top Header Bar */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-sidebar)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs"
              style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--accent-magenta)',
                border: '1px solid var(--border-active)',
              }}
            >
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Tactile Quick-Dial Ledger
              </h3>
              <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                Hardware Dial Pad • Direct API Commit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:scale-105"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-hover)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* OLED / LCD Display Screen */}
          <div
            className="relative rounded-2xl p-4 sm:p-5 border transition-all font-mono"
            style={{
              backgroundColor: 'var(--bg-base)',
              borderColor: 'var(--border-active)',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              <span className="uppercase tracking-widest text-[10px] font-bold">Ledger Amount ({currency})</span>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--accent-cyan)' }}>
                <Sparkles className="w-3 h-3" />
                Live Ready
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--accent-yellow)' }}>
                {currencySymbol}
              </span>
              <div
                className="text-4xl sm:text-5xl font-black tracking-tight text-right flex-1 truncate"
                style={{
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {amountStr}
              </div>
            </div>

            {/* Sub-telemetry ribbon */}
            <div className="mt-2.5 pt-2 flex items-center justify-between border-t text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-1.5 truncate">
                <Tag className="w-3 h-3" style={{ color: 'var(--accent-green)' }} />
                <span className="font-semibold" style={{ color: 'var(--accent-green)' }}>
                  {selectedCategory || 'Select Category'}
                </span>
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {merchant ? `Vendor: ${merchant}` : 'No Vendor'}
              </div>
            </div>
          </div>

          {/* Quick Increment Dial Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] uppercase font-mono tracking-wider shrink-0 mr-1" style={{ color: 'var(--text-muted)' }}>
              Dial +
            </span>
            {INCREMENTS.map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => handleAddIncrement(inc)}
                className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all hover:scale-105 active:scale-95 shrink-0 border"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--accent-cyan)',
                }}
              >
                +{inc}
              </button>
            ))}
          </div>

          {/* Category Rotary Dial Selector */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Category Matrix
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const active = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                      active ? 'scale-105 shadow-sm' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: active ? 'var(--bg-card-subtle)' : 'var(--bg-base)',
                      borderColor: active ? 'var(--accent-green)' : 'var(--border-main)',
                      color: active ? 'var(--accent-green)' : 'var(--text-secondary)',
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Merchant & Note Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <Store className="w-3.5 h-3.5 absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Merchant / Place"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none transition-colors font-mono"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Merchant Quick-Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_MERCHANTS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMerchant(m)}
                className="px-2 py-0.5 rounded-lg text-[11px] border transition-colors shrink-0"
                style={{
                  backgroundColor: merchant === m ? 'var(--bg-card-subtle)' : 'var(--bg-base)',
                  borderColor: merchant === m ? 'var(--accent-yellow)' : 'var(--border-subtle)',
                  color: merchant === m ? 'var(--accent-yellow)' : 'var(--text-muted)',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* PHYSICAL TACTILE DIAL PAD GRID */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {/* 1, 2, 3, C */}
            {['1', '2', '3'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={`tactile-dial-btn h-12 sm:h-14 rounded-2xl font-mono text-lg sm:text-xl font-bold border transition-all flex items-center justify-center ${
                  activeKey === key ? 'scale-95' : ''
                }`}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              >
                {key}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              title="Clear (C)"
              className="tactile-dial-btn h-12 sm:h-14 rounded-2xl font-mono text-sm sm:text-base font-bold border transition-all flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-hover)',
                borderColor: 'var(--border-main)',
                color: 'var(--accent-orange)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* 4, 5, 6, Backspace */}
            {['4', '5', '6'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={`tactile-dial-btn h-12 sm:h-14 rounded-2xl font-mono text-lg sm:text-xl font-bold border transition-all flex items-center justify-center ${
                  activeKey === key ? 'scale-95' : ''
                }`}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              >
                {key}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              title="Backspace (⌫)"
              className="tactile-dial-btn h-12 sm:h-14 rounded-2xl font-mono text-sm sm:text-base font-bold border transition-all flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-hover)',
                borderColor: 'var(--border-main)',
                color: 'var(--accent-magenta)',
              }}
            >
              <Delete className="w-4 h-4" />
            </button>

            {/* 7, 8, 9, 00 */}
            {['7', '8', '9'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={`tactile-dial-btn h-12 sm:h-14 rounded-2xl font-mono text-lg sm:text-xl font-bold border transition-all flex items-center justify-center ${
                  activeKey === key ? 'scale-95' : ''
                }`}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              >
                {key}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeyPress('00')}
              className="tactile-dial-btn h-12 sm:h-14 rounded-2xl font-mono text-base font-bold border transition-all flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-main)',
                color: 'var(--text-primary)',
              }}
            >
              00
            </button>

            {/* ., 0, and span-2 COMMIT BUTTON */}
            <button
              type="button"
              onClick={() => handleKeyPress('.')}
              className="tactile-dial-btn h-12 sm:h-14 rounded-2xl font-mono text-xl font-black border transition-all flex items-center justify-center"
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
              className="tactile-dial-btn h-12 sm:h-14 rounded-2xl font-mono text-lg sm:text-xl font-bold border transition-all flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-main)',
                color: 'var(--text-primary)',
              }}
            >
              0
            </button>

            {/* COMMIT BUTTON (Spans 2 columns) */}
            <button
              type="button"
              onClick={handleCommit}
              disabled={isSubmitting || parseFloat(amountStr) <= 0}
              className="tactile-dial-btn col-span-2 h-12 sm:h-14 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
              style={{
                backgroundColor: successPing ? 'var(--accent-green)' : 'var(--accent-primary)',
                color: 'var(--accent-primary-fg)',
                boxShadow: '0 8px 20px var(--accent-primary-glow)',
              }}
            >
              {successPing ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  <span>Recorded!</span>
                </>
              ) : isSubmitting ? (
                <span>Writing to Ledger...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Commit Entry</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
