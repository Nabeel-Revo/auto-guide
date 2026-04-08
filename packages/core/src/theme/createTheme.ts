import type { AutoguideTheme, ThemeInput } from './types';
import { darkTheme } from './presets/dark';
import { lightTheme } from './presets/light';
import { minimalTheme } from './presets/minimal';

const presets: Record<string, AutoguideTheme> = {
  dark: darkTheme,
  light: lightTheme,
  minimal: minimalTheme,
};

export function createTheme(input: string | ThemeInput): AutoguideTheme {
  if (typeof input === 'string') {
    const preset = presets[input];
    if (!preset) {
      throw new Error(`Unknown theme preset: "${input}". Use "dark", "light", or "minimal".`);
    }
    return preset;
  }

  const base = presets[input.preset ?? 'dark'];
  if (!base) {
    throw new Error(`Unknown theme preset: "${input.preset}". Use "dark", "light", or "minimal".`);
  }

  if (!input.overrides) {
    return base;
  }

  const { colors, fonts, gradients, ...scalarOverrides } = input.overrides;

  return {
    ...base,
    ...scalarOverrides,
    colors: { ...base.colors, ...colors },
    fonts: { ...base.fonts, ...fonts },
    gradients: { ...base.gradients, ...gradients },
  };
}
