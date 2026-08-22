"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Accent = 'blue' | 'emerald' | 'violet' | 'rose';
type FontSize = 'small' | 'medium' | 'large';
type LayoutView = 'grid' | 'list';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  layoutView: LayoutView;
  setLayoutView: (view: LayoutView) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [accent, setAccent] = useState<Accent>('blue');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [layoutView, setLayoutView] = useState<LayoutView>('grid');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('hub_theme') as Theme;
    const savedAccent = localStorage.getItem('hub_accent') as Accent;
    const savedFontSize = localStorage.getItem('hub_fontSize') as FontSize;
    const savedLayout = localStorage.getItem('hub_layout') as LayoutView;

    if (savedTheme) setTheme(savedTheme);
    if (savedAccent) setAccent(savedAccent);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedLayout) setLayoutView(savedLayout);

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', accent);
    document.documentElement.setAttribute('data-font-size', fontSize);
    
    localStorage.setItem('hub_theme', theme);
    localStorage.setItem('hub_accent', accent);
    localStorage.setItem('hub_fontSize', fontSize);
    localStorage.setItem('hub_layout', layoutView);
  }, [theme, accent, fontSize, layoutView, mounted]);

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      accent, setAccent,
      fontSize, setFontSize,
      layoutView, setLayoutView
    }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden', display: 'contents' }}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
