import React, { useState, useEffect } from 'react';
import { X, DollarSign, Tag, Store, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Expense, ExpenseCreatePayload, Category } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseCreatePayload) => Promise<void>;
  expenseToEdit?: Expense | null;
  categories: Category[];
  defaultCurrency?: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expenseToEdit,
  categories,
  defaultCurrency = 'USD',
}) => {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Food & Dining');
  const [merchant, setMerchant] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (expenseToEdit) {
      setAmount(expenseToEdit.amount.toString());
      setCategory(expenseToEdit.category);
      setMerchant(expenseToEdit.merchant || '');
      setDescription(expenseToEdit.description || '');
      setDate(expenseToEdit.occurred_at.slice(0, 10));
    } else {
      setAmount('');
      setCategory(categories[0]?.name || 'Food & Dining');
      setMerchant('');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
    }
    setError('');
  }, [expenseToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please specify a positive numerical amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        amount: parsedAmount,
        category: category.trim(),
        merchant: merchant.trim() || undefined,
        description: description.trim() || undefined,
        occurred_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        currency: defaultCurrency,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl p-6 relative font-mono transition-all"
        style={{
          backgroundColor: 'var(--bg-card-elevated)',
          borderColor: 'var(--border-main)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 30px var(--accent-primary-glow)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl border transition-colors hover:scale-105"
          style={{
            backgroundColor: 'var(--bg-hover)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-extrabold tracking-tight mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent-magenta)' }}>//</span>
          {expenseToEdit ? 'Modify Transaction' : 'Record Transaction'}
        </h3>

        {error && (
          <div
            className="mb-4 p-3 rounded-2xl border text-xs font-semibold"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 10%, transparent)',
              borderColor: 'var(--accent-magenta)',
              color: 'var(--accent-magenta)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Amount ({defaultCurrency}) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-2.5" style={{ color: 'var(--accent-yellow)' }} />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--accent-yellow)',
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Category *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-2.5" style={{ color: 'var(--accent-green)' }} />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors"
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
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Merchant / Counterparty
            </label>
            <div className="relative">
              <Store className="w-4 h-4 absolute left-3 top-2.5" style={{ color: 'var(--accent-cyan)' }} />
              <input
                type="text"
                placeholder="e.g. Uber, Amazon, Apple, Coffee"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Timestamp
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5" style={{ color: 'var(--accent-purple)' }} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Memo / Notes
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
              <textarea
                rows={2}
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border transition-colors"
              style={{
                backgroundColor: 'var(--bg-hover)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-lg"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-fg)',
                boxShadow: '0 4px 14px var(--accent-primary-glow)',
              }}
            >
              {isSubmitting ? 'Writing...' : expenseToEdit ? 'Commit Changes' : 'Write to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
