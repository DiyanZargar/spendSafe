import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Plus } from 'lucide-react';
import { analyticsService } from '../services/analytics';
import { expenseService } from '../services/expenses';
import { MetricCards } from '../components/MetricCards';
import { SpendingTrendChart } from '../components/SpendingTrendChart';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart';
import { DailySpendingChart } from '../components/DailySpendingChart';
import { DayOfWeekChart } from '../components/DayOfWeekChart';
import { TopMerchantsList } from '../components/TopMerchantsList';
import { RecentTransactionsTable } from '../components/RecentTransactionsTable';
import { AIChatWidget } from '../components/AIChatWidget';
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

  // Expense Mutations
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

  const handleOpenCreate = () => {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Controls: Period Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                period === opt.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => refetchAnalytics()}
            title="Refresh Data"
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 1. Metric Cards */}
      <MetricCards
        summary={analytics?.summary}
        comparison={analytics?.comparison}
        categories={analytics?.categories}
      />

      {/* 2. Main Analytics Grid with Embedded AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spending Trend (Area) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Spending Trend</h3>
                <p className="text-xs text-slate-500">Daily spending trajectory for {period.replace('_', ' ')}</p>
              </div>
            </div>
            <SpendingTrendChart data={analytics?.trends || []} currency={currency} />
          </div>

          {/* 2 Sub-charts side by side: Daily spending & Day of Week */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">Daily Spend</h3>
              <p className="text-xs text-slate-500 mb-3">Calendar date distribution</p>
              <DailySpendingChart data={analytics?.trends || []} currency={currency} />
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">Day of Week</h3>
              <p className="text-xs text-slate-500 mb-3">Weekly spending patterns</p>
              <DayOfWeekChart data={analytics?.day_of_week || []} currency={currency} />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Category Donut & Embedded AI Chat Assistant */}
        <div className="space-y-6">
          {/* Category Breakdown */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-0.5">Category Breakdown</h3>
            <p className="text-xs text-slate-500 mb-3">Expense share by category</p>
            <CategoryBreakdownChart categories={analytics?.categories || []} currency={currency} />
          </div>

          {/* Embedded AI Finance Assistant */}
          <div className="h-[430px]">
            <AIChatWidget />
          </div>

          {/* Top Merchants Leaderboard */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-0.5">Top Merchants</h3>
            <p className="text-xs text-slate-500 mb-3">Highest spend vendors</p>
            <TopMerchantsList merchants={analytics?.top_merchants || []} currency={currency} />
          </div>
        </div>
      </div>

      {/* 3. Recent Transactions Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">All recorded transactions across Web and Channels</p>
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

      {/* Modal */}
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
