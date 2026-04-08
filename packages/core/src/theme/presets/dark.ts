import type { AutoguideTheme } from '../types';

export const darkTheme: AutoguideTheme = {
  colors: {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    bgDark: '#0f172a',
    bgMedium: '#1e293b',
    bgLight: '#334155',
    textWhite: '#ffffff',
    textMuted: '#94a3b8',
    textSubtle: '#64748b',
    accent: '#6366f1',
    highlight: 'rgba(99, 102, 241, 0.3)',
    highlightBorder: '#6366f1',
  },
  fonts: {
    heading: 'Inter Tight',
    body: 'Inter Tight',
    mono: 'JetBrains Mono',
  },
  borderRadius: 12,
  highlightStyle: 'glow',
  gradients: {
    accent: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    highlight: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(129, 140, 248, 0.15) 100%)',
  },
};
