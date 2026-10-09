import React from 'react';
import { DollarSign, Calendar, TrendingUp, Layers, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { SpendingSummary, MonthlyComparison, CategoryBreakdown } from '../types';
import { formatCurrency } from '../utils/formatters';

interface MetricCardsProps {
  summary?: SpendingSummary;
  comparison?: MonthlyComparison | null;
  categories?: CategoryBreakdown[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  summary,
  comparison,
  categories,
}) => {
  const currency = summary?.currency || 'USD';
  const totalAmount = summary?.total_amount || 0;
  const transactionCount = summary?.transaction_count || 0;
  const averageAmount = summary?.average_amount || 0;

  const topCategory = categories && categories.length > 0 ? categories[0] : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Spending (Monokai Yellow / Green Accent) */}
      <div
        className="p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group hover:scale-101 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-70 group-hover:opacity-100"
          style={{ backgroundColor: 'var(--accent-yellow)' }}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Aggregate Spend
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-mono border"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-yellow)',
            }}
          >
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div
          className="text-2xl sm:text-3xl font-black tracking-tight mb-2 font-mono"
          style={{ color: 'var(--accent-yellow)' }}
        >
          {formatCurrency(totalAmount, currency)}
        </div>

        {comparison ? (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {comparison.percentage_change >= 0 ? (
              <span
                className="flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 12%, transparent)',
                  borderColor: 'var(--accent-magenta)',
                  color: 'var(--accent-magenta)',
                }}
              >
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +{comparison.percentage_change.toFixed(1)}%
              </span>
            ) : (
              <span
                className="flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-green) 12%, transparent)',
                  borderColor: 'var(--accent-green)',
                  color: 'var(--accent-green)',
                }}
              >
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                {comparison.percentage_change.toFixed(1)}%
              </span>
            )}
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vs prior period</span>
          </div>
        ) : (
          <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            Real-time aggregate
          </div>
        )}
      </div>

      {/* 2. Transaction Count (Monokai Cyan Accent) */}
      <div
        className="p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group hover:scale-101 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-70 group-hover:opacity-100"
          style={{ backgroundColor: 'var(--accent-cyan)' }}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Transaction Volume
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-mono border"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-cyan)',
            }}
          >
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div
          className="text-2xl sm:text-3xl font-black tracking-tight mb-2 font-mono"
          style={{ color: 'var(--text-primary)' }}
        >
          {transactionCount.toLocaleString()}
        </div>

        <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Rate: <span style={{ color: 'var(--accent-cyan)' }}>{formatCurrency(averageAmount, currency)}</span> / txn
        </div>
      </div>

      {/* 3. Daily Average (Monokai Purple Accent) */}
      <div
        className="p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group hover:scale-101 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-70 group-hover:opacity-100"
          style={{ backgroundColor: 'var(--accent-purple)' }}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Avg Ticket
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-mono border"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-purple)',
            }}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div
          className="text-2xl sm:text-3xl font-black tracking-tight mb-2 font-mono"
          style={{ color: 'var(--accent-purple)' }}
        >
          {formatCurrency(averageAmount, currency)}
        </div>

        <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Normalized mean spend
        </div>
      </div>

      {/* 4. Top Category (Monokai Green / Magenta Accent) */}
      <div
        className="p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group hover:scale-101 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-70 group-hover:opacity-100"
          style={{ backgroundColor: 'var(--accent-green)' }}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Dominant Channel
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-mono border"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-green)',
            }}
          >
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div
          className="text-lg sm:text-xl font-bold truncate mb-1"
          style={{ color: 'var(--accent-green)' }}
        >
          {topCategory ? topCategory.category : 'N/A'}
        </div>

        {topCategory ? (
          <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {formatCurrency(topCategory.amount, currency)} ({topCategory.percentage.toFixed(0)}% allocation)
          </div>
        ) : (
          <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            Awaiting records
          </div>
        )}
      </div>
    </div>
  );
};
