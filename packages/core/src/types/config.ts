// packages/core/src/types/config.ts

export interface ProjectConfig {
  name: string;
  url: string;
  description?: string;
}

export interface BrandingColors {
  primary: string;
  primaryLight?: string;
  bgDark?: string;
  textWhite?: string;
  textMuted?: string;
}

export interface BrandingFonts {
  heading: string;
  body: string;
}

export interface ThemeOverrides {
  preset?: 'dark' | 'light' | 'minimal';
  overrides?: {
    colors?: Partial<BrandingColors>;
    highlightStyle?: 'glow' | 'border' | 'fill';
  };
}

export interface BrandingConfig {
  logo?: string;
  logoLight?: string;
  theme: 'dark' | 'light' | 'minimal' | ThemeOverrides;
  colors?: BrandingColors;
  fonts?: BrandingFonts;
  highlightStyle?: 'glow' | 'border' | 'fill';
}

export interface VoiceoverSettings {
  stability: number;
  similarity_boost: number;
  speed: number;
}

export interface VoiceoverConfig {
  provider: 'elevenlabs' | 'openai' | 'google' | 'none';
  apiKey: string;
  voiceId?: string;
  voice?: string;
  model?: string;
  mode: 'auto' | 'approval';
  settings?: VoiceoverSettings;
  volume?: number;
  buffer?: number;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthSelectors {
  username: string;
  password: string;
  submit: string;
}

export interface AuthConfig {
  strategy: 'form' | 'cookie' | 'bearer' | 'none';
  loginUrl?: string;
  credentials?: AuthCredentials;
  selectors?: AuthSelectors;
  waitAfterLogin?: string;
  cookies?: Array<{ name: string; value: string; domain: string }>;
  token?: string;
}

export interface ViewportConfig {
  width: number;
  height: number;
}

export interface CaptureConfig {
  viewport: ViewportConfig;
  delay: number;
  auth?: AuthConfig;
}

export interface OutputConfig {
  fps: number;
  resolution: ViewportConfig;
  format: 'mp4' | 'webm';
  directory: string;
  codec?: string;
}

export interface MusicConfig {
  file: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  masterOnly?: boolean;
}

export interface DefaultsConfig {
  overlap: number;
  intro?: { duration: number };
  outro?: { duration: number; websiteUrl?: string; docsUrl?: string };
  sectionTitle?: { duration: number };
  callout?: { size: 'sm' | 'md' | 'lg' };
}

export interface AutoguideConfig {
  project: ProjectConfig;
  branding: BrandingConfig;
  voiceover: VoiceoverConfig;
  capture: CaptureConfig;
  output: OutputConfig;
  music?: MusicConfig;
  defaults: DefaultsConfig;
}
