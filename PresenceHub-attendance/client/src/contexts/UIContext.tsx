import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyTheme,
  readThemePreference,
  resolveTheme,
  saveThemePreference,
  type ThemePreference,
} from '../utils/theme';

interface UIContextType {
  // Mobile navigation drawer (below lg)
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  // Desktop collapsible sidebar
  isSidebarCollapsed: boolean;
  toggleCollapse: () => void;
  // Theme
  themePreference: ThemePreference;
  theme: 'light' | 'dark';
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const COLLAPSED_KEY = 'sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readCollapsed);
  const [themePreference, setPreferenceState] = useState<ThemePreference>(readThemePreference);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => resolveTheme(readThemePreference()));

  // Apply the theme, and follow OS changes while the preference is "system".
  useEffect(() => {
    const resolved = resolveTheme(themePreference);
    setTheme(resolved);
    applyTheme(resolved);
    if (themePreference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = media.matches ? 'dark' : 'light';
      setTheme(next);
      applyTheme(next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [themePreference]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    saveThemePreference(preference);
    setPreferenceState(preference);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setThemePreference]);

  const toggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, String(!prev));
      } catch {
        // Preference just won't persist.
      }
      return !prev;
    });
  }, []);

  const value = useMemo(
    () => ({
      isSidebarOpen,
      openSidebar: () => setIsSidebarOpen(true),
      closeSidebar: () => setIsSidebarOpen(false),
      isSidebarCollapsed,
      toggleCollapse,
      themePreference,
      theme,
      setThemePreference,
      toggleTheme,
    }),
    [isSidebarOpen, isSidebarCollapsed, toggleCollapse, themePreference, theme, setThemePreference, toggleTheme]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
