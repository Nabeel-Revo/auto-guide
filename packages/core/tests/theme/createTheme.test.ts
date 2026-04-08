import { describe, it, expect } from 'vitest';
import { createTheme } from '../../src/theme/createTheme';
import { darkTheme } from '../../src/theme/presets/dark';
import { lightTheme } from '../../src/theme/presets/light';
import { minimalTheme } from '../../src/theme/presets/minimal';

describe('createTheme', () => {
  it('returns dark theme by default', () => {
    const theme = createTheme('dark');
    expect(theme.colors.primary).toBe('#6366f1');
    expect(theme.colors.bgDark).toBe('#0f172a');
    expect(theme.highlightStyle).toBe('glow');
  });

  it('returns light theme', () => {
    const theme = createTheme('light');
    expect(theme.colors.primary).toBe('#3b82f6');
    expect(theme.colors.bgDark).toBe('#f8fafc');
    expect(theme.highlightStyle).toBe('border');
  });

  it('returns minimal theme', () => {
    const theme = createTheme('minimal');
    expect(theme.colors.primary).toBe('#1e293b');
    expect(theme.highlightStyle).toBe('border');
  });

  it('merges overrides on top of preset', () => {
    const theme = createTheme({
      preset: 'dark',
      overrides: {
        colors: { primary: '#10b981' },
        highlightStyle: 'border',
      },
    });
    expect(theme.colors.primary).toBe('#10b981');
    expect(theme.colors.bgDark).toBe('#0f172a');
    expect(theme.highlightStyle).toBe('border');
  });

  it('merges overrides without clobbering unset color fields', () => {
    const theme = createTheme({
      preset: 'dark',
      overrides: {
        colors: { primary: '#ff0000' },
      },
    });
    expect(theme.colors.primaryLight).toBe('#818cf8');
    expect(theme.fonts.heading).toBe('Inter Tight');
  });
});
