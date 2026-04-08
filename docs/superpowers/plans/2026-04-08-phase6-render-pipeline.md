# Phase 6: Render + Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `autoguide render` command (shells out to Remotion CLI) and the `autoguide go` command (full pipeline orchestration).

**Architecture:** `render` uses `child_process.execSync` to invoke `npx remotion render`. `go` orchestrates the existing capture/voiceover/build/render commands in sequence with skip flags.

**Tech Stack:** child_process (Node built-in), existing CLI commands

---

## Phase Overview

| Task | What it builds | Depends on |
|------|---------------|------------|
| 1 | `autoguide render` command | — |
| 2 | `autoguide go` command | Task 1 |
| 3 | Wire both into CLI entry point | Tasks 1, 2 |

---

### Task 1: `autoguide render` Command

**Files:**
- Create: `packages/cli/src/commands/render.ts`

```typescript
// packages/cli/src/commands/render.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, writePlan, listPlans } from '../plan/parser';

export function createRenderCommand(): Command {
  return new Command('render')
    .description('Render final MP4 videos using Remotion')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Render all individual videos')
    .option('--output <path>', 'Custom output file path')
    .option('--quality <crf>', 'CRF quality (lower = better)', '18')
    .option('--concurrency <n>', 'Remotion render concurrency')
    .action(async (videoId: string | undefined, opts) => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      const paths = resolveProjectPaths(root);
      const config = loadConfig(paths.config);

      let videoIds: string[];
      if (opts.all) {
        videoIds = listPlans(paths.plans);
        if (videoIds.length === 0) {
          logger.error('No plans found.');
          process.exit(1);
        }
      } else if (videoId) {
        videoIds = [videoId];
      } else {
        logger.error('Provide a video-id or use --all');
        process.exit(1);
      }

      const outputDir = path.resolve(root, config.output.directory);
      fs.mkdirSync(outputDir, { recursive: true });

      for (const id of videoIds) {
        const planPath = paths.planFile(id);
        const plan = readPlan(planPath);

        const outputPath = opts.output
          ? path.resolve(opts.output)
          : path.join(outputDir, `${id}.${config.output.format}`);

        logger.header(`Rendering: ${id}`);

        if (plan.metadata.totalFrames) {
          logger.step('composition', `${id} (${plan.metadata.totalFrames} frames, ${plan.metadata.totalDuration}s)`);
        }
        logger.step('output', outputPath);

        const args = [
          'npx', 'remotion', 'render',
          id,
          outputPath,
          '--codec', config.output.codec ?? 'h264',
          '--crf', opts.quality,
        ];

        if (opts.concurrency) {
          args.push('--concurrency', opts.concurrency);
        }

        try {
          execSync(args.join(' '), {
            cwd: root,
            stdio: 'inherit',
          });

          const stats = fs.statSync(outputPath);
          const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);

          logger.success(`Rendered: ${outputPath} (${sizeMb} MB)`);

          plan.metadata.lastRendered = new Date().toISOString();
          writePlan(planPath, plan);
        } catch (err) {
          logger.error(`Render failed for ${id}`);
          if (err instanceof Error) logger.error(err.message);
        }
      }

      logger.blank();
      logger.success(`Render complete. Files in: ${outputDir}`);
    });
}
```

Commit: `feat(cli): add autoguide render command`

---

### Task 2: `autoguide go` Command

**Files:**
- Create: `packages/cli/src/commands/go.ts`

```typescript
// packages/cli/src/commands/go.ts
import { execSync } from 'child_process';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { findProjectRoot } from '../utils/paths';

const STAGES = ['capture', 'voiceover', 'build', 'render'] as const;

export function createGoCommand(): Command {
  return new Command('go')
    .description('Run full pipeline (capture → voiceover → build → render)')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Run for all video plans')
    .option('--skip-capture', 'Skip screenshot capture stage')
    .option('--skip-voiceover', 'Skip voiceover generation stage')
    .option('--skip-render', 'Skip final render')
    .option('--from <stage>', 'Start from a specific stage (capture|voiceover|build|render)')
    .action(async (videoId: string | undefined, opts) => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      if (!videoId && !opts.all) {
        logger.error('Provide a video-id or use --all');
        process.exit(1);
      }

      const target = opts.all ? '--all' : videoId!;

      // Determine which stages to run
      let startIndex = 0;
      if (opts.from) {
        const idx = STAGES.indexOf(opts.from);
        if (idx === -1) {
          logger.error(`Unknown stage: ${opts.from}. Use: ${STAGES.join(', ')}`);
          process.exit(1);
        }
        startIndex = idx;
      }

      const skips = new Set<string>();
      if (opts.skipCapture) skips.add('capture');
      if (opts.skipVoiceover) skips.add('voiceover');
      if (opts.skipRender) skips.add('render');

      logger.header(`Autoguide Pipeline: ${target}`);

      for (let i = startIndex; i < STAGES.length; i++) {
        const stage = STAGES[i];

        if (skips.has(stage)) {
          logger.step('skip', stage);
          continue;
        }

        logger.blank();
        logger.info(`Stage: ${stage}`);

        const cmd = opts.all
          ? `npx autoguide ${stage} --all`
          : `npx autoguide ${stage} ${target}`;

        try {
          execSync(cmd, {
            cwd: root,
            stdio: 'inherit',
          });
        } catch (err) {
          logger.error(`Stage "${stage}" failed.`);
          if (err instanceof Error) logger.error(err.message);
          logger.info('Fix the issue and resume with: autoguide go ' + target + ' --from ' + stage);
          process.exit(1);
        }
      }

      logger.blank();
      logger.success('Pipeline complete!');
    });
}
```

Commit: `feat(cli): add autoguide go command for full pipeline orchestration`

---

### Task 3: Wire into CLI Entry Point

Update `packages/cli/src/index.ts` to add render and go commands.

Commit: `feat(cli): wire render and go commands into CLI entry point`
