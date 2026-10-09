import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { authService } from './services/auth';
import { User } from './types';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService
        .getMe()
        .then((u) => setCurrentUser(u))
        .catch(() => setCurrentUser(null));
    }
  }, []);

  // Not authenticated
  if (!currentUser && !authService.isAuthenticated()) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={() => setCurrentUser(authService.getCurrentUser())}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={() => setCurrentUser(authService.getCurrentUser())}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <AppLayout
      user={currentUser}
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
    >
      {currentTab === 'dashboard' && <DashboardPage />}
      {currentTab === 'expenses' && <ExpensesPage />}
      {currentTab === 'reports' && <ReportsPage />}
      {currentTab === 'settings' && <SettingsPage user={currentUser} />}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
