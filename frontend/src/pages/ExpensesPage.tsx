import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Zap, Sliders, Receipt, RefreshCw } from 'lucide-react';
import { expenseService } from '../services/expenses';
import { RecentTransactionsTable } from '../components/RecentTransactionsTable';
import { AmountFilterDial } from '../components/AmountFilterDial';
import { TactileExpenseDialPad } from '../components/TactileExpenseDialPad';
import { ExpenseModal } from '../components/ExpenseModal';
import { Expense, ExpenseCreatePayload, Category } from '../types';
import { formatCurrency } from '../utils/formatters';

export const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialPadOpen, setIsDialPadOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Amount dial filter state
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(Infinity);

  const { data: expensesData, isLoading, refetch } = useQuery({
    queryKey: ['expenses', 'all'],
    queryFn: () => expenseService.getExpenses({ limit: 100 }),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => expenseService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ExpenseCreatePayload) => expenseService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseCreatePayload> }) =>
      expenseService.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const handleSave = async (data: ExpenseCreatePayload) => {
    if (expenseToEdit) {
      await updateMutation.mutateAsync({ id: expenseToEdit.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const allItems = expensesData?.items || [];
  const totalAmount = allItems.reduce((acc, item) => acc + Number(item.amount), 0);
  const currency = allItems[0]?.currency || 'USD';

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Top Ledger Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Transaction Ledger
            </h2>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-cyan)',
              }}
            >
              {allItems.length} RECORDS
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Cryptographically signed multi-channel journal
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            title="Refresh Ledger"
            className="p-2 rounded-2xl border transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Quick Tactile Dial Pad Button */}
          <button
            onClick={() => setIsDialPadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all hover:scale-105 active:scale-95 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--accent-yellow)',
              color: 'var(--accent-yellow)',
            }}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Tactile Dial</span>
          </button>

          {/* Standard Form Button */}
          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
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

      {/* Amount Filter Dial Component */}
      <AmountFilterDial
        minAmount={minAmount}
        maxAmount={maxAmount}
        onFilterChange={(min, max) => {
          setMinAmount(min);
          setMaxAmount(max);
        }}
        currency={currency}
      />

      {/* Ledger Table Container */}
      <div
        className="p-5 sm:p-6 rounded-3xl border transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <RecentTransactionsTable
          expenses={allItems}
          onDeleteExpense={(id) => deleteMutation.mutate(id)}
          onEditExpense={(exp) => {
            setExpenseToEdit(exp);
            setIsModalOpen(true);
          }}
          isLoading={isLoading}
          minAmountFilter={minAmount}
          maxAmountFilter={maxAmount}
          currency={currency}
        />
      </div>

      {/* Tactile Dial Pad Modal */}
      <TactileExpenseDialPad
        isOpen={isDialPadOpen}
        onClose={() => setIsDialPadOpen(false)}
        onSubmit={handleSave}
        categories={categories}
        currency={currency}
      />

      {/* Standard Form Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        expenseToEdit={expenseToEdit}
        categories={categories}
        defaultCurrency={currency}
      />
    </div>
  );
};
