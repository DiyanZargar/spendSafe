import React, { useState, useEffect } from 'react';
import { SpatialNavbar } from '../components/SpatialNavbar';
import { SpatialSidebar } from '../components/SpatialSidebar';
import { NeuralAICopilot } from '../components/NeuralAICopilot';
import { TactileExpenseDialPad } from '../components/TactileExpenseDialPad';
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
  const [isDialPadOpen, setIsDialPadOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true); // Default open sticky to viewport

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

  // Keyboard shortcut listener: Cmd/Ctrl + D for Dial Pad, Cmd/Ctrl + K for AI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDialPadOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Top Cyber Command HUD */}
      <SpatialNavbar
        user={user}
        onOpenDialPad={() => setIsDialPadOpen(true)}
        onOpenNewExpense={() => setIsNewExpenseOpen(true)}
        onToggleAiDrawer={() => setIsChatOpen(!isChatOpen)}
        isAiDrawerOpen={isChatOpen}
        onSearchFocus={() => setIsChatOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Spatial Ergonomic Sidebar */}
        <SpatialSidebar currentTab={currentTab} onSelectTab={onSelectTab} />

        {/* Dynamic Center Workstation */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-200"
          style={{ backgroundColor: 'var(--bg-base)' }}
        >
          {children}
        </main>

        {/* Viewport-Pinned Sticky AI Neural Co-Pilot Console */}
        {isChatOpen && (
          <aside className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 w-[350px] sm:w-[380px] animate-fadeIn pointer-events-auto">
            <NeuralAICopilot
              isFloating={true}
              onClose={() => setIsChatOpen(false)}
            />
          </aside>
        )}
      </div>

      {/* Tactile Dial Pad Modal */}
      <TactileExpenseDialPad
        isOpen={isDialPadOpen}
        onClose={() => setIsDialPadOpen(false)}
        onSubmit={handleSaveExpense}
        categories={categories}
        currency={user?.currency || 'USD'}
      />

      {/* Detailed Expense Modal */}
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
