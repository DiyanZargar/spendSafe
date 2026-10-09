import React, { useState } from 'react';
import { Search, Trash2, Edit2, Tag, ArrowUpDown, Filter, Terminal } from 'lucide-react';
import { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface RecentTransactionsTableProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  currency?: string;
  isLoading?: boolean;
  minAmountFilter?: number;
  maxAmountFilter?: number;
}

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({
  expenses,
  onDeleteExpense,
  onEditExpense,
  currency = 'USD',
  isLoading = false,
  minAmountFilter = 0,
  maxAmountFilter = Infinity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Extract unique categories
  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  // Filter with amount dial bounds
  const filtered = expenses.filter((e) => {
    const amt = Number(e.amount);
    const matchMin = amt >= minAmountFilter;
    const matchMax = amt <= maxAmountFilter;

    const matchSearch =
      !searchTerm ||
      (e.merchant && e.merchant.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !categoryFilter || e.category === categoryFilter;

    return matchMin && matchMax && matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search vendor, memo, tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-2xl text-xs border focus:outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-main)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl text-xs border focus:outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-main)',
              color: 'var(--text-secondary)',
            }}
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Futuristic Ledger Table */}
      <div
        className="overflow-x-auto rounded-3xl border transition-all shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <table className="w-full text-left text-xs">
          <thead
            className="text-[10px] uppercase font-bold tracking-wider border-b"
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <tr>
              <th className="py-3.5 px-4 font-mono">Timestamp</th>
              <th className="py-3.5 px-4 font-mono">Channel</th>
              <th className="py-3.5 px-4 font-mono">Merchant & Memo</th>
              <th className="py-3.5 px-4 font-mono">Origin</th>
              <th className="py-3.5 px-4 text-right font-mono">Debit / Amount</th>
              <th className="py-3.5 px-4 text-center font-mono">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--accent-cyan)' }} />
                    Syncing transactions from isolated tenant...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  No entries match active query or amount dial.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors group hover:bg-[var(--bg-hover)]"
                >
                  <td className="py-3 px-4 whitespace-nowrap text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(item.occurred_at)}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      <Tag className="w-3 h-3" style={{ color: 'var(--accent-green)' }} />
                      {item.category}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {item.merchant || 'Unassigned Vendor'}
                    </div>
                    {item.description && (
                      <div className="text-[11px] truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.description}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        borderColor: 'var(--border-subtle)',
                        color:
                          item.source === 'dial_pad'
                            ? 'var(--accent-yellow)'
                            : item.source === 'web'
                            ? 'var(--accent-green)'
                            : 'var(--accent-purple)',
                      }}
                    >
                      {item.source}
                    </span>
                  </td>

                  <td
                    className="py-3 px-4 text-right font-black text-sm whitespace-nowrap"
                    style={{ color: 'var(--accent-yellow)' }}
                  >
                    {formatCurrency(item.amount, item.currency || currency)}
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditExpense(item)}
                        title="Edit Entry"
                        className="p-1.5 rounded-xl border transition-colors hover:scale-110"
                        style={{
                          backgroundColor: 'var(--bg-base)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--accent-cyan)',
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteExpense(item.id)}
                        title="Delete Entry"
                        className="p-1.5 rounded-xl border transition-colors hover:scale-110"
                        style={{
                          backgroundColor: 'var(--bg-base)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--accent-magenta)',
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
