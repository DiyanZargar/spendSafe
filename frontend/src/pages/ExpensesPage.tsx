import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { expenseService } from '../services/expenses';
import { RecentTransactionsTable } from '../components/RecentTransactionsTable';
import { ExpenseModal } from '../components/ExpenseModal';
import { Expense, ExpenseCreatePayload, Category } from '../types';

export const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const { data: expensesData, isLoading } = useQuery({
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Expenses Ledger</h2>
          <p className="text-xs text-slate-500">Manage and audit all financial transactions</p>
        </div>
        <button
          onClick={() => {
            setExpenseToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Expense</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <RecentTransactionsTable
          expenses={expensesData?.items || []}
          onDeleteExpense={(id) => deleteMutation.mutate(id)}
          onEditExpense={(exp) => {
            setExpenseToEdit(exp);
            setIsModalOpen(true);
          }}
          isLoading={isLoading}
        />
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        expenseToEdit={expenseToEdit}
        categories={categories}
      />
    </div>
  );
};
