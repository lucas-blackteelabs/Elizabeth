import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, ThemeType } from './theme';

const ThemeContext = createContext<{ theme: ThemeType; toggleTheme: () => void } | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scheme = useColorScheme() ?? 'light';
  const [theme, setTheme] = useState(scheme === 'dark' ? darkTheme : lightTheme);
  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((t) => (t === lightTheme ? darkTheme : lightTheme)) }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
