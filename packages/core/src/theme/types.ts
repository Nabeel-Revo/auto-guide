export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  bgDark: string;
  bgMedium: string;
  bgLight: string;
  textWhite: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  highlight: string;
  highlightBorder: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface ThemeGradients {
  accent: string;
  highlight: string;
}

export interface AutoguideTheme {
  colors: ThemeColors;
  fonts: ThemeFonts;
  borderRadius: number;
  highlightStyle: 'glow' | 'border' | 'fill';
  gradients: ThemeGradients;
}

export interface ThemeInput {
  preset?: 'dark' | 'light' | 'minimal';
  overrides?: {
    colors?: Partial<ThemeColors>;
    fonts?: Partial<ThemeFonts>;
    borderRadius?: number;
    highlightStyle?: 'glow' | 'border' | 'fill';
    gradients?: Partial<ThemeGradients>;
  };
}
