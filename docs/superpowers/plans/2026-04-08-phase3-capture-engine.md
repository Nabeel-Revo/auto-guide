# Phase 3: Capture Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Playwright-based screenshot capture engine and the `autoguide capture` command. Supports auto-capture (headless navigation + actions), manual-capture (user prompts), authentication strategies, and plan updates.

**Architecture:** `CaptureEngine` class manages browser lifecycle, auth, and screenshot capture. Each scene from the plan is processed sequentially. Auto scenes navigate + execute actions + screenshot. Manual scenes prompt the user. The capture command orchestrates everything and updates the plan YAML.

**Tech Stack:** Playwright, readline/promises (Node built-in), @autoguide/core types, @autoguide/cli utils

**Design Spec:** `docs/specs/2026-04-08-autoguide-design.md` — Sections 5 (capture command), 9 (Playwright automation)

---

## Phase Overview

| Task | What it builds | Depends on |
|------|---------------|------------|
| 1 | Add Playwright dependency | — |
| 2 | CaptureEngine class (browser, auth, actions, screenshot) | Task 1 |
| 3 | `autoguide capture` command | Task 2 |

## File Map

```
packages/cli/src/
├── playwright/
│   ├── engine.ts              # CaptureEngine class
│   └── auth.ts                # Authentication strategies
├── commands/
│   └── capture.ts             # autoguide capture command
```

---

### Task 1: Add Playwright Dependency

**Files:**
- Modify: `packages/cli/package.json`

- [ ] **Step 1: Add playwright as dependency**

Add `"playwright": "^1.48.0"` to `dependencies` in `packages/cli/package.json`.

- [ ] **Step 2: Install**

Run: `pnpm install`

- [ ] **Step 3: Commit**

```bash
git add packages/cli/package.json pnpm-lock.yaml
git commit -m "chore(cli): add playwright dependency"
```

---

### Task 2: CaptureEngine Class

**Files:**
- Create: `packages/cli/src/playwright/auth.ts`
- Create: `packages/cli/src/playwright/engine.ts`

- [ ] **Step 1: Create auth strategies**

```typescript
// packages/cli/src/playwright/auth.ts
import type { Page } from 'playwright';
import type { AuthConfig } from '@autoguide/core';
import { logger } from '../utils/logger';

export async function authenticate(page: Page, baseUrl: string, auth: AuthConfig): Promise<void> {
  switch (auth.strategy) {
    case 'form':
      await authenticateForm(page, baseUrl, auth);
      break;
    case 'cookie':
      await authenticateCookie(page, auth);
      break;
    case 'bearer':
      await authenticateBearer(page, auth);
      break;
    case 'none':
      break;
  }
}

async function authenticateForm(page: Page, baseUrl: string, auth: AuthConfig): Promise<void> {
  if (!auth.loginUrl || !auth.credentials || !auth.selectors) {
    throw new Error('Form auth requires loginUrl, credentials, and selectors');
  }

  logger.step('auth', `Logging in via form at ${auth.loginUrl}`);

  const loginUrl = auth.loginUrl.startsWith('http') ? auth.loginUrl : `${baseUrl}${auth.loginUrl}`;
  await page.goto(loginUrl);
  await page.fill(auth.selectors.username, auth.credentials.username);
  await page.fill(auth.selectors.password, auth.credentials.password);
  await page.click(auth.selectors.submit);

  if (auth.waitAfterLogin) {
    await page.waitForURL(`**${auth.waitAfterLogin}**`, { timeout: 15000 });
  }

  logger.success('Authentication successful');
}

async function authenticateCookie(page: Page, auth: AuthConfig): Promise<void> {
  if (!auth.cookies) {
    throw new Error('Cookie auth requires cookies array');
  }

  logger.step('auth', 'Setting cookies');
  await page.context().addCookies(auth.cookies);
  logger.success('Cookies set');
}

async function authenticateBearer(page: Page, auth: AuthConfig): Promise<void> {
  if (!auth.token) {
    throw new Error('Bearer auth requires token');
  }

  logger.step('auth', 'Setting bearer token header');
  await page.setExtraHTTPHeaders({
    Authorization: `Bearer ${auth.token}`,
  });
  logger.success('Bearer token set');
}
```

- [ ] **Step 2: Create CaptureEngine**

```typescript
// packages/cli/src/playwright/engine.ts
import fs from 'fs';
import path from 'path';
import { chromium, type Browser, type Page } from 'playwright';
import type { CaptureConfig, AutoCapture, CaptureAction } from '@autoguide/core';
import { logger } from '../utils/logger';
import { authenticate } from './auth';

export interface CaptureEngineConfig {
  viewport: { width: number; height: number };
  headless: boolean;
  baseUrl: string;
  timeout: number;
}

export interface CaptureResult {
  sceneId: string;
  success: boolean;
  screenshotPath?: string;
  error?: string;
}

export class CaptureEngine {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: CaptureEngineConfig;

  constructor(config: CaptureEngineConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });
    const context = await this.browser.newContext({
      viewport: this.config.viewport,
    });
    this.page = await context.newPage();
    this.page.setDefaultTimeout(this.config.timeout);
  }

  async authenticateWith(auth: import('@autoguide/core').AuthConfig): Promise<void> {
    if (!this.page) throw new Error('Engine not initialized');
    await authenticate(this.page, this.config.baseUrl, auth);
  }

  async captureAutoScene(
    capture: AutoCapture,
    outputPath: string,
    delay?: number,
  ): Promise<void> {
    if (!this.page) throw new Error('Engine not initialized');

    const url = capture.route.startsWith('http')
      ? capture.route
      : `${this.config.baseUrl}${capture.route}`;

    await this.page.goto(url, { waitUntil: 'networkidle' });

    // Execute actions
    for (const action of capture.actions) {
      await this.executeAction(action);
    }

    // Wait for selector if specified
    if (capture.waitFor) {
      await this.page.waitForSelector(capture.waitFor, { timeout: this.config.timeout });
    }

    // Wait for delay
    const waitMs = capture.delay ?? delay ?? 0;
    if (waitMs > 0) {
      await this.page.waitForTimeout(waitMs);
    }

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Take screenshot
    await this.page.screenshot({
      path: outputPath,
      fullPage: false,
    });
  }

  private async executeAction(action: CaptureAction): Promise<void> {
    if (!this.page) throw new Error('Engine not initialized');

    switch (action.type) {
      case 'click':
        await this.page.click(action.selector);
        break;
      case 'type':
        await this.page.fill(action.selector, action.text);
        break;
      case 'hover':
        await this.page.hover(action.selector);
        break;
      case 'wait':
        await this.page.waitForTimeout(action.ms);
        break;
      case 'waitForSelector':
        await this.page.waitForSelector(action.selector, { timeout: action.timeout });
        break;
      case 'scroll':
        await this.page.evaluate((y) => window.scrollTo(0, y), action.y);
        break;
      case 'select':
        await this.page.selectOption(action.selector, action.value);
        break;
      case 'press':
        await this.page.keyboard.press(action.key);
        break;
      case 'evaluate':
        await this.page.evaluate(action.script);
        break;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd packages/cli && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/playwright/
git commit -m "feat(cli): add CaptureEngine with Playwright browser, auth, and actions"
```

---

### Task 3: `autoguide capture` Command

**Files:**
- Create: `packages/cli/src/commands/capture.ts`
- Modify: `packages/cli/src/index.ts` — add capture command

- [ ] **Step 1: Create capture command**

```typescript
// packages/cli/src/commands/capture.ts
import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { Command } from 'commander';
import type { Scene, VideoPlan } from '@autoguide/core';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, writePlan, listPlans } from '../plan/parser';
import { CaptureEngine } from '../playwright/engine';

interface CaptureStats {
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{ sceneId: string; error: string }>;
}

async function captureVideo(
  videoId: string,
  plan: VideoPlan,
  engine: CaptureEngine,
  screenshotDir: string,
  planPath: string,
  opts: { autoOnly?: boolean; manualOnly?: boolean; retake?: string },
): Promise<CaptureStats> {
  const stats: CaptureStats = { succeeded: 0, failed: 0, skipped: 0, errors: [] };

  const allScenes: { scene: Scene; sectionId: string }[] = [];
  for (const section of plan.sections) {
    for (const scene of section.scenes) {
      allScenes.push({ scene, sectionId: section.id });
    }
  }

  logger.header(`Capturing: ${videoId} (${allScenes.length} scenes)`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  for (const { scene } of allScenes) {
    // Skip if retake mode and not the target scene
    if (opts.retake && scene.id !== opts.retake) {
      stats.skipped++;
      continue;
    }

    const isAuto = scene.capture.mode === 'auto';
    const modeLabel = isAuto ? 'auto' : 'manual';

    // Skip based on mode filters
    if (opts.autoOnly && !isAuto) {
      stats.skipped++;
      continue;
    }
    if (opts.manualOnly && isAuto) {
      stats.skipped++;
      continue;
    }

    const outputPath = path.join(screenshotDir, `${scene.id}.png`);

    if (isAuto) {
      try {
        await engine.captureAutoScene(
          scene.capture as import('@autoguide/core').AutoCapture,
          outputPath,
        );
        scene.screenshot = path.relative(path.dirname(planPath) + '/..', outputPath).replace(/\\/g, '/');
        stats.succeeded++;
        logger.step(modeLabel, `${scene.id} ${'·'.repeat(Math.max(1, 30 - scene.id.length))} saved`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        stats.failed++;
        stats.errors.push({ sceneId: scene.id, error: errorMsg });
        logger.step(modeLabel, `${scene.id} ${'·'.repeat(Math.max(1, 30 - scene.id.length))} FAILED`);
        logger.error(`  ${errorMsg}`);
      }
    } else {
      const manualCapture = scene.capture as import('@autoguide/core').ManualCapture;
      logger.step(modeLabel, `${scene.id} ${'·'.repeat(Math.max(1, 30 - scene.id.length))} waiting`);
      logger.info(`  → ${manualCapture.instructions}`);
      logger.info(`  → Save to: ${outputPath}`);

      await rl.question('  Press Enter when screenshot is saved...');

      if (fs.existsSync(outputPath)) {
        scene.screenshot = path.relative(path.dirname(planPath) + '/..', outputPath).replace(/\\/g, '/');
        stats.succeeded++;
        logger.success(`  saved`);
      } else {
        stats.failed++;
        stats.errors.push({ sceneId: scene.id, error: `File not found: ${outputPath}` });
        logger.error(`  Screenshot not found at ${outputPath}`);
      }
    }
  }

  rl.close();

  // Update metadata
  plan.metadata.screenshotsCaptured = plan.sections.reduce(
    (count, sec) => count + sec.scenes.filter((s) => s.screenshot !== null).length,
    0,
  );

  // Write updated plan
  writePlan(planPath, plan);

  return stats;
}

export function createCaptureCommand(): Command {
  return new Command('capture')
    .description('Capture screenshots for a video plan')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Capture for all plans')
    .option('--auto-only', 'Only run auto-capture scenes')
    .option('--manual-only', 'Only prompt for manual captures')
    .option('--headed', 'Run browser in headed mode')
    .option('--retake <scene-id>', 'Re-capture a specific scene')
    .option('--timeout <ms>', 'Page load timeout in ms', '30000')
    .action(async (videoId: string | undefined, opts) => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      const paths = resolveProjectPaths(root);
      const config = loadConfig(paths.config);

      // Determine which videos to capture
      let videoIds: string[];
      if (opts.all) {
        videoIds = listPlans(paths.plans);
        if (videoIds.length === 0) {
          logger.error('No plans found. Run "autoguide plan <video-id>" first.');
          process.exit(1);
        }
      } else if (videoId) {
        videoIds = [videoId];
      } else {
        logger.error('Provide a video-id or use --all');
        process.exit(1);
      }

      // Skip engine init for manual-only mode
      let engine: CaptureEngine | null = null;

      if (!opts.manualOnly) {
        engine = new CaptureEngine({
          viewport: config.capture.viewport,
          headless: !opts.headed,
          baseUrl: config.project.url,
          timeout: parseInt(opts.timeout, 10),
        });

        await engine.init();

        // Authenticate if configured
        if (config.capture.auth && config.capture.auth.strategy !== 'none') {
          await engine.authenticateWith(config.capture.auth);
        }
      }

      let totalSucceeded = 0;
      let totalFailed = 0;
      const allErrors: Array<{ sceneId: string; error: string }> = [];

      for (const id of videoIds) {
        const planPath = paths.planFile(id);
        const plan = readPlan(planPath);
        const screenshotDir = paths.screenshotDir(id);

        const stats = await captureVideo(id, plan, engine!, screenshotDir, planPath, {
          autoOnly: opts.autoOnly,
          manualOnly: opts.manualOnly,
          retake: opts.retake,
        });

        totalSucceeded += stats.succeeded;
        totalFailed += stats.failed;
        allErrors.push(...stats.errors);
      }

      if (engine) {
        await engine.close();
      }

      // Summary
      logger.blank();
      logger.info(`Capture complete: ${totalSucceeded} succeeded, ${totalFailed} failed`);

      if (allErrors.length > 0) {
        const errorLog = path.join(root, '.autoguide', 'capture-errors.log');
        fs.mkdirSync(path.dirname(errorLog), { recursive: true });
        fs.writeFileSync(
          errorLog,
          allErrors.map((e) => `${e.sceneId}: ${e.error}`).join('\n'),
          'utf-8',
        );
        logger.info(`Failed scenes logged to: ${errorLog}`);
      }
    });
}
```

- [ ] **Step 2: Update CLI entry point**

Add to `packages/cli/src/index.ts`:

```typescript
import { createCaptureCommand } from './commands/capture';
// ... after other addCommand calls:
program.addCommand(createCaptureCommand());
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd packages/cli && npx tsc --noEmit`

- [ ] **Step 4: Build and test CLI**

Run: `cd packages/cli && npx tsup && node dist/index.js capture --help`
Expected: Shows capture command help with all flags.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/capture.ts packages/cli/src/index.ts
git commit -m "feat(cli): add autoguide capture command with auto/manual screenshot modes"
```

---

## What's Next

- **Phase 4: Voiceover Engine** — ElevenLabs client, MP3 duration measurement, `voiceover` command
- **Phase 5: Build Engine** — code generator, templates, lock mechanism, `build` command
- **Phase 6: Render + Pipeline** — `render` command, `go` command
- **Phase 7: Claude Code Skills** — skill definitions for `/video:*` commands
