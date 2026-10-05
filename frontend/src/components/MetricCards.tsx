import React from 'react';
import { DollarSign, Calendar, TrendingUp, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
      {/* 1. Total Spending */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Total Spending</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
          {formatCurrency(totalAmount, currency)}
        </div>
        {comparison ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {comparison.percentage_change >= 0 ? (
              <span className="flex items-center text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                +{comparison.percentage_change.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                {comparison.percentage_change.toFixed(1)}%
              </span>
            )}
            <span className="text-slate-500 text-[11px] font-normal">vs last month</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Period total aggregate</div>
        )}
      </div>

      {/* 2. Transaction Count */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Transactions</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
          {transactionCount.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500">
          Average {formatCurrency(averageAmount, currency)} / txn
        </div>
      </div>

      {/* 3. Daily Average */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Avg Transaction</span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
          {formatCurrency(averageAmount, currency)}
        </div>
        <div className="text-xs text-slate-500">
          Computed across recorded events
        </div>
      </div>

      {/* 4. Top Category */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Top Category</span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-bold text-slate-900 mb-1 truncate">
          {topCategory ? topCategory.category : 'N/A'}
        </div>
        {topCategory ? (
          <div className="text-xs text-slate-500">
            {formatCurrency(topCategory.amount, currency)} ({topCategory.percentage.toFixed(0)}% of total)
          </div>
        ) : (
          <div className="text-xs text-slate-400">No category recorded</div>
        )}
      </div>
    </div>
  );
};
