# Phase 4: Voiceover Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ElevenLabs TTS client, MP3 duration measurement, and the `autoguide voiceover` command that generates narration audio, measures durations, auto-adjusts scene timing, and updates the plan YAML.

**Architecture:** `VoiceoverProvider` interface with `ElevenLabsProvider` implementation. Uses native `fetch` for API calls. Duration measured via `@remotion/media-parser`. The voiceover command extracts all scripts from the plan, generates audio, measures durations, adjusts scene timing, and writes everything back.

**Tech Stack:** ElevenLabs REST API (fetch), @remotion/media-parser, @autoguide/core types

**Design Spec:** `docs/specs/2026-04-08-autoguide-design.md` — Sections 5 (voiceover command), 8 (ElevenLabs integration)

---

## Phase Overview

| Task | What it builds | Depends on |
|------|---------------|------------|
| 1 | Add @remotion/media-parser dependency | — |
| 2 | VoiceoverProvider interface + ElevenLabs client | Task 1 |
| 3 | MP3 duration measurement | Task 1 |
| 4 | `autoguide voiceover` command | Tasks 2, 3 |

## File Map

```
packages/cli/src/
├── elevenlabs/
│   ├── types.ts               # VoiceoverProvider interface, VoiceConfig
│   ├── client.ts              # ElevenLabsProvider implementation
│   └── duration.ts            # MP3 duration measurement
├── commands/
│   └── voiceover.ts           # autoguide voiceover command
```

---

### Task 1: Add Dependencies

**Files:**
- Modify: `packages/cli/package.json`

- [ ] **Step 1: Add @remotion/media-parser**

Add to `dependencies` in `packages/cli/package.json`:
```
"@remotion/media-parser": "^4.0.445"
```

- [ ] **Step 2: Install**

Run: `pnpm install`

- [ ] **Step 3: Commit**

```bash
git add packages/cli/package.json pnpm-lock.yaml
git commit -m "chore(cli): add @remotion/media-parser dependency"
```

---

### Task 2: VoiceoverProvider + ElevenLabs Client

**Files:**
- Create: `packages/cli/src/elevenlabs/types.ts`
- Create: `packages/cli/src/elevenlabs/client.ts`
- Create: `packages/cli/tests/elevenlabs/client.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// packages/cli/tests/elevenlabs/client.test.ts
import { describe, it, expect } from 'vitest';
import { ElevenLabsProvider } from '../../src/elevenlabs/client';

describe('ElevenLabsProvider', () => {
  it('estimates cost correctly', () => {
    const provider = new ElevenLabsProvider('fake-key');
    const result = provider.estimateCost([
      'Hello world',          // 11 chars
      'This is a test',       // 14 chars
    ]);
    expect(result.characters).toBe(25);
    expect(result.estimatedCost).toBeCloseTo(0.0075, 4);
  });

  it('estimates zero cost for empty texts', () => {
    const provider = new ElevenLabsProvider('fake-key');
    const result = provider.estimateCost([]);
    expect(result.characters).toBe(0);
    expect(result.estimatedCost).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify fail**

- [ ] **Step 3: Create types**

```typescript
// packages/cli/src/elevenlabs/types.ts

export interface VoiceConfig {
  voiceId: string;
  model: string;
  settings: {
    stability: number;
    similarity_boost: number;
    speed: number;
  };
}

export interface CostEstimate {
  characters: number;
  estimatedCost: number;
}

export interface VoiceoverProvider {
  generateSpeech(text: string, config: VoiceConfig): Promise<Buffer>;
  estimateCost(texts: string[]): CostEstimate;
}
```

- [ ] **Step 4: Create ElevenLabs client**

```typescript
// packages/cli/src/elevenlabs/client.ts
import type { VoiceoverProvider, VoiceConfig, CostEstimate } from './types';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';
const COST_PER_CHAR = 0.0003; // ~$0.30 per 1000 chars

export class ElevenLabsProvider implements VoiceoverProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSpeech(text: string, config: VoiceConfig): Promise<Buffer> {
    const url = `${ELEVENLABS_API}/text-to-speech/${config.voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: config.model,
        voice_settings: {
          stability: config.settings.stability,
          similarity_boost: config.settings.similarity_boost,
          speed: config.settings.speed,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  estimateCost(texts: string[]): CostEstimate {
    const characters = texts.reduce((sum, t) => sum + t.length, 0);
    return {
      characters,
      estimatedCost: characters * COST_PER_CHAR,
    };
  }
}
```

- [ ] **Step 5: Run tests**

Run: `cd packages/cli && npx vitest run tests/elevenlabs/client.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/elevenlabs/ packages/cli/tests/elevenlabs/
git commit -m "feat(cli): add ElevenLabs TTS client with VoiceoverProvider interface"
```

---

### Task 3: MP3 Duration Measurement

**Files:**
- Create: `packages/cli/src/elevenlabs/duration.ts`

- [ ] **Step 1: Create duration utility**

```typescript
// packages/cli/src/elevenlabs/duration.ts
import { parseMedia } from '@remotion/media-parser';
import { nodeReader } from '@remotion/media-parser/node';

export async function getMp3Duration(filePath: string): Promise<number> {
  const result = await parseMedia({
    src: filePath,
    fields: { durationInSeconds: true },
    reader: nodeReader,
    acknowledgeRemotionLicense: true,
  });
  return result.durationInSeconds!;
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd packages/cli && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/elevenlabs/duration.ts
git commit -m "feat(cli): add MP3 duration measurement via @remotion/media-parser"
```

---

### Task 4: `autoguide voiceover` Command

**Files:**
- Create: `packages/cli/src/commands/voiceover.ts`
- Modify: `packages/cli/src/index.ts` — add voiceover command

- [ ] **Step 1: Create voiceover command**

```typescript
// packages/cli/src/commands/voiceover.ts
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import type { VideoPlan, VoiceoverEntry } from '@autoguide/core';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, writePlan, listPlans } from '../plan/parser';
import { ElevenLabsProvider } from '../elevenlabs/client';
import type { VoiceConfig } from '../elevenlabs/types';
import { getMp3Duration } from '../elevenlabs/duration';

interface VoiceoverClip {
  index: number;
  label: string;
  script: string;
  entry: VoiceoverEntry;
}

function extractClips(plan: VideoPlan): VoiceoverClip[] {
  const clips: VoiceoverClip[] = [];
  let index = 0;

  // Intro
  clips.push({ index: index++, label: 'intro', script: plan.intro.voiceover.script, entry: plan.intro.voiceover });

  for (const section of plan.sections) {
    // Section title voiceover
    clips.push({ index: index++, label: `section-${section.id}`, script: section.voiceover.script, entry: section.voiceover });

    for (const scene of section.scenes) {
      clips.push({ index: index++, label: scene.id, script: scene.voiceover.script, entry: scene.voiceover });
    }
  }

  // Outro
  clips.push({ index: index++, label: 'outro', script: plan.outro.voiceover.script, entry: plan.outro.voiceover });

  return clips;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

async function generateVoiceovers(
  videoId: string,
  plan: VideoPlan,
  provider: ElevenLabsProvider,
  voiceConfig: VoiceConfig,
  voiceoverDir: string,
  planPath: string,
  opts: { force?: boolean; scene?: string; dryRun?: boolean },
  buffer: number,
): Promise<void> {
  const clips = extractClips(plan);

  // Filter by scene if specified
  const targetClips = opts.scene
    ? clips.filter((c) => c.label === opts.scene)
    : clips;

  if (targetClips.length === 0) {
    logger.warn(`No clips found${opts.scene ? ` matching scene "${opts.scene}"` : ''}`);
    return;
  }

  // Cost estimate
  const estimate = provider.estimateCost(targetClips.map((c) => c.script));
  logger.info(`Estimated: ${targetClips.length} clips, ${estimate.characters} characters, ~$${estimate.estimatedCost.toFixed(2)}`);

  if (opts.dryRun) {
    logger.blank();
    const headers = ['Clip', 'Script', 'Est.'];
    const rows = targetClips.map((c) => [
      `vo-${pad(c.index)} ${c.label}`,
      c.script.length > 50 ? c.script.substring(0, 47) + '...' : c.script,
      `~${Math.ceil(c.script.length / 15)}s`,
    ]);
    logger.table(headers, rows);
    return;
  }

  logger.blank();
  fs.mkdirSync(voiceoverDir, { recursive: true });

  const durationAdjustments: Array<{ label: string; from: number; to: number }> = [];

  for (const clip of targetClips) {
    const fileName = `vo-${pad(clip.index)}.mp3`;
    const filePath = path.join(voiceoverDir, fileName);
    const relPath = `public/voiceover/${videoId}/${fileName}`;

    // Skip if already exists and not forced
    if (!opts.force && clip.entry.file && fs.existsSync(filePath)) {
      logger.step('skip', `${fileName} (already exists)`);
      continue;
    }

    try {
      const audioBuffer = await provider.generateSpeech(clip.script, voiceConfig);
      fs.writeFileSync(filePath, audioBuffer);

      // Measure duration
      const duration = await getMp3Duration(filePath);
      const roundedDuration = Math.round(duration * 100) / 100;

      // Update plan entry
      clip.entry.file = relPath;
      clip.entry.duration = roundedDuration;

      logger.step('saved', `vo-${pad(clip.index)} ${clip.label} ${'·'.repeat(Math.max(1, 20 - clip.label.length))} ${roundedDuration}s`);

      // Auto-adjust scene duration if VO is longer
      const voDurationWithBuffer = roundedDuration + buffer;

      // Find and adjust the corresponding scene/intro/outro duration
      if (clip.label === 'intro' && plan.intro.duration < voDurationWithBuffer) {
        const oldDur = plan.intro.duration;
        plan.intro.duration = Math.round(voDurationWithBuffer * 10) / 10;
        durationAdjustments.push({ label: 'intro', from: oldDur, to: plan.intro.duration });
      } else if (clip.label === 'outro' && plan.outro.duration < voDurationWithBuffer) {
        const oldDur = plan.outro.duration;
        plan.outro.duration = Math.round(voDurationWithBuffer * 10) / 10;
        durationAdjustments.push({ label: 'outro', from: oldDur, to: plan.outro.duration });
      } else {
        // Check scenes
        for (const section of plan.sections) {
          for (const scene of section.scenes) {
            if (scene.id === clip.label && scene.duration < voDurationWithBuffer) {
              const oldDur = scene.duration;
              scene.duration = Math.round(voDurationWithBuffer * 10) / 10;
              durationAdjustments.push({ label: scene.id, from: oldDur, to: scene.duration });
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`  vo-${pad(clip.index)} ${clip.label}: ${msg}`);
    }
  }

  // Print duration adjustments
  if (durationAdjustments.length > 0) {
    logger.blank();
    logger.info('Duration adjustments:');
    for (const adj of durationAdjustments) {
      logger.step(adj.label, `${adj.from}s → ${adj.to}s`);
    }
  }

  // Update metadata
  plan.metadata.voiceoverGenerated = extractClips(plan).filter((c) => c.entry.file !== null).length;

  // Write updated plan
  writePlan(planPath, plan);
  logger.blank();
  logger.success(`Plan updated: ${planPath}`);
}

export function createVoiceoverCommand(): Command {
  return new Command('voiceover')
    .description('Generate voiceover audio from plan scripts')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Generate for all plans')
    .option('--dry-run', 'Show scripts and cost estimate without generating')
    .option('--force', 'Regenerate all clips even if files exist')
    .option('--scene <scene-id>', 'Regenerate a specific scene')
    .option('--voice <voice-id>', 'Override voice ID')
    .action(async (videoId: string | undefined, opts) => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      const paths = resolveProjectPaths(root);
      const config = loadConfig(paths.config);

      if (config.voiceover.provider === 'none' && !opts.dryRun) {
        logger.error('No voiceover provider configured. Update autoguide.config.yaml.');
        process.exit(1);
      }

      let videoIds: string[];
      if (opts.all) {
        videoIds = listPlans(paths.plans);
      } else if (videoId) {
        videoIds = [videoId];
      } else {
        logger.error('Provide a video-id or use --all');
        process.exit(1);
      }

      const provider = new ElevenLabsProvider(config.voiceover.apiKey);
      const voiceConfig: VoiceConfig = {
        voiceId: opts.voice || config.voiceover.voiceId || '',
        model: config.voiceover.model || 'eleven_multilingual_v2',
        settings: config.voiceover.settings || { stability: 0.5, similarity_boost: 0.75, speed: 1.0 },
      };
      const buffer = config.voiceover.buffer ?? 0.8;

      for (const id of videoIds) {
        const planPath = paths.planFile(id);
        const plan = readPlan(planPath);
        const voiceoverDir = paths.voiceoverDir(id);

        logger.header(`Voiceover: ${id}`);

        await generateVoiceovers(id, plan, provider, voiceConfig, voiceoverDir, planPath, {
          force: opts.force,
          scene: opts.scene,
          dryRun: opts.dryRun,
        }, buffer);
      }
    });
}
```

- [ ] **Step 2: Update CLI entry point**

Add to `packages/cli/src/index.ts`:
```typescript
import { createVoiceoverCommand } from './commands/voiceover';
program.addCommand(createVoiceoverCommand());
```

- [ ] **Step 3: Verify TypeScript + build + CLI help**

Run: `cd packages/cli && npx tsc --noEmit && npx tsup && node dist/index.js voiceover --help`

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/voiceover.ts packages/cli/src/index.ts
git commit -m "feat(cli): add autoguide voiceover command with ElevenLabs TTS and duration sync"
```

---

## What's Next

- **Phase 5: Build Engine** — code generator, templates, lock mechanism, `build` command
- **Phase 6: Render + Pipeline** — `render`, `go` commands
- **Phase 7: Claude Code Skills**
