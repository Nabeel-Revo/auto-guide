# Phase 1: Monorepo Setup + @autoguide/core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the pnpm monorepo and build the `@autoguide/core` package — all Remotion components, compositions, theme system, and TypeScript types needed by the CLI and end users.

**Architecture:** pnpm workspaces monorepo with `packages/core/` as the first package. Core is a pure Remotion + React library with zero CLI dependencies. It exports components, compositions, theme utilities, and type definitions. Built with tsup for dual CJS/ESM output.

**Tech Stack:** Remotion 4.x, React 18, TypeScript 5, tsup, vitest, pnpm workspaces

**Reference Implementation:** `D:\1. Projects\@ Repos\hrm\video-guides\` — the ZenDash video guides project this was extracted from.

**Design Spec:** `docs/specs/2026-04-08-autoguide-design.md`

---

## Phase Overview

| Task | What it builds | Depends on |
|------|---------------|------------|
| 1 | Monorepo scaffolding | — |
| 2 | Core types (`plan.ts`, `config.ts`) | Task 1 |
| 3 | Theme system (types, presets, `createTheme`) | Task 2 |
| 4 | `ScreenshotScene` component | Task 3 |
| 5 | `HighlightOverlay` component | Task 3 |
| 6 | `TextCallout` component | Task 3 |
| 7 | `IntroSlide` component | Task 3 |
| 8 | `OutroSlide` component | Task 3 |
| 9 | `SectionTitle` component | Task 3 |
| 10 | `TransitionWipe` component | Task 3 |
| 11 | `VideoComposition` + `MasterComposition` | Tasks 4–10 |
| 12 | Barrel exports + tsup build | Task 11 |

## File Map

```
packages/core/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts                          # Barrel export
│   ├── types/
│   │   ├── plan.ts                       # VideoPlan, Scene, Highlight, etc.
│   │   └── config.ts                     # AutoguideConfig interface
│   ├── theme/
│   │   ├── types.ts                      # AutoguideTheme interface
│   │   ├── presets/
│   │   │   ├── dark.ts
│   │   │   ├── light.ts
│   │   │   └── minimal.ts
│   │   ├── createTheme.ts                # Merge preset + overrides
│   │   └── index.ts                      # Theme barrel
│   ├── components/
│   │   ├── IntroSlide.tsx
│   │   ├── OutroSlide.tsx
│   │   ├── ScreenshotScene.tsx
│   │   ├── HighlightOverlay.tsx
│   │   ├── TextCallout.tsx
│   │   ├── SectionTitle.tsx
│   │   ├── TransitionWipe.tsx
│   │   └── index.ts                      # Component barrel
│   └── compositions/
│       ├── VideoComposition.tsx
│       ├── MasterComposition.tsx
│       └── index.ts                      # Composition barrel
└── tests/
    ├── theme/
    │   └── createTheme.test.ts
    └── types/
        └── plan.test.ts
```

---

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`
- Create: `.gitignore`
- Create: `tsconfig.json` (root)
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/tsup.config.ts`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "autoguide",
  "version": "0.0.0",
  "private": true,
  "description": "Automated video guide generator for software products",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "clean": "pnpm -r clean"
  },
  "devDependencies": {
    "typescript": "^5.5.4"
  },
  "packageManager": "pnpm@9.15.4",
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Create .npmrc**

```ini
shamefully-hoist=true
strict-peer-dependencies=false
```

- [ ] **Step 4: Create .gitignore**

```gitignore
node_modules/
dist/
output/
.env
*.mp4
*.mp3
.autoguide/
*.tsbuildinfo
```

- [ ] **Step 5: Create root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 6: Create packages/core/package.json**

```json
{
  "name": "@autoguide/core",
  "version": "0.1.0",
  "description": "Remotion components, theme system, and types for Autoguide",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf dist"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "remotion": "^4.0.0"
  },
  "dependencies": {
    "@remotion/google-fonts": "^4.0.445"
  },
  "devDependencies": {
    "@remotion/cli": "4.0.445",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "remotion": "4.0.445",
    "tsup": "^8.0.0",
    "typescript": "^5.5.4",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 7: Create packages/core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Create packages/core/tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'remotion', '@remotion/google-fonts'],
});
```

- [ ] **Step 9: Install dependencies**

Run: `pnpm install`
Expected: Lockfile created, all packages installed without errors.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-workspace.yaml .npmrc .gitignore tsconfig.json packages/core/package.json packages/core/tsconfig.json packages/core/tsup.config.ts pnpm-lock.yaml
git commit -m "chore: scaffold pnpm monorepo with @autoguide/core package"
```

---

### Task 2: Core Types

**Files:**
- Create: `packages/core/src/types/plan.ts`
- Create: `packages/core/src/types/config.ts`
- Create: `packages/core/tests/types/plan.test.ts`

- [ ] **Step 1: Write type validation tests**

```typescript
// packages/core/tests/types/plan.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type {
  VideoPlan,
  VideoMeta,
  SceneSection,
  Scene,
  SceneCapture,
  CaptureAction,
  HighlightBox,
  TextCalloutConfig,
  VoiceoverEntry,
  PlanMetadata,
  OutroConfig,
  IntroConfig,
} from '../../src/types/plan';
import type { AutoguideConfig } from '../../src/types/config';

describe('VideoPlan types', () => {
  it('should have correct structure', () => {
    expectTypeOf<VideoPlan>().toHaveProperty('video');
    expectTypeOf<VideoPlan>().toHaveProperty('intro');
    expectTypeOf<VideoPlan>().toHaveProperty('sections');
    expectTypeOf<VideoPlan>().toHaveProperty('outro');
    expectTypeOf<VideoPlan>().toHaveProperty('metadata');
  });

  it('Scene should support auto and manual capture modes', () => {
    expectTypeOf<SceneCapture>().toHaveProperty('mode');
  });

  it('CaptureAction should support all action types', () => {
    const clickAction: CaptureAction = { type: 'click', selector: '.btn' };
    const typeAction: CaptureAction = { type: 'type', selector: '#input', text: 'hello' };
    const waitAction: CaptureAction = { type: 'wait', ms: 1000 };
    expectTypeOf(clickAction).toMatchTypeOf<CaptureAction>();
    expectTypeOf(typeAction).toMatchTypeOf<CaptureAction>();
    expectTypeOf(waitAction).toMatchTypeOf<CaptureAction>();
  });
});

describe('AutoguideConfig types', () => {
  it('should have correct structure', () => {
    expectTypeOf<AutoguideConfig>().toHaveProperty('project');
    expectTypeOf<AutoguideConfig>().toHaveProperty('branding');
    expectTypeOf<AutoguideConfig>().toHaveProperty('voiceover');
    expectTypeOf<AutoguideConfig>().toHaveProperty('capture');
    expectTypeOf<AutoguideConfig>().toHaveProperty('output');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && npx vitest run tests/types/plan.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create plan types**

```typescript
// packages/core/src/types/plan.ts

// ─── Voiceover ───

export interface VoiceoverEntry {
  script: string;
  file: string | null;
  duration: number | null;
}

// ─── Capture ───

export type CaptureAction =
  | { type: 'click'; selector: string }
  | { type: 'type'; selector: string; text: string }
  | { type: 'hover'; selector: string }
  | { type: 'wait'; ms: number }
  | { type: 'waitForSelector'; selector: string; timeout?: number }
  | { type: 'scroll'; y: number }
  | { type: 'select'; selector: string; value: string }
  | { type: 'press'; key: string }
  | { type: 'evaluate'; script: string };

export interface AutoCapture {
  mode: 'auto';
  route: string;
  actions: CaptureAction[];
  waitFor?: string;
  delay?: number;
}

export interface ManualCapture {
  mode: 'manual';
  instructions: string;
}

export type SceneCapture = AutoCapture | ManualCapture;

// ─── Highlights & Callouts ───

export interface HighlightBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  delay?: number;
}

export interface TextCalloutConfig {
  text: string;
  x: number;
  y: number;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
}

// ─── Scenes ───

export interface Scene {
  id: string;
  type: 'screenshot';
  capture: SceneCapture;
  screenshot: string | null;
  duration: number;
  caption?: string;
  highlights: HighlightBox[];
  callout?: TextCalloutConfig;
  voiceover: VoiceoverEntry;
}

export interface SceneSection {
  id: string;
  title: string;
  subtitle?: string;
  step: string;
  voiceover: VoiceoverEntry;
  scenes: Scene[];
}

// ─── Intro / Outro ───

export interface IntroConfig {
  title: string;
  subtitle?: string;
  duration: number;
  voiceover: VoiceoverEntry;
}

export interface OutroConfig {
  nextVideoTitle?: string;
  duration: number;
  voiceover: VoiceoverEntry;
}

// ─── Video Metadata ───

export interface VideoMeta {
  id: string;
  title: string;
  module: string;
  videoNumber: number;
}

export interface PlanMetadata {
  totalDuration: number | null;
  totalFrames: number | null;
  screenshotsCaptured: number;
  screenshotsTotal: number;
  voiceoverGenerated: number;
  voiceoverTotal: number;
  lastBuilt: string | null;
  lastRendered: string | null;
}

// ─── Full Video Plan ───

export interface VideoPlan {
  video: VideoMeta;
  intro: IntroConfig;
  sections: SceneSection[];
  outro: OutroConfig;
  metadata: PlanMetadata;
}
```

- [ ] **Step 4: Create config types**

```typescript
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/core && npx vitest run tests/types/plan.test.ts`
Expected: PASS — all type-level assertions succeed.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types/ packages/core/tests/types/
git commit -m "feat(core): add VideoPlan and AutoguideConfig type definitions"
```

---

### Task 3: Theme System

**Files:**
- Create: `packages/core/src/theme/types.ts`
- Create: `packages/core/src/theme/presets/dark.ts`
- Create: `packages/core/src/theme/presets/light.ts`
- Create: `packages/core/src/theme/presets/minimal.ts`
- Create: `packages/core/src/theme/createTheme.ts`
- Create: `packages/core/src/theme/index.ts`
- Create: `packages/core/tests/theme/createTheme.test.ts`

- [ ] **Step 1: Write createTheme tests**

```typescript
// packages/core/tests/theme/createTheme.test.ts
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
    expect(theme.colors.bgDark).toBe('#0f172a'); // inherited from dark
    expect(theme.highlightStyle).toBe('border');
  });

  it('merges overrides without clobbering unset color fields', () => {
    const theme = createTheme({
      preset: 'dark',
      overrides: {
        colors: { primary: '#ff0000' },
      },
    });
    expect(theme.colors.primaryLight).toBe('#818cf8'); // kept from dark
    expect(theme.fonts.heading).toBe('Inter Tight');   // kept from dark
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && npx vitest run tests/theme/createTheme.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create theme types**

```typescript
// packages/core/src/theme/types.ts

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
```

- [ ] **Step 4: Create dark preset**

```typescript
// packages/core/src/theme/presets/dark.ts
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
```

- [ ] **Step 5: Create light preset**

```typescript
// packages/core/src/theme/presets/light.ts
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
```

- [ ] **Step 6: Create minimal preset**

```typescript
// packages/core/src/theme/presets/minimal.ts
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
```

- [ ] **Step 7: Create createTheme function**

```typescript
// packages/core/src/theme/createTheme.ts
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
```

- [ ] **Step 8: Create theme barrel export**

```typescript
// packages/core/src/theme/index.ts
export { createTheme } from './createTheme';
export { darkTheme } from './presets/dark';
export { lightTheme } from './presets/light';
export { minimalTheme } from './presets/minimal';
export type { AutoguideTheme, ThemeColors, ThemeFonts, ThemeGradients, ThemeInput } from './types';
```

- [ ] **Step 9: Run tests**

Run: `cd packages/core && npx vitest run tests/theme/createTheme.test.ts`
Expected: PASS — all 5 tests pass.

- [ ] **Step 10: Commit**

```bash
git add packages/core/src/theme/ packages/core/tests/theme/
git commit -m "feat(core): add theme system with dark/light/minimal presets and createTheme"
```

---

### Task 4: ScreenshotScene Component

**Files:**
- Create: `packages/core/src/components/ScreenshotScene.tsx`

- [ ] **Step 1: Create ScreenshotScene component**

```tsx
// packages/core/src/components/ScreenshotScene.tsx
import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface ZoomTarget {
  x: number;
  y: number;
  scale: number;
}

export interface ScreenshotSceneProps {
  src: string;
  zoomTo?: ZoomTarget;
  zoomDelay?: number;
  caption?: string;
  captionPosition?: 'top' | 'bottom';
  durationInFrames: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

export const ScreenshotScene: React.FC<ScreenshotSceneProps> = ({
  src,
  zoomTo,
  zoomDelay = 30,
  caption,
  captionPosition = 'bottom',
  durationInFrames,
  fadeInDuration = 8,
  fadeOutDuration = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in/out
  const opacity = interpolate(
    frame,
    [0, fadeInDuration, durationInFrames - fadeOutDuration, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Zoom
  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  if (zoomTo) {
    const zoomStart = zoomDelay;
    const zoomEnd = zoomStart + fps; // 1 second zoom duration
    const progress = interpolate(frame, [zoomStart, zoomEnd], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    scale = interpolate(progress, [0, 1], [1, zoomTo.scale]);
    translateX = interpolate(progress, [0, 1], [0, -(zoomTo.x - 50)]);
    translateY = interpolate(progress, [0, 1], [0, -(zoomTo.y - 50)]);
  }

  // Caption
  const captionOpacity = caption
    ? interpolate(frame, [15, 25], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0f1a', opacity }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transformOrigin: 'center center',
            transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
          }}
        />
      </div>

      {caption && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            ...(captionPosition === 'bottom'
              ? { bottom: 0 }
              : { top: 0 }),
            padding: '16px 32px',
            background:
              captionPosition === 'bottom'
                ? 'linear-gradient(transparent, rgba(0,0,0,0.7))'
                : 'linear-gradient(rgba(0,0,0,0.7), transparent)',
            opacity: captionOpacity,
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: 22,
              fontWeight: 600,
              fontFamily: 'Inter Tight, system-ui, sans-serif',
              textAlign: 'center',
            }}
          >
            {caption}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/components/ScreenshotScene.tsx
git commit -m "feat(core): add ScreenshotScene component with zoom and caption"
```

---

### Task 5: HighlightOverlay Component

**Files:**
- Create: `packages/core/src/components/HighlightOverlay.tsx`

- [ ] **Step 1: Create HighlightOverlay component**

```tsx
// packages/core/src/components/HighlightOverlay.tsx
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface HighlightBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface HighlightOverlayProps {
  highlights: HighlightBoxProps[];
  delay?: number;
  color?: string;
  style?: 'glow' | 'border' | 'fill';
}

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({
  highlights,
  delay = 0,
  color = '#6366f1',
  style = 'glow',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {highlights.map((h, i) => {
        const itemDelay = delay + i * 10;
        const progress = spring({
          frame: frame - itemDelay,
          fps,
          config: { damping: 15, stiffness: 100 },
        });

        const scale = interpolate(progress, [0, 1], [0.85, 1]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);

        const boxStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${h.x}%`,
          top: `${h.y}%`,
          width: `${h.width}%`,
          height: `${h.height}%`,
          transform: `scale(${scale})`,
          opacity,
          borderRadius: 8,
          ...(style === 'glow'
            ? {
                border: `2px solid ${color}`,
                boxShadow: `0 0 20px ${color}40, inset 0 0 20px ${color}10`,
              }
            : style === 'border'
              ? {
                  border: `2px solid ${color}`,
                }
              : {
                  backgroundColor: `${color}20`,
                  border: `1px solid ${color}40`,
                }),
        };

        return (
          <React.Fragment key={i}>
            <div style={boxStyle} />
            {h.label && (
              <div
                style={{
                  position: 'absolute',
                  left: `${h.x}%`,
                  top: `${h.y - 3.5}%`,
                  opacity,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Inter Tight, system-ui, sans-serif',
                  color: '#ffffff',
                  backgroundColor: color,
                  padding: '4px 10px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                {h.label}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/components/HighlightOverlay.tsx
git commit -m "feat(core): add HighlightOverlay component with glow/border/fill styles"
```

---

### Task 6: TextCallout Component

**Files:**
- Create: `packages/core/src/components/TextCallout.tsx`

- [ ] **Step 1: Create TextCallout component**

```tsx
// packages/core/src/components/TextCallout.tsx
import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TextCalloutProps {
  text: string;
  x: number;
  y: number;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
  accentColor?: string;
}

const fontSizes: Record<string, number> = {
  sm: 16,
  md: 20,
  lg: 26,
};

export const TextCallout: React.FC<TextCalloutProps> = ({
  text,
  x,
  y,
  delay = 0,
  size = 'md',
  align = 'left',
  accentColor = '#6366f1',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const translateY = (1 - progress) * 10;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(${align === 'center' ? '-50%' : '0'}, ${translateY}px)`,
          opacity: progress,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderLeft: `4px solid ${accentColor}`,
          padding: '10px 18px',
          borderRadius: '0 8px 8px 0',
          maxWidth: '45%',
          ...(align === 'right' && { textAlign: 'right' }),
        }}
      >
        <div
          style={{
            color: '#f8fafc',
            fontSize: fontSizes[size] ?? fontSizes.md,
            fontWeight: 500,
            fontFamily: 'Inter Tight, system-ui, sans-serif',
            lineHeight: 1.4,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/components/TextCallout.tsx
git commit -m "feat(core): add TextCallout component"
```

---

### Task 7: IntroSlide Component

**Files:**
- Create: `packages/core/src/components/IntroSlide.tsx`

- [ ] **Step 1: Create IntroSlide component**

```tsx
// packages/core/src/components/IntroSlide.tsx
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { AutoguideTheme } from '../theme/types';
import { darkTheme } from '../theme/presets/dark';

export interface IntroSlideProps {
  title: string;
  subtitle?: string;
  videoNumber: number;
  moduleName?: string;
  theme?: AutoguideTheme;
}

export const IntroSlide: React.FC<IntroSlideProps> = ({
  title,
  subtitle,
  videoNumber,
  moduleName,
  theme = darkTheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeProgress = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const titleProgress = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const subtitleOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `${theme.fonts.heading}, system-ui, sans-serif`,
      }}
    >
      {/* Accent line at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: theme.gradients.accent,
        }}
      />

      {/* Module badge */}
      <div
        style={{
          opacity: badgeProgress,
          transform: `scale(${interpolate(badgeProgress, [0, 1], [0.8, 1])})`,
          border: `1px solid ${theme.colors.primaryLight}40`,
          borderRadius: 20,
          padding: '6px 20px',
          marginBottom: 24,
          fontSize: 16,
          fontWeight: 600,
          color: theme.colors.primaryLight,
          letterSpacing: 1,
        }}
      >
        {moduleName ? `${moduleName} — Video ${String(videoNumber).padStart(2, '0')}` : `Video ${String(videoNumber).padStart(2, '0')}`}
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleProgress,
          transform: `translateY(${titleY}px)`,
          fontSize: 72,
          fontWeight: 800,
          color: theme.colors.textWhite,
          textAlign: 'center',
          maxWidth: '80%',
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            opacity: subtitleOpacity,
            fontSize: 28,
            fontWeight: 400,
            color: theme.colors.textMuted,
            marginTop: 20,
            textAlign: 'center',
            maxWidth: '70%',
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/components/IntroSlide.tsx
git commit -m "feat(core): add IntroSlide component with animated entrance"
```

---

### Task 8: OutroSlide Component

**Files:**
- Create: `packages/core/src/components/OutroSlide.tsx`

- [ ] **Step 1: Create OutroSlide component**

```tsx
// packages/core/src/components/OutroSlide.tsx
import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { AutoguideTheme } from '../theme/types';
import { darkTheme } from '../theme/presets/dark';

export interface OutroSlideProps {
  nextVideoTitle?: string;
  logoSrc?: string;
  websiteUrl?: string;
  docsUrl?: string;
  theme?: AutoguideTheme;
}

export const OutroSlide: React.FC<OutroSlideProps> = ({
  nextVideoTitle,
  logoSrc,
  websiteUrl,
  docsUrl,
  theme = darkTheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  const textOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const nextOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `${theme.fonts.heading}, system-ui, sans-serif`,
      }}
    >
      {/* Logo */}
      {logoSrc && (
        <Img
          src={staticFile(logoSrc)}
          style={{
            height: 80,
            objectFit: 'contain',
            marginBottom: 32,
            transform: `scale(${logoScale})`,
          }}
        />
      )}

      {/* Links */}
      <div style={{ opacity: textOpacity, display: 'flex', gap: 40 }}>
        {websiteUrl && (
          <div style={{ color: theme.colors.textMuted, fontSize: 20, fontWeight: 500 }}>
            {websiteUrl}
          </div>
        )}
        {docsUrl && (
          <div style={{ color: theme.colors.textMuted, fontSize: 20, fontWeight: 500 }}>
            {docsUrl}
          </div>
        )}
      </div>

      {/* Up next */}
      {nextVideoTitle && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            opacity: nextOpacity,
            textAlign: 'center',
          }}
        >
          <div style={{ color: theme.colors.textSubtle, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            UP NEXT
          </div>
          <div style={{ color: theme.colors.primaryLight, fontSize: 24, fontWeight: 600 }}>
            {nextVideoTitle}
          </div>
        </div>
      )}

      {/* Accent line at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: theme.gradients.accent,
        }}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/components/OutroSlide.tsx
git commit -m "feat(core): add OutroSlide component with logo and next-video hint"
```

---

### Task 9: SectionTitle Component

**Files:**
- Create: `packages/core/src/components/SectionTitle.tsx`

- [ ] **Step 1: Create SectionTitle component**

```tsx
// packages/core/src/components/SectionTitle.tsx
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { AutoguideTheme } from '../theme/types';
import { darkTheme } from '../theme/presets/dark';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  step?: string;
  theme?: AutoguideTheme;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  step,
  theme = darkTheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(titleProgress, [0, 1], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `${theme.fonts.heading}, system-ui, sans-serif`,
      }}
    >
      {/* Large step number in background */}
      {step && (
        <div
          style={{
            position: 'absolute',
            fontSize: 120,
            fontWeight: 800,
            color: theme.colors.primaryLight,
            opacity: 0.15,
          }}
        >
          {step}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          opacity: titleProgress,
          transform: `translateY(${titleY}px)`,
          fontSize: 52,
          fontWeight: 700,
          color: theme.colors.textWhite,
          textAlign: 'center',
          maxWidth: '75%',
          zIndex: 1,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            opacity: subtitleOpacity,
            fontSize: 24,
            fontWeight: 400,
            color: theme.colors.textMuted,
            marginTop: 16,
            textAlign: 'center',
            maxWidth: '65%',
            zIndex: 1,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/components/SectionTitle.tsx
git commit -m "feat(core): add SectionTitle component with step number background"
```

---

### Task 10: TransitionWipe Component

**Files:**
- Create: `packages/core/src/components/TransitionWipe.tsx`

- [ ] **Step 1: Create TransitionWipe component**

```tsx
// packages/core/src/components/TransitionWipe.tsx
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { AutoguideTheme } from '../theme/types';
import { darkTheme } from '../theme/presets/dark';

export interface TransitionWipeProps {
  direction?: 'left' | 'right';
  durationFrames?: number;
  theme?: AutoguideTheme;
}

export const TransitionWipe: React.FC<TransitionWipeProps> = ({
  direction = 'left',
  durationFrames: customDuration,
  theme = darkTheme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationFrames = customDuration ?? Math.round(fps * 0.5);

  const progress = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(
    frame,
    [durationFrames - 5, durationFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const translateX = direction === 'left'
    ? interpolate(progress, [0, 1], [100, -100])
    : interpolate(progress, [0, 1], [-100, 100]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: fadeOut }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '120%',
          transform: `translateX(${translateX}%)`,
          background: `linear-gradient(${direction === 'left' ? '90deg' : '270deg'}, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/components/TransitionWipe.tsx
git commit -m "feat(core): add TransitionWipe component"
```

---

### Task 11: VideoComposition + MasterComposition

**Files:**
- Create: `packages/core/src/compositions/VideoComposition.tsx`
- Create: `packages/core/src/compositions/MasterComposition.tsx`
- Create: `packages/core/src/compositions/index.ts`

- [ ] **Step 1: Create VideoComposition**

This provides the `add()`/`addHard()` cursor pattern as a reusable composition wrapper.

```tsx
// packages/core/src/compositions/VideoComposition.tsx
import React from 'react';
import { Sequence } from 'remotion';

interface SceneEntry {
  from: number;
  duration: number;
  el: React.ReactNode;
}

export interface VideoCompositionProps {
  fps?: number;
  overlap?: number;
  children: (helpers: {
    add: (durationSec: number, el: React.ReactNode) => void;
    addHard: (durationSec: number, el: React.ReactNode) => void;
  }) => void;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  fps = 30,
  overlap = 10,
  children,
}) => {
  const scenes: SceneEntry[] = [];
  let cursor = 0;

  const add = (durationSec: number, el: React.ReactNode) => {
    const dur = Math.round(durationSec * fps);
    scenes.push({ from: cursor, duration: dur, el });
    cursor += dur - overlap;
  };

  const addHard = (durationSec: number, el: React.ReactNode) => {
    const dur = Math.round(durationSec * fps);
    scenes.push({ from: cursor, duration: dur, el });
    cursor += dur;
  };

  children({ add, addHard });

  return (
    <>
      {scenes.map((scene, i) => (
        <Sequence key={i} from={scene.from} durationInFrames={scene.duration}>
          {scene.el}
        </Sequence>
      ))}
    </>
  );
};
```

- [ ] **Step 2: Create MasterComposition**

```tsx
// packages/core/src/compositions/MasterComposition.tsx
import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

interface VideoEntry {
  id: string;
  component: React.FC;
  durationInFrames: number;
}

export interface MasterCompositionProps {
  videos: VideoEntry[];
  crossfadeFrames?: number;
  music?: {
    src: string;
    volume?: number;
    fadeIn?: number;
    fadeOut?: number;
    loop?: boolean;
  };
}

const FadeWrap: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  crossfadeFrames: number;
  isFirst: boolean;
  isLast: boolean;
}> = ({ children, durationInFrames, crossfadeFrames, isFirst, isLast }) => {
  const frame = useCurrentFrame();

  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [0, crossfadeFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  const fadeOut = isLast
    ? 1
    : interpolate(
        frame,
        [durationInFrames - crossfadeFrames, durationInFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </AbsoluteFill>
  );
};

export const MasterComposition: React.FC<MasterCompositionProps> = ({
  videos,
  crossfadeFrames = 10,
  music,
}) => {
  const { fps } = useVideoConfig();

  let cursor = 0;
  const entries: { from: number; dur: number; entry: VideoEntry; index: number }[] = [];

  for (let i = 0; i < videos.length; i++) {
    const from = cursor;
    const dur = videos[i].durationInFrames;
    entries.push({ from, dur, entry: videos[i], index: i });
    cursor += dur - (i < videos.length - 1 ? crossfadeFrames : 0);
  }

  const totalFrames = cursor;

  return (
    <>
      {/* Background music */}
      {music && (
        <Audio
          src={staticFile(music.src)}
          volume={(f) => {
            const fadeInFrames = (music.fadeIn ?? 2) * fps;
            const fadeOutFrames = (music.fadeOut ?? 2) * fps;
            const vol = music.volume ?? 0.15;
            return interpolate(
              f,
              [0, fadeInFrames, totalFrames - fadeOutFrames, totalFrames],
              [0, vol, vol * 0.67, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
          }}
          loop={music.loop ?? true}
        />
      )}

      {/* Videos */}
      {entries.map(({ from, dur, entry, index }) => {
        const VideoComponent = entry.component;
        return (
          <Sequence key={entry.id} from={from} durationInFrames={dur}>
            <FadeWrap
              durationInFrames={dur}
              crossfadeFrames={crossfadeFrames}
              isFirst={index === 0}
              isLast={index === videos.length - 1}
            >
              <VideoComponent />
            </FadeWrap>
          </Sequence>
        );
      })}
    </>
  );
};
```

- [ ] **Step 3: Create composition barrel**

```typescript
// packages/core/src/compositions/index.ts
export { VideoComposition } from './VideoComposition';
export type { VideoCompositionProps } from './VideoComposition';
export { MasterComposition } from './MasterComposition';
export type { MasterCompositionProps } from './MasterComposition';
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/compositions/
git commit -m "feat(core): add VideoComposition and MasterComposition with cursor timing"
```

---

### Task 12: Barrel Exports + Build

**Files:**
- Create: `packages/core/src/components/index.ts`
- Create: `packages/core/src/index.ts`

- [ ] **Step 1: Create component barrel**

```typescript
// packages/core/src/components/index.ts
export { IntroSlide } from './IntroSlide';
export type { IntroSlideProps } from './IntroSlide';
export { OutroSlide } from './OutroSlide';
export type { OutroSlideProps } from './OutroSlide';
export { ScreenshotScene } from './ScreenshotScene';
export type { ScreenshotSceneProps } from './ScreenshotScene';
export { HighlightOverlay } from './HighlightOverlay';
export type { HighlightOverlayProps, HighlightBoxProps } from './HighlightOverlay';
export { TextCallout } from './TextCallout';
export type { TextCalloutProps } from './TextCallout';
export { SectionTitle } from './SectionTitle';
export type { SectionTitleProps } from './SectionTitle';
export { TransitionWipe } from './TransitionWipe';
export type { TransitionWipeProps } from './TransitionWipe';
```

- [ ] **Step 2: Create root barrel export**

```typescript
// packages/core/src/index.ts

// Components
export {
  IntroSlide,
  OutroSlide,
  ScreenshotScene,
  HighlightOverlay,
  TextCallout,
  SectionTitle,
  TransitionWipe,
} from './components';
export type {
  IntroSlideProps,
  OutroSlideProps,
  ScreenshotSceneProps,
  HighlightOverlayProps,
  HighlightBoxProps,
  TextCalloutProps,
  SectionTitleProps,
  TransitionWipeProps,
} from './components';

// Compositions
export { VideoComposition, MasterComposition } from './compositions';
export type { VideoCompositionProps, MasterCompositionProps } from './compositions';

// Theme
export { createTheme, darkTheme, lightTheme, minimalTheme } from './theme';
export type { AutoguideTheme, ThemeColors, ThemeFonts, ThemeGradients, ThemeInput } from './theme';

// Types
export type {
  VideoPlan,
  VideoMeta,
  SceneSection,
  Scene,
  SceneCapture,
  AutoCapture,
  ManualCapture,
  CaptureAction,
  HighlightBox,
  TextCalloutConfig,
  VoiceoverEntry,
  PlanMetadata,
  OutroConfig,
  IntroConfig,
} from './types/plan';

export type {
  AutoguideConfig,
  ProjectConfig,
  BrandingConfig,
  VoiceoverConfig,
  CaptureConfig,
  OutputConfig,
  MusicConfig,
  DefaultsConfig,
  AuthConfig,
} from './types/config';
```

- [ ] **Step 3: Run all tests**

Run: `cd packages/core && npx vitest run`
Expected: All tests pass.

- [ ] **Step 4: Build the package**

Run: `cd packages/core && npx tsup`
Expected: Build succeeds, `dist/` directory created with `index.js`, `index.mjs`, `index.d.ts`.

- [ ] **Step 5: Verify build output**

Run: `ls packages/core/dist/`
Expected: `index.js`, `index.mjs`, `index.d.ts` (and source maps).

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/components/index.ts packages/core/src/index.ts
git commit -m "feat(core): add barrel exports and verify tsup build"
```

---

## What's Next

After Phase 1 is complete, the following phases will be planned separately:

- **Phase 2: CLI Foundation** — config loader, YAML plan parser/validator, logger, paths, `init`/`plan`/`status` commands
- **Phase 3: Capture Engine** — Playwright browser lifecycle, auth strategies, capture actions, `capture` command
- **Phase 4: Voiceover Engine** — ElevenLabs client, MP3 duration measurement, `voiceover` command
- **Phase 5: Build Engine** — code generator, templates, lock mechanism, `build` command
- **Phase 6: Render + Pipeline** — `render` command, `go` command (full pipeline orchestration)
- **Phase 7: Claude Code Skills** — skill definitions for `/video:*` commands
