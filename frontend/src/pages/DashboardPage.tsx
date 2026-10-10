import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Plus, Zap, Store, Layers, BarChart3, Activity } from 'lucide-react';
import { analyticsService } from '../services/analytics';
import { expenseService } from '../services/expenses';
import { MetricCards } from '../components/MetricCards';
import { BurnRateGaugeDial } from '../components/BurnRateGaugeDial';
import { SpendingTrendChart } from '../components/SpendingTrendChart';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart';
import { DailySpendingChart } from '../components/DailySpendingChart';
import { DayOfWeekChart } from '../components/DayOfWeekChart';
import { TopMerchantsList } from '../components/TopMerchantsList';
import { RecentTransactionsTable } from '../components/RecentTransactionsTable';
import { ExpenseModal } from '../components/ExpenseModal';
import { Expense, ExpenseCreatePayload, Category } from '../types';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'previous_month', label: 'Previous Month' },
  { id: 'this_year', label: 'This Year' },
];

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<string>('this_month');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // 1. Fetch Analytics for selected period
  const {
    data: analytics,
    refetch: refetchAnalytics,
    isFetching: isFetchingAnalytics,
  } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => analyticsService.getDashboard({ period }),
  });

  // 2. Fetch Recent Transactions
  const {
    data: expensesData,
    isLoading: isExpensesLoading,
  } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses({ limit: 15 }),
  });

  // 3. Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => expenseService.getCategories(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ExpenseCreatePayload) => expenseService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseCreatePayload> }) =>
      expenseService.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const handleOpenCreateModal = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (data: ExpenseCreatePayload) => {
    if (expenseToEdit) {
      await updateMutation.mutateAsync({ id: expenseToEdit.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const currency = analytics?.summary?.currency || 'USD';
  const currentPeriodLabel = PERIOD_OPTIONS.find((p) => p.id === period)?.label || 'This Month';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Top Telemetry & Control Island */}
      <div
        className="p-3 sm:p-4 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none font-mono">
          {PERIOD_OPTIONS.map((opt) => {
            const active = period === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  active ? 'shadow-md scale-102' : 'hover:scale-101 opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: active ? 'var(--bg-hover)' : 'var(--bg-base)',
                  borderColor: active ? 'var(--accent-magenta)' : 'var(--border-subtle)',
                  color: active ? 'var(--accent-magenta)' : 'var(--text-secondary)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
          <button
            onClick={() => refetchAnalytics()}
            title="Recalculate Telemetry"
            className="p-2 rounded-2xl border transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingAnalytics ? 'animate-spin' : ''}`} />
          </button>

          {/* Quick Tactile Dial Pad Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-dialpad'))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all hover:scale-105 active:scale-95 border"
            style={{
              backgroundColor: 'var(--bg-base)',
              borderColor: 'var(--accent-yellow)',
              color: 'var(--accent-yellow)',
            }}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Tactile Dial</span>
          </button>

          {/* New Expense Modal Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-fg)',
              boxShadow: '0 4px 14px var(--accent-primary-glow)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Write Entry</span>
          </button>
        </div>
      </div>

      {/* 1. Metric Telemetry Cards (4 balanced cards) */}
      <MetricCards
        summary={analytics?.summary}
        comparison={analytics?.comparison}
        categories={analytics?.categories}
      />

      {/* 2. Primary Telemetry Row: Speedometer Dial (1 Col) & Trajectory Curve (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speedometer Radial Gauge Dial */}
        <div className="lg:col-span-1 h-full">
          <BurnRateGaugeDial
            summary={analytics?.summary}
            comparison={analytics?.comparison}
            periodLabel={currentPeriodLabel}
          />
        </div>

        {/* Trajectory Curve (Recharts) */}
        <div
          className="lg:col-span-2 p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center justify-between mb-3 font-mono">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Trajectory Curve
              </h3>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Continuous spend accumulation ({currentPeriodLabel})
              </p>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border font-mono"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-green)',
              }}
            >
              RECHARTS • LIVE
            </span>
          </div>
          <SpendingTrendChart data={analytics?.trends || []} currency={currency} />
        </div>
      </div>

      {/* 3. Balanced 3-Column Distribution Row: Donut + Daily Bars + Cyclical Heatmap (ZERO EMPTY SPACE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Channel Spectrum Donut */}
        <div
          className="p-5 rounded-3xl border transition-all"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
            <h3 className="text-xs font-bold uppercase font-mono" style={{ color: 'var(--text-primary)' }}>
              Channel Spectrum
            </h3>
          </div>
          <p className="text-[10px] font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
            Expense weight by category
          </p>
          <CategoryBreakdownChart categories={analytics?.categories || []} currency={currency} />
        </div>

        {/* Calendar Date Velocity Bars */}
        <div
          className="p-5 rounded-3xl border transition-all"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
            <h3 className="text-xs font-bold uppercase font-mono" style={{ color: 'var(--text-primary)' }}>
              Calendar Date Velocity
            </h3>
          </div>
          <p className="text-[10px] font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
            Daily ledger distribution
          </p>
          <DailySpendingChart data={analytics?.trends || []} currency={currency} />
        </div>

        {/* Cyclical Day of Week Heatmap */}
        <div
          className="p-5 rounded-3xl border transition-all"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-main)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5" style={{ color: 'var(--accent-magenta)' }} />
            <h3 className="text-xs font-bold uppercase font-mono" style={{ color: 'var(--text-primary)' }}>
              Cyclical Heatmap
            </h3>
          </div>
          <p className="text-[10px] font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
            Day of week spending bias
          </p>
          <DayOfWeekChart data={analytics?.day_of_week || []} currency={currency} />
        </div>
      </div>

      {/* 4. Merchant Volume Row */}
      <div
        className="p-5 sm:p-6 rounded-3xl border transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Store className="w-3.5 h-3.5" style={{ color: 'var(--accent-yellow)' }} />
          <h3 className="text-xs font-bold uppercase font-mono tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Merchant Concentration
          </h3>
        </div>
        <p className="text-[10px] font-mono mb-4" style={{ color: 'var(--text-muted)' }}>
          Top counterparties sorted by cumulative outflow
        </p>
        <TopMerchantsList merchants={analytics?.top_merchants || []} currency={currency} />
      </div>

      {/* 5. Recent Transactions Ledger */}
      <div
        className="p-5 sm:p-6 rounded-3xl border transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <div className="flex items-center justify-between mb-4 font-mono">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Active Ledger Entries
            </h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Audit log synchronized across Web, Dial Pad, and Channel bots
            </p>
          </div>
        </div>
        <RecentTransactionsTable
          expenses={expensesData?.items || []}
          onDeleteExpense={(id) => deleteMutation.mutate(id)}
          onEditExpense={handleOpenEdit}
          currency={currency}
          isLoading={isExpensesLoading}
        />
      </div>

      {/* Standard Form Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        categories={categories}
        defaultCurrency={currency}
      />
    </div>
  );
};
