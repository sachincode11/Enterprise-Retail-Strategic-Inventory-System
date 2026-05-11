import { Platform } from 'react-native';

// ─── Light Theme Colors ────────────────────────────────────
export const LightColors = {
  bgBase: '#f0f4f8',
  bgCard: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  accentPrimary: '#1e3a5f',
  accentHover: '#16324f',
  accentLight: '#dbeafe',
  border: '#e2e8f0',
  borderDark: '#1e293b',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
};

// ─── Dark Theme Colors ─────────────────────────────────────
export const DarkColors = {
  bgBase: '#0f172a',
  bgCard: '#1e293b',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accentPrimary: '#3b82f6',
  accentHover: '#2563eb',
  accentLight: '#1e3a5f',
  border: '#334155',
  borderDark: '#475569',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
};

// Default export — overridden at runtime via ThemeContext
export const Colors = LightColors;

export const Typography = {
  fontFamily: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_700Bold',
    mono: 'DMMono_400Regular',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 28,
    xxxl: 34,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const Shadow = {
  sm: Platform.select({
    web: { boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' },
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' },
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  }),
  lg: Platform.select({
    web: { boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)' },
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  }),
};
