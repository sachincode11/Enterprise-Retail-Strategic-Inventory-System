import React, { createContext, useContext, useState } from 'react';
import { LightColors, DarkColors, Typography, Spacing, Radius, Shadow } from '../constants/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(v => !v);

  const Colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, Colors, Typography, Spacing, Radius, Shadow }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
