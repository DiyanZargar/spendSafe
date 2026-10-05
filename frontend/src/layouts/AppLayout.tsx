import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { AIChatWidget } from '../components/AIChatWidget';
import { ExpenseModal } from '../components/ExpenseModal';
import { User, ExpenseCreatePayload, Category } from '../types';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { expenseService } from '../services/expenses';

interface AppLayoutProps {
  user: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  currentTab,
  onSelectTab,
  children,
}) => {
  const queryClient = useQueryClient();
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

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

  const handleSaveExpense = async (data: ExpenseCreatePayload) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        user={user}
        onOpenNewExpense={() => setIsNewExpenseOpen(true)}
        onToggleChat={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
        isChatOpen={isChatDrawerOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Slide-out AI Assistant Drawer (when toggled from Navbar) */}
        {isChatDrawerOpen && (
          <aside className="w-80 lg:w-96 border-l border-slate-200 bg-white shadow-xl p-3 flex flex-col shrink-0 animate-slideLeft">
            <div className="h-full">
              <AIChatWidget />
            </div>
          </aside>
        )}
      </div>

      <ExpenseModal
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
        onSubmit={handleSaveExpense}
        categories={categories}
        defaultCurrency={user?.currency || 'USD'}
      />
    </div>
  );
};
