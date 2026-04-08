import type { AutoguideTheme } from '../types';

export const lightTheme: AutoguideTheme = {
  colors: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    bgDark: '#f8fafc',
    bgMedium: '#f1f5f9',
    bgLight: '#e2e8f0',
    textWhite: '#1e293b',
    textMuted: '#64748b',
    textSubtle: '#94a3b8',
    accent: '#3b82f6',
    highlight: 'rgba(59, 130, 246, 0.15)',
    highlightBorder: '#3b82f6',
  },
  fonts: {
    heading: 'Inter Tight',
    body: 'Inter Tight',
    mono: 'JetBrains Mono',
  },
  borderRadius: 10,
  highlightStyle: 'border',
  gradients: {
    accent: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    highlight: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(96, 165, 250, 0.08) 100%)',
  },
};
