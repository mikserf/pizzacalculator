import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update theme-color meta tag for iOS Safari status bar
    const themeColorMeta = document.querySelector('meta[name="theme-color"]:not([media])') || 
                          document.querySelector('meta[name="theme-color"]');
    
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? '#1A1714' : '#EDE6DA');
    } else {
      // Create meta tag if it doesn't exist
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = isDark ? '#1A1714' : '#EDE6DA';
      document.head.appendChild(meta);
    }
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};