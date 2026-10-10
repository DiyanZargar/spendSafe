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
  const [activeConsole, setActiveConsole] = useState<'copilot' | 'dialpad' | 'none'>('copilot');
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);

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
        setActiveConsole((prev) => (prev === 'dialpad' ? 'none' : 'dialpad'));
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveConsole((prev) => (prev === 'copilot' ? 'none' : 'copilot'));
      }
    };

    const handleCustomOpenDial = () => {
      setActiveConsole('dialpad');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-dialpad', handleCustomOpenDial);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-dialpad', handleCustomOpenDial);
    };
  }, []);

  return (
    <div
      className="h-screen max-h-screen flex flex-col overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Top Cyber Command HUD */}
      <SpatialNavbar
        user={user}
        onOpenDialPad={() => setActiveConsole((prev) => (prev === 'dialpad' ? 'none' : 'dialpad'))}
        onOpenNewExpense={() => setIsNewExpenseOpen(true)}
        onToggleAiDrawer={() => setActiveConsole((prev) => (prev === 'copilot' ? 'none' : 'copilot'))}
        isAiDrawerOpen={activeConsole === 'copilot'}
        isDialPadOpen={activeConsole === 'dialpad'}
        onSearchFocus={() => setActiveConsole('copilot')}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Spatial Ergonomic Sidebar */}
        <SpatialSidebar currentTab={currentTab} onSelectTab={onSelectTab} />

        {/* Dynamic Center Workstation */}
        <main
          className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 transition-colors duration-200"
          style={{ backgroundColor: 'var(--bg-base)' }}
        >
          {children}
        </main>

        {/* Viewport-Pinned Interactive Station (Hosts both Co-Pilot and Tactile Dial in exact same spot & size) */}
        {activeConsole !== 'none' && (
          <aside className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 w-[350px] sm:w-[380px] animate-fadeIn pointer-events-auto">
            {activeConsole === 'copilot' ? (
              <NeuralAICopilot
                isFloating={true}
                onClose={() => setActiveConsole('none')}
              />
            ) : (
              <TactileExpenseDialPad
                isOpen={true}
                onClose={() => setActiveConsole('none')}
                onSwitchToCopilot={() => setActiveConsole('copilot')}
                onSubmit={handleSaveExpense}
                categories={categories}
                currency={user?.currency || 'USD'}
              />
            )}
          </aside>
        )}
      </div>

      {/* Detailed Full-Form Modal (when requested) */}
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
