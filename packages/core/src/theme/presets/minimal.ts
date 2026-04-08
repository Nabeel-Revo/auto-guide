import type { AutoguideTheme } from '../types';

export const minimalTheme: AutoguideTheme = {
  colors: {
    primary: '#1e293b',
    primaryLight: '#334155',
    primaryDark: '#0f172a',
    bgDark: '#ffffff',
    bgMedium: '#f9fafb',
    bgLight: '#f3f4f6',
    textWhite: '#111827',
    textMuted: '#6b7280',
    textSubtle: '#9ca3af',
    accent: '#1e293b',
    highlight: 'rgba(30, 41, 59, 0.1)',
    highlightBorder: '#1e293b',
  },
  fonts: {
    heading: 'Inter Tight',
    body: 'Inter Tight',
    mono: 'JetBrains Mono',
  },
  borderRadius: 8,
  highlightStyle: 'border',
  gradients: {
    accent: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    highlight: 'linear-gradient(135deg, rgba(30, 41, 59, 0.1) 0%, rgba(51, 65, 85, 0.05) 100%)',
  },
};
