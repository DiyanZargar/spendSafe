import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'monokai' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isMonokai: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('exp_theme');
    if (saved === 'light' || saved === 'monokai') {
      return saved;
    }
    return 'monokai'; // Default to Monokai as requested
  });

  useEffect(() => {
    localStorage.setItem('exp_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'monokai') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('monokai');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('monokai');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'monokai' ? 'light' : 'monokai'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isMonokai: theme === 'monokai' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
