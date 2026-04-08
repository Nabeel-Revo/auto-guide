# Phase 2: @autoguide/cli Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `@autoguide/cli` package with core utilities (config loader, plan parser, logger, paths), Zod validation schemas, and the first 3 CLI commands (`init`, `plan`, `status`).

**Architecture:** Commander.js CLI that reads `autoguide.config.yaml` and `plans/*.yaml`. Config and plan files are validated with Zod schemas that mirror the TypeScript types from `@autoguide/core`. Environment variables in config use `${VAR}` syntax and are resolved from `.env` or system env.

**Tech Stack:** Commander.js, Zod, js-yaml, dotenv, chalk, @autoguide/core (types), tsup, vitest

**Design Spec:** `docs/specs/2026-04-08-autoguide-design.md` — Sections 3, 4, 5

---

## Phase Overview

| Task | What it builds | Depends on |
|------|---------------|------------|
| 1 | CLI package scaffolding | — |
| 2 | Logger utility | Task 1 |
| 3 | Paths utility | Task 1 |
| 4 | Config loader (YAML + env + Zod) | Tasks 2, 3 |
| 5 | Plan parser + validator (YAML + Zod) | Tasks 2, 3 |
| 6 | `autoguide init` command | Task 4 |
| 7 | `autoguide plan` command | Tasks 4, 5 |
| 8 | `autoguide status` command | Tasks 4, 5 |
| 9 | CLI entry point + bin wiring | Tasks 6, 7, 8 |

## File Map

```
packages/cli/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts                    # CLI entry point (Commander program)
│   ├── commands/
│   │   ├── init.ts                 # autoguide init
│   │   ├── plan.ts                 # autoguide plan
│   │   └── status.ts               # autoguide status
│   ├── plan/
│   │   ├── parser.ts               # YAML plan reader/writer
│   │   └── validator.ts            # Zod schema for VideoPlan
│   └── utils/
│       ├── config.ts               # Config file loader + Zod validation
│       ├── logger.ts               # Terminal output formatting
│       └── paths.ts                # Path resolution helpers
└── tests/
    ├── utils/
    │   ├── config.test.ts
    │   └── paths.test.ts
    └── plan/
        ├── parser.test.ts
        └── validator.test.ts
```

---

### Task 1: CLI Package Scaffolding

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/tsup.config.ts`

- [ ] **Step 1: Create packages/cli/package.json**

```json
{
  "name": "@autoguide/cli",
  "version": "0.1.0",
  "description": "CLI for Autoguide video guide generator",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "autoguide": "./dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@autoguide/core": "workspace:*",
    "chalk": "^5.3.0",
    "commander": "^12.1.0",
    "dotenv": "^16.4.0",
    "js-yaml": "^4.1.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20.11.0",
    "tsup": "^8.0.0",
    "typescript": "^5.5.4",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create packages/cli/tsconfig.json**

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

- [ ] **Step 3: Create packages/cli/tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
```

- [ ] **Step 4: Run pnpm install**

Run: `pnpm install`
Expected: All dependencies installed.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/package.json packages/cli/tsconfig.json packages/cli/tsup.config.ts pnpm-lock.yaml
git commit -m "chore: scaffold @autoguide/cli package"
```

---

### Task 2: Logger Utility

**Files:**
- Create: `packages/cli/src/utils/logger.ts`

- [ ] **Step 1: Create logger**

```typescript
// packages/cli/src/utils/logger.ts
import chalk from 'chalk';

export const logger = {
  info(msg: string) {
    console.log(chalk.blue('ℹ'), msg);
  },

  success(msg: string) {
    console.log(chalk.green('✓'), msg);
  },

  warn(msg: string) {
    console.log(chalk.yellow('⚠'), msg);
  },

  error(msg: string) {
    console.error(chalk.red('✗'), msg);
  },

  step(label: string, detail: string) {
    console.log(chalk.gray(`  [${label}]`), detail);
  },

  header(msg: string) {
    console.log();
    console.log(chalk.bold.white(msg));
    console.log(chalk.gray('─'.repeat(60)));
  },

  table(headers: string[], rows: string[][]) {
    const colWidths = headers.map((h, i) =>
      Math.max(h.length, ...rows.map((r) => (r[i] || '').length))
    );

    const formatRow = (cells: string[]) =>
      cells.map((c, i) => c.padEnd(colWidths[i])).join(' | ');

    console.log(chalk.bold(formatRow(headers)));
    console.log(chalk.gray(colWidths.map((w) => '─'.repeat(w)).join('─┼─')));
    rows.forEach((row) => console.log(formatRow(row)));
  },

  blank() {
    console.log();
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/cli/src/utils/logger.ts
git commit -m "feat(cli): add logger utility with colored terminal output"
```

---

### Task 3: Paths Utility

**Files:**
- Create: `packages/cli/src/utils/paths.ts`
- Create: `packages/cli/tests/utils/paths.test.ts`

- [ ] **Step 1: Write paths tests**

```typescript
// packages/cli/tests/utils/paths.test.ts
import { describe, it, expect } from 'vitest';
import path from 'path';
import { resolveProjectPaths } from '../../src/utils/paths';

describe('resolveProjectPaths', () => {
  it('resolves all standard paths from a root', () => {
    const root = '/project';
    const paths = resolveProjectPaths(root);

    expect(paths.root).toBe('/project');
    expect(paths.config).toBe(path.join('/project', 'autoguide.config.yaml'));
    expect(paths.plans).toBe(path.join('/project', 'plans'));
    expect(paths.screenshots).toBe(path.join('/project', 'public', 'screenshots'));
    expect(paths.voiceover).toBe(path.join('/project', 'public', 'voiceover'));
    expect(paths.output).toBe(path.join('/project', 'output'));
    expect(paths.src).toBe(path.join('/project', 'src'));
  });

  it('resolves plan file path', () => {
    const root = '/project';
    const paths = resolveProjectPaths(root);
    expect(paths.planFile('01-overview')).toBe(
      path.join('/project', 'plans', '01-overview.yaml')
    );
  });

  it('resolves screenshot dir for a video', () => {
    const root = '/project';
    const paths = resolveProjectPaths(root);
    expect(paths.screenshotDir('01-overview')).toBe(
      path.join('/project', 'public', 'screenshots', '01-overview')
    );
  });

  it('resolves voiceover dir for a video', () => {
    const root = '/project';
    const paths = resolveProjectPaths(root);
    expect(paths.voiceoverDir('01-overview')).toBe(
      path.join('/project', 'public', 'voiceover', '01-overview')
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/cli && npx vitest run tests/utils/paths.test.ts`

- [ ] **Step 3: Create paths utility**

```typescript
// packages/cli/src/utils/paths.ts
import path from 'path';

export interface ProjectPaths {
  root: string;
  config: string;
  plans: string;
  screenshots: string;
  voiceover: string;
  output: string;
  src: string;
  planFile: (videoId: string) => string;
  screenshotDir: (videoId: string) => string;
  voiceoverDir: (videoId: string) => string;
}

export function resolveProjectPaths(root: string): ProjectPaths {
  return {
    root,
    config: path.join(root, 'autoguide.config.yaml'),
    plans: path.join(root, 'plans'),
    screenshots: path.join(root, 'public', 'screenshots'),
    voiceover: path.join(root, 'public', 'voiceover'),
    output: path.join(root, 'output'),
    src: path.join(root, 'src'),
    planFile: (videoId: string) => path.join(root, 'plans', `${videoId}.yaml`),
    screenshotDir: (videoId: string) => path.join(root, 'public', 'screenshots', videoId),
    voiceoverDir: (videoId: string) => path.join(root, 'public', 'voiceover', videoId),
  };
}

export function findProjectRoot(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  while (true) {
    const configPath = path.join(dir, 'autoguide.config.yaml');
    try {
      const fs = require('fs');
      if (fs.existsSync(configPath)) return dir;
    } catch {
      // fs not available in some contexts
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `cd packages/cli && npx vitest run tests/utils/paths.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/utils/paths.ts packages/cli/tests/utils/paths.test.ts
git commit -m "feat(cli): add paths utility for project directory resolution"
```

---

### Task 4: Config Loader

**Files:**
- Create: `packages/cli/src/utils/config.ts`
- Create: `packages/cli/tests/utils/config.test.ts`

- [ ] **Step 1: Write config tests**

```typescript
// packages/cli/tests/utils/config.test.ts
import { describe, it, expect } from 'vitest';
import { resolveEnvVars, configSchema } from '../../src/utils/config';

describe('resolveEnvVars', () => {
  it('replaces ${VAR} with env value', () => {
    const env = { MY_KEY: 'secret123' };
    expect(resolveEnvVars('${MY_KEY}', env)).toBe('secret123');
  });

  it('replaces multiple vars in same string', () => {
    const env = { HOST: 'localhost', PORT: '3000' };
    expect(resolveEnvVars('${HOST}:${PORT}', env)).toBe('localhost:3000');
  });

  it('leaves non-var strings unchanged', () => {
    expect(resolveEnvVars('plain text', {})).toBe('plain text');
  });

  it('leaves unresolved vars as-is', () => {
    expect(resolveEnvVars('${MISSING}', {})).toBe('${MISSING}');
  });
});

describe('configSchema', () => {
  it('validates a minimal valid config', () => {
    const config = {
      project: { name: 'Test', url: 'http://localhost:3000' },
      branding: { theme: 'dark' },
      voiceover: { provider: 'none', apiKey: '', mode: 'auto' },
      capture: { viewport: { width: 1920, height: 1080 }, delay: 1000 },
      output: { fps: 30, resolution: { width: 1920, height: 1080 }, format: 'mp4', directory: './output' },
      defaults: { overlap: 10 },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('rejects config missing required project.name', () => {
    const config = {
      project: { url: 'http://localhost:3000' },
      branding: { theme: 'dark' },
      voiceover: { provider: 'none', apiKey: '', mode: 'auto' },
      capture: { viewport: { width: 1920, height: 1080 }, delay: 1000 },
      output: { fps: 30, resolution: { width: 1920, height: 1080 }, format: 'mp4', directory: './output' },
      defaults: { overlap: 10 },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('rejects invalid voiceover provider', () => {
    const config = {
      project: { name: 'Test', url: 'http://localhost:3000' },
      branding: { theme: 'dark' },
      voiceover: { provider: 'invalid', apiKey: '', mode: 'auto' },
      capture: { viewport: { width: 1920, height: 1080 }, delay: 1000 },
      output: { fps: 30, resolution: { width: 1920, height: 1080 }, format: 'mp4', directory: './output' },
      defaults: { overlap: 10 },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/cli && npx vitest run tests/utils/config.test.ts`

- [ ] **Step 3: Create config loader**

```typescript
// packages/cli/src/utils/config.ts
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';
import dotenv from 'dotenv';
import type { AutoguideConfig } from '@autoguide/core';
import { logger } from './logger';

// ─── Zod Schema ───

const viewportSchema = z.object({
  width: z.number(),
  height: z.number(),
});

const brandingColorsSchema = z.object({
  primary: z.string(),
  primaryLight: z.string().optional(),
  bgDark: z.string().optional(),
  textWhite: z.string().optional(),
  textMuted: z.string().optional(),
}).optional();

const brandingFontsSchema = z.object({
  heading: z.string(),
  body: z.string(),
}).optional();

const themeOverridesSchema = z.object({
  preset: z.enum(['dark', 'light', 'minimal']).optional(),
  overrides: z.object({
    colors: brandingColorsSchema,
    highlightStyle: z.enum(['glow', 'border', 'fill']).optional(),
  }).optional(),
});

const brandingSchema = z.object({
  logo: z.string().optional(),
  logoLight: z.string().optional(),
  theme: z.union([z.enum(['dark', 'light', 'minimal']), themeOverridesSchema]),
  colors: brandingColorsSchema,
  fonts: brandingFontsSchema,
  highlightStyle: z.enum(['glow', 'border', 'fill']).optional(),
});

const voiceoverSettingsSchema = z.object({
  stability: z.number(),
  similarity_boost: z.number(),
  speed: z.number(),
}).optional();

const voiceoverSchema = z.object({
  provider: z.enum(['elevenlabs', 'openai', 'google', 'none']),
  apiKey: z.string(),
  voiceId: z.string().optional(),
  voice: z.string().optional(),
  model: z.string().optional(),
  mode: z.enum(['auto', 'approval']),
  settings: voiceoverSettingsSchema,
  volume: z.number().optional(),
  buffer: z.number().optional(),
});

const authSchema = z.object({
  strategy: z.enum(['form', 'cookie', 'bearer', 'none']),
  loginUrl: z.string().optional(),
  credentials: z.object({
    username: z.string(),
    password: z.string(),
  }).optional(),
  selectors: z.object({
    username: z.string(),
    password: z.string(),
    submit: z.string(),
  }).optional(),
  waitAfterLogin: z.string().optional(),
  cookies: z.array(z.object({ name: z.string(), value: z.string(), domain: z.string() })).optional(),
  token: z.string().optional(),
}).optional();

const captureSchema = z.object({
  viewport: viewportSchema,
  delay: z.number(),
  auth: authSchema,
});

const outputSchema = z.object({
  fps: z.number(),
  resolution: viewportSchema,
  format: z.enum(['mp4', 'webm']),
  directory: z.string(),
  codec: z.string().optional(),
});

const musicSchema = z.object({
  file: z.string(),
  volume: z.number().optional(),
  fadeIn: z.number().optional(),
  fadeOut: z.number().optional(),
  loop: z.boolean().optional(),
  masterOnly: z.boolean().optional(),
}).optional();

const defaultsSchema = z.object({
  overlap: z.number(),
  intro: z.object({ duration: z.number() }).optional(),
  outro: z.object({
    duration: z.number(),
    websiteUrl: z.string().optional(),
    docsUrl: z.string().optional(),
  }).optional(),
  sectionTitle: z.object({ duration: z.number() }).optional(),
  callout: z.object({ size: z.enum(['sm', 'md', 'lg']) }).optional(),
});

export const configSchema = z.object({
  project: z.object({
    name: z.string(),
    url: z.string(),
    description: z.string().optional(),
  }),
  branding: brandingSchema,
  voiceover: voiceoverSchema,
  capture: captureSchema,
  output: outputSchema,
  music: musicSchema,
  defaults: defaultsSchema,
});

// ─── Environment Variable Resolution ───

export function resolveEnvVars(
  value: string,
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    return env[varName] ?? match;
  });
}

function resolveEnvVarsDeep(obj: unknown, env: Record<string, string | undefined>): unknown {
  if (typeof obj === 'string') return resolveEnvVars(obj, env);
  if (Array.isArray(obj)) return obj.map((item) => resolveEnvVarsDeep(item, env));
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = resolveEnvVarsDeep(val, env);
    }
    return result;
  }
  return obj;
}

// ─── Config Loader ───

export function loadConfig(configPath: string): AutoguideConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  // Load .env from same directory
  const envPath = path.join(path.dirname(configPath), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = yaml.load(raw) as Record<string, unknown>;

  // Resolve environment variables
  const resolved = resolveEnvVarsDeep(parsed, process.env as Record<string, string | undefined>);

  // Validate
  const result = configSchema.safeParse(resolved);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`autoguide.config.yaml validation failed:\n${errors}`);
  }

  return result.data as AutoguideConfig;
}
```

- [ ] **Step 4: Run tests**

Run: `cd packages/cli && npx vitest run tests/utils/config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/utils/config.ts packages/cli/tests/utils/config.test.ts
git commit -m "feat(cli): add config loader with Zod validation and env var resolution"
```

---

### Task 5: Plan Parser + Validator

**Files:**
- Create: `packages/cli/src/plan/validator.ts`
- Create: `packages/cli/src/plan/parser.ts`
- Create: `packages/cli/tests/plan/validator.test.ts`
- Create: `packages/cli/tests/plan/parser.test.ts`

- [ ] **Step 1: Write validator tests**

```typescript
// packages/cli/tests/plan/validator.test.ts
import { describe, it, expect } from 'vitest';
import { planSchema } from '../../src/plan/validator';

const validPlan = {
  video: { id: '01-overview', title: 'Overview', module: 'Getting Started', videoNumber: 1 },
  intro: {
    title: 'Overview',
    subtitle: 'A quick tour',
    duration: 7,
    voiceover: { script: 'Welcome.', file: null, duration: null },
  },
  sections: [
    {
      id: 'browsing',
      title: 'Browsing',
      step: '01',
      voiceover: { script: 'Browse.', file: null, duration: null },
      scenes: [
        {
          id: 'main-view',
          type: 'screenshot',
          capture: { mode: 'auto', route: '/home', actions: [] },
          screenshot: null,
          duration: 8,
          highlights: [],
          voiceover: { script: 'The main view.', file: null, duration: null },
        },
      ],
    },
  ],
  outro: {
    duration: 5,
    voiceover: { script: 'Bye.', file: null, duration: null },
  },
  metadata: {
    totalDuration: null,
    totalFrames: null,
    screenshotsCaptured: 0,
    screenshotsTotal: 1,
    voiceoverGenerated: 0,
    voiceoverTotal: 3,
    lastBuilt: null,
    lastRendered: null,
  },
};

describe('planSchema', () => {
  it('validates a complete plan', () => {
    const result = planSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it('rejects plan missing video.id', () => {
    const bad = { ...validPlan, video: { title: 'X', module: 'M', videoNumber: 1 } };
    const result = planSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('accepts manual capture mode', () => {
    const plan = structuredClone(validPlan);
    plan.sections[0].scenes[0].capture = {
      mode: 'manual',
      instructions: 'Take screenshot manually',
    };
    const result = planSchema.safeParse(plan);
    expect(result.success).toBe(true);
  });

  it('validates highlight boxes', () => {
    const plan = structuredClone(validPlan);
    plan.sections[0].scenes[0].highlights = [
      { x: 10, y: 20, width: 30, height: 40, label: 'Test' },
    ];
    const result = planSchema.safeParse(plan);
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Write parser tests**

```typescript
// packages/cli/tests/plan/parser.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { readPlan, writePlan } from '../../src/plan/parser';

describe('plan parser', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autoguide-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes and reads a plan round-trip', () => {
    const plan = {
      video: { id: '01-test', title: 'Test', module: 'Mod', videoNumber: 1 },
      intro: {
        title: 'Test',
        duration: 5,
        voiceover: { script: 'Hi.', file: null, duration: null },
      },
      sections: [],
      outro: {
        duration: 5,
        voiceover: { script: 'Bye.', file: null, duration: null },
      },
      metadata: {
        totalDuration: null,
        totalFrames: null,
        screenshotsCaptured: 0,
        screenshotsTotal: 0,
        voiceoverGenerated: 0,
        voiceoverTotal: 2,
        lastBuilt: null,
        lastRendered: null,
      },
    };

    const filePath = path.join(tmpDir, 'test.yaml');
    writePlan(filePath, plan);

    expect(fs.existsSync(filePath)).toBe(true);

    const loaded = readPlan(filePath);
    expect(loaded.video.id).toBe('01-test');
    expect(loaded.intro.title).toBe('Test');
    expect(loaded.sections).toEqual([]);
    expect(loaded.metadata.screenshotsTotal).toBe(0);
  });

  it('throws on invalid plan file', () => {
    const filePath = path.join(tmpDir, 'bad.yaml');
    fs.writeFileSync(filePath, 'video:\n  title: Missing fields\n');
    expect(() => readPlan(filePath)).toThrow();
  });

  it('throws on missing file', () => {
    expect(() => readPlan(path.join(tmpDir, 'nope.yaml'))).toThrow();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd packages/cli && npx vitest run tests/plan/`

- [ ] **Step 4: Create plan validator**

```typescript
// packages/cli/src/plan/validator.ts
import { z } from 'zod';

const voiceoverEntrySchema = z.object({
  script: z.string(),
  file: z.string().nullable(),
  duration: z.number().nullable(),
});

const captureActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), selector: z.string() }),
  z.object({ type: z.literal('type'), selector: z.string(), text: z.string() }),
  z.object({ type: z.literal('hover'), selector: z.string() }),
  z.object({ type: z.literal('wait'), ms: z.number() }),
  z.object({ type: z.literal('waitForSelector'), selector: z.string(), timeout: z.number().optional() }),
  z.object({ type: z.literal('scroll'), y: z.number() }),
  z.object({ type: z.literal('select'), selector: z.string(), value: z.string() }),
  z.object({ type: z.literal('press'), key: z.string() }),
  z.object({ type: z.literal('evaluate'), script: z.string() }),
]);

const autoCaptureSchema = z.object({
  mode: z.literal('auto'),
  route: z.string(),
  actions: z.array(captureActionSchema).default([]),
  waitFor: z.string().optional(),
  delay: z.number().optional(),
});

const manualCaptureSchema = z.object({
  mode: z.literal('manual'),
  instructions: z.string(),
});

const sceneCaptureSchema = z.discriminatedUnion('mode', [autoCaptureSchema, manualCaptureSchema]);

const highlightBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string().optional(),
  delay: z.number().optional(),
});

const textCalloutSchema = z.object({
  text: z.string(),
  x: z.number(),
  y: z.number(),
  delay: z.number().optional(),
  size: z.enum(['sm', 'md', 'lg']).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
});

const sceneSchema = z.object({
  id: z.string(),
  type: z.literal('screenshot'),
  capture: sceneCaptureSchema,
  screenshot: z.string().nullable(),
  duration: z.number(),
  caption: z.string().optional(),
  highlights: z.array(highlightBoxSchema).default([]),
  callout: textCalloutSchema.optional(),
  voiceover: voiceoverEntrySchema,
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  step: z.string(),
  voiceover: voiceoverEntrySchema,
  scenes: z.array(sceneSchema),
});

const introSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  duration: z.number(),
  voiceover: voiceoverEntrySchema,
});

const outroSchema = z.object({
  nextVideoTitle: z.string().optional(),
  duration: z.number(),
  voiceover: voiceoverEntrySchema,
});

const videoMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  module: z.string(),
  videoNumber: z.number(),
});

const metadataSchema = z.object({
  totalDuration: z.number().nullable(),
  totalFrames: z.number().nullable(),
  screenshotsCaptured: z.number(),
  screenshotsTotal: z.number(),
  voiceoverGenerated: z.number(),
  voiceoverTotal: z.number(),
  lastBuilt: z.string().nullable(),
  lastRendered: z.string().nullable(),
});

export const planSchema = z.object({
  video: videoMetaSchema,
  intro: introSchema,
  sections: z.array(sectionSchema),
  outro: outroSchema,
  metadata: metadataSchema,
});

export type ValidatedPlan = z.infer<typeof planSchema>;
```

- [ ] **Step 5: Create plan parser**

```typescript
// packages/cli/src/plan/parser.ts
import fs from 'fs';
import yaml from 'js-yaml';
import type { VideoPlan } from '@autoguide/core';
import { planSchema } from './validator';

export function readPlan(filePath: string): VideoPlan {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Plan file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw);

  const result = planSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Plan validation failed (${filePath}):\n${errors}`);
  }

  return result.data as VideoPlan;
}

export function writePlan(filePath: string, plan: VideoPlan): void {
  const content = yaml.dump(plan, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  });
  fs.mkdirSync(fs.realpathSync(filePath + '/..'), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function listPlans(plansDir: string): string[] {
  if (!fs.existsSync(plansDir)) return [];
  return fs
    .readdirSync(plansDir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map((f) => f.replace(/\.(yaml|yml)$/, ''));
}
```

- [ ] **Step 6: Run tests**

Run: `cd packages/cli && npx vitest run tests/plan/`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/plan/ packages/cli/tests/plan/
git commit -m "feat(cli): add plan parser and Zod validator for video plan YAML"
```

---

### Task 6: `autoguide init` Command

**Files:**
- Create: `packages/cli/src/commands/init.ts`

- [ ] **Step 1: Create init command**

```typescript
// packages/cli/src/commands/init.ts
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Command } from 'commander';
import type { AutoguideConfig } from '@autoguide/core';
import { logger } from '../utils/logger';

const DEFAULT_CONFIG: AutoguideConfig = {
  project: {
    name: 'My Project',
    url: 'http://localhost:3000',
  },
  branding: {
    theme: 'dark',
  },
  voiceover: {
    provider: 'none',
    apiKey: '',
    mode: 'auto',
  },
  capture: {
    viewport: { width: 1920, height: 1080 },
    delay: 1000,
  },
  output: {
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    format: 'mp4',
    directory: './output',
  },
  defaults: {
    overlap: 10,
    intro: { duration: 4 },
    outro: { duration: 5 },
    sectionTitle: { duration: 2.5 },
    callout: { size: 'md' },
  },
};

export function createInitCommand(): Command {
  return new Command('init')
    .description('Initialize Autoguide in the current project')
    .option('--template <name>', 'Theme template (dark|light|minimal)', 'dark')
    .option('--no-voiceover', 'Skip voiceover configuration')
    .option('--yes', 'Accept all defaults (non-interactive)')
    .action(async (opts) => {
      const cwd = process.cwd();
      const configPath = path.join(cwd, 'autoguide.config.yaml');

      if (fs.existsSync(configPath)) {
        logger.warn('autoguide.config.yaml already exists. Use --force to overwrite.');
        return;
      }

      const config = { ...DEFAULT_CONFIG };
      config.branding.theme = opts.template as 'dark' | 'light' | 'minimal';

      if (opts.voiceover === false) {
        config.voiceover.provider = 'none';
      }

      // Write config
      const configContent = yaml.dump(config, {
        lineWidth: 120,
        noRefs: true,
        sortKeys: false,
      });
      fs.writeFileSync(configPath, configContent, 'utf-8');
      logger.success('Created autoguide.config.yaml');

      // Create directories
      const dirs = [
        'plans',
        path.join('public', 'screenshots'),
        path.join('public', 'voiceover'),
        'output',
      ];

      for (const dir of dirs) {
        const fullPath = path.join(cwd, dir);
        fs.mkdirSync(fullPath, { recursive: true });
        logger.success(`Created ${dir}/`);
      }

      logger.blank();
      logger.info("Run 'autoguide plan <video-id>' to create your first video plan.");
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/cli/src/commands/init.ts
git commit -m "feat(cli): add autoguide init command"
```

---

### Task 7: `autoguide plan` Command

**Files:**
- Create: `packages/cli/src/commands/plan.ts`

- [ ] **Step 1: Create plan command**

This is a non-interactive version — the Claude skill layer handles the interactive planning. The CLI command creates a scaffold plan or opens an existing one.

```typescript
// packages/cli/src/commands/plan.ts
import fs from 'fs';
import { Command } from 'commander';
import type { VideoPlan } from '@autoguide/core';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, writePlan } from '../plan/parser';

function createScaffoldPlan(videoId: string): VideoPlan {
  const videoNumber = parseInt(videoId.match(/^(\d+)/)?.[1] ?? '1', 10);
  const title = videoId
    .replace(/^\d+-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    video: {
      id: videoId,
      title,
      module: 'Untitled Module',
      videoNumber,
    },
    intro: {
      title,
      subtitle: '',
      duration: 7,
      voiceover: { script: `${title}.`, file: null, duration: null },
    },
    sections: [
      {
        id: 'section-1',
        title: 'Section 1',
        step: '01',
        voiceover: { script: 'Section one.', file: null, duration: null },
        scenes: [
          {
            id: 'scene-1',
            type: 'screenshot',
            capture: { mode: 'auto', route: '/', actions: [] },
            screenshot: null,
            duration: 8,
            highlights: [],
            voiceover: { script: 'Describe this scene.', file: null, duration: null },
          },
        ],
      },
    ],
    outro: {
      duration: 5,
      voiceover: { script: 'That covers the basics.', file: null, duration: null },
    },
    metadata: {
      totalDuration: null,
      totalFrames: null,
      screenshotsCaptured: 0,
      screenshotsTotal: 1,
      voiceoverGenerated: 0,
      voiceoverTotal: 3,
      lastBuilt: null,
      lastRendered: null,
    },
  };
}

export function createPlanCommand(): Command {
  return new Command('plan')
    .description('Create or update a video plan')
    .argument('<video-id>', 'Video identifier (e.g., 01-project-overview)')
    .option('--module <name>', 'Pre-fill module name')
    .option('--edit', 'Open plan in $EDITOR after generation')
    .action(async (videoId: string, opts) => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      const paths = resolveProjectPaths(root);
      const planPath = paths.planFile(videoId);

      if (fs.existsSync(planPath)) {
        const plan = readPlan(planPath);
        const sceneCount = plan.sections.reduce((s, sec) => s + sec.scenes.length, 0);
        logger.info(`Plan exists: ${videoId}`);
        logger.step('sections', String(plan.sections.length));
        logger.step('scenes', String(sceneCount));
        logger.step('path', planPath);

        if (opts.edit) {
          const editor = process.env.EDITOR || 'code';
          const { execSync } = require('child_process');
          execSync(`${editor} "${planPath}"`, { stdio: 'inherit' });
        }
        return;
      }

      // Create scaffold plan
      const plan = createScaffoldPlan(videoId);
      if (opts.module) {
        plan.video.module = opts.module;
      }

      writePlan(planPath, plan);

      const sceneCount = plan.sections.reduce((s, sec) => s + sec.scenes.length, 0);
      const autoCount = plan.sections.reduce(
        (s, sec) => s + sec.scenes.filter((sc) => sc.capture.mode === 'auto').length,
        0,
      );
      const manualCount = sceneCount - autoCount;

      logger.success(`Plan written: ${planPath}`);
      logger.step('sections', String(plan.sections.length));
      logger.step('scenes', `${sceneCount} (${autoCount} auto, ${manualCount} manual)`);

      logger.blank();
      logger.info(`Next: autoguide capture ${videoId}`);

      if (opts.edit) {
        const editor = process.env.EDITOR || 'code';
        const { execSync } = require('child_process');
        execSync(`${editor} "${planPath}"`, { stdio: 'inherit' });
      }
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/cli/src/commands/plan.ts
git commit -m "feat(cli): add autoguide plan command with scaffold generation"
```

---

### Task 8: `autoguide status` Command

**Files:**
- Create: `packages/cli/src/commands/status.ts`

- [ ] **Step 1: Create status command**

```typescript
// packages/cli/src/commands/status.ts
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, listPlans } from '../plan/parser';

function statusCell(current: number, total: number): string {
  if (total === 0) return '--';
  if (current === total) return 'OK';
  return `${current}/${total}`;
}

export function createStatusCommand(): Command {
  return new Command('status')
    .description('Show pipeline status for all videos')
    .action(async () => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      const paths = resolveProjectPaths(root);
      const config = loadConfig(paths.config);

      logger.header(`Autoguide Status — ${config.project.name}`);

      const planIds = listPlans(paths.plans);

      if (planIds.length === 0) {
        logger.info('No video plans found. Run "autoguide plan <video-id>" to get started.');
        return;
      }

      const headers = ['Video', 'Plan', 'Capture', 'Voiceover', 'Build', 'Render'];
      const rows: string[][] = [];

      for (const id of planIds) {
        try {
          const plan = readPlan(paths.planFile(id));
          const meta = plan.metadata;

          const captureStatus = statusCell(meta.screenshotsCaptured, meta.screenshotsTotal);
          const voStatus = statusCell(meta.voiceoverGenerated, meta.voiceoverTotal);
          const buildStatus = meta.lastBuilt ? 'OK' : '--';
          const renderStatus = meta.lastRendered ? 'OK' : '--';

          rows.push([id, 'OK', captureStatus, voStatus, buildStatus, renderStatus]);
        } catch {
          rows.push([id, 'ERR', '--', '--', '--', '--']);
        }
      }

      logger.table(headers, rows);
      logger.blank();
      logger.info('Legend: OK = complete, N/M = progress, -- = not started');
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/cli/src/commands/status.ts
git commit -m "feat(cli): add autoguide status command with pipeline overview table"
```

---

### Task 9: CLI Entry Point + Bin Wiring

**Files:**
- Create: `packages/cli/src/index.ts`

- [ ] **Step 1: Create CLI entry point**

```typescript
// packages/cli/src/index.ts
import { Command } from 'commander';
import { createInitCommand } from './commands/init';
import { createPlanCommand } from './commands/plan';
import { createStatusCommand } from './commands/status';

const program = new Command();

program
  .name('autoguide')
  .description('Automated video guide generator for software products')
  .version('0.1.0');

program.addCommand(createInitCommand());
program.addCommand(createPlanCommand());
program.addCommand(createStatusCommand());

program.parse();
```

- [ ] **Step 2: Run all tests**

Run: `cd packages/cli && npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Verify TypeScript**

Run: `cd packages/cli && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Build the package**

Run: `cd packages/cli && npx tsup`
Expected: Build succeeds.

- [ ] **Step 5: Test CLI runs**

Run: `node packages/cli/dist/index.js --help`
Expected: Shows help with init, plan, status commands.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/index.ts
git commit -m "feat(cli): add CLI entry point wiring init, plan, and status commands"
```

---

## What's Next

After Phase 2 is complete, the following phases remain:

- **Phase 3: Capture Engine** — Playwright browser lifecycle, auth strategies, capture actions, `capture` command
- **Phase 4: Voiceover Engine** — ElevenLabs client, MP3 duration measurement, `voiceover` command
- **Phase 5: Build Engine** — code generator, templates, lock mechanism, `build` command
- **Phase 6: Render + Pipeline** — `render` command, `go` command (full pipeline orchestration)
- **Phase 7: Claude Code Skills** — skill definitions for `/video:*` commands
