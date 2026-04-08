# Phase 5: Build Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the code generator that transforms video plan YAML into Remotion `.tsx` compositions, the duration calculator, the lock block preservation system, and the `autoguide build` command.

**Architecture:** Templates map plan scene types to JSX code strings. A generator assembles the full composition file. A duration calculator replicates the `add()`/`addHard()` cursor logic to compute `durationInFrames`. Lock blocks (`@autoguide-lock`/`@autoguide-unlock`) are preserved across rebuilds.

**Tech Stack:** String template generation, @autoguide/core types, vitest

**Design Spec:** `docs/specs/2026-04-08-autoguide-design.md` — Sections 5 (build command), 10 (code generation)

---

## Phase Overview

| Task | What it builds | Depends on |
|------|---------------|------------|
| 1 | Duration calculator | — |
| 2 | Code templates (intro, screenshot, section title, outro) | — |
| 3 | Lock block preservation | — |
| 4 | Full composition generator | Tasks 1, 2, 3 |
| 5 | `autoguide build` command | Task 4 |

## File Map

```
packages/cli/src/
├── builder/
│   ├── duration.ts            # Duration/frame calculator
│   ├── templates.ts           # Scene-type code templates
│   ├── lock.ts                # Lock block preservation
│   └── generator.ts           # Full composition code generator
├── commands/
│   └── build.ts               # autoguide build command
```

---

### Task 1: Duration Calculator

**Files:**
- Create: `packages/cli/src/builder/duration.ts`
- Create: `packages/cli/tests/builder/duration.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// packages/cli/tests/builder/duration.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotalFrames } from '../../src/builder/duration';
import type { VideoPlan } from '@autoguide/core';

const makePlan = (introDur: number, outroDur: number, sceneDurations: number[][]): VideoPlan => ({
  video: { id: 'test', title: 'Test', module: 'M', videoNumber: 1 },
  intro: { title: 'T', duration: introDur, voiceover: { script: '', file: null, duration: null } },
  sections: sceneDurations.map((scenes, si) => ({
    id: `s${si}`,
    title: `Section ${si}`,
    step: String(si + 1).padStart(2, '0'),
    voiceover: { script: '', file: null, duration: null },
    scenes: scenes.map((dur, sci) => ({
      id: `scene-${si}-${sci}`,
      type: 'screenshot' as const,
      capture: { mode: 'auto' as const, route: '/', actions: [] },
      screenshot: null,
      duration: dur,
      highlights: [],
      voiceover: { script: '', file: null, duration: null },
    })),
  })),
  outro: { duration: outroDur, voiceover: { script: '', file: null, duration: null } },
  metadata: { totalDuration: null, totalFrames: null, screenshotsCaptured: 0, screenshotsTotal: 0, voiceoverGenerated: 0, voiceoverTotal: 0, lastBuilt: null, lastRendered: null },
});

describe('calculateTotalFrames', () => {
  it('calculates frames for intro + outro only', () => {
    const plan = makePlan(5, 5, []);
    // 5*30 + 5*30 = 150 + 150 = 300
    expect(calculateTotalFrames(plan, 30, 10, 2.5)).toBe(300);
  });

  it('calculates frames with one section and one scene', () => {
    const plan = makePlan(5, 5, [[8]]);
    // intro: 5*30=150 (hard)
    // section title: 2.5*30=75 (hard)
    // scene: 8*30=240, but add() so cursor += 240-10=230
    // outro: 5*30=150 (hard)
    // total: 150+75+230+150 = 605
    expect(calculateTotalFrames(plan, 30, 10, 2.5)).toBe(605);
  });

  it('calculates frames with multiple scenes (overlap)', () => {
    const plan = makePlan(5, 5, [[8, 6]]);
    // intro: 150 (hard)
    // section title: 75 (hard)
    // scene1: 240-10=230 (add)
    // scene2: 180-10=170 (add)
    // outro: 150 (hard)
    // total: 150+75+230+170+150 = 775
    expect(calculateTotalFrames(plan, 30, 10, 2.5)).toBe(775);
  });
});
```

- [ ] **Step 2: Run tests to verify fail**

- [ ] **Step 3: Create duration calculator**

```typescript
// packages/cli/src/builder/duration.ts
import type { VideoPlan } from '@autoguide/core';

export function calculateTotalFrames(
  plan: VideoPlan,
  fps: number,
  overlap: number,
  sectionTitleDuration: number,
): number {
  let cursor = 0;

  // Intro (addHard)
  cursor += Math.round(plan.intro.duration * fps);

  for (const section of plan.sections) {
    // Section title (addHard)
    cursor += Math.round(sectionTitleDuration * fps);

    for (const scene of section.scenes) {
      const dur = Math.round(scene.duration * fps);
      cursor += dur - overlap; // add() with overlap
    }
  }

  // Outro (addHard)
  cursor += Math.round(plan.outro.duration * fps);

  return cursor;
}
```

- [ ] **Step 4: Run tests**

Run: `cd packages/cli && npx vitest run tests/builder/duration.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/builder/duration.ts packages/cli/tests/builder/duration.test.ts
git commit -m "feat(cli): add duration calculator for frame counting with add/addHard cursor"
```

---

### Task 2: Code Templates

**Files:**
- Create: `packages/cli/src/builder/templates.ts`

- [ ] **Step 1: Create templates**

```typescript
// packages/cli/src/builder/templates.ts
import type { VideoPlan, Scene, SceneSection } from '@autoguide/core';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '\\`');
}

export function generateImports(videoId: string): string {
  return `import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import {
  IntroSlide,
  OutroSlide,
  ScreenshotScene,
  HighlightOverlay,
  TextCallout,
  SectionTitle,
} from '@autoguide/core';

const SHOTS = 'screenshots/${videoId}';
const VO = 'voiceover/${videoId}';
`;
}

export function generateIntro(plan: VideoPlan, voIndex: number, volume: number): string {
  const intro = plan.intro;
  return `
  // ── INTRO (${intro.duration}s) — vo-${pad(voIndex)}: ${intro.voiceover.duration ?? '?'}s ──
  addHard(${intro.duration}, (
    <>
      <IntroSlide
        title="${escapeString(intro.title)}"
        subtitle="${escapeString(intro.subtitle ?? '')}"
        videoNumber={${plan.video.videoNumber}}
      />
      <Audio src={staticFile(\`\${VO}/vo-${pad(voIndex)}.mp3\`)} volume={${volume}} />
    </>
  ));`;
}

export function generateSectionTitle(section: SceneSection, voIndex: number, volume: number): string {
  return `
  // ── Section: ${escapeString(section.title)} ──
  addHard(sectionTitleDur, (
    <>
      <SectionTitle
        title="${escapeString(section.title)}"
        subtitle="${escapeString(section.subtitle ?? '')}"
        step="${section.step}"
      />
      <Audio src={staticFile(\`\${VO}/vo-${pad(voIndex)}.mp3\`)} volume={${volume}} />
    </>
  ));`;
}

export function generateScreenshotScene(scene: Scene, voIndex: number, volume: number): string {
  const durVar = `${camelCase(scene.id)}Dur`;

  let highlightCode = '';
  if (scene.highlights.length > 0) {
    const items = scene.highlights
      .map((h) => `          { x: ${h.x}, y: ${h.y}, width: ${h.width}, height: ${h.height}${h.label ? `, label: '${escapeString(h.label)}'` : ''} }`)
      .join(',\n');
    highlightCode = `
      <HighlightOverlay
        delay={${scene.highlights[0].delay ?? 40}}
        highlights={[
${items}
        ]}
      />`;
  }

  let calloutCode = '';
  if (scene.callout) {
    const c = scene.callout;
    calloutCode = `
      <TextCallout text="${escapeString(c.text)}" x={${c.x}} y={${c.y}} delay={${c.delay ?? 0}} size="${c.size ?? 'md'}" align="${c.align ?? 'left'}" />`;
  }

  return `
  // ── ${escapeString(scene.caption ?? scene.id)} (${scene.duration}s) — vo-${pad(voIndex)}: ${scene.voiceover.duration ?? '?'}s ──
  const ${durVar} = ${scene.duration} * SEC;
  add(${scene.duration}, (
    <>
      <ScreenshotScene
        src={staticFile(\`\${SHOTS}/${scene.id}.png\`)}
        caption="${escapeString(scene.caption ?? '')}"
        durationInFrames={${durVar}}
      />${highlightCode}${calloutCode}
      <Audio src={staticFile(\`\${VO}/vo-${pad(voIndex)}.mp3\`)} volume={${volume}} />
    </>
  ));`;
}

export function generateOutro(plan: VideoPlan, voIndex: number, volume: number, websiteUrl?: string, docsUrl?: string): string {
  const outro = plan.outro;
  return `
  // ── OUTRO (${outro.duration}s) — vo-${pad(voIndex)}: ${outro.voiceover.duration ?? '?'}s ──
  addHard(${outro.duration}, (
    <>
      <OutroSlide
        nextVideoTitle="${escapeString(outro.nextVideoTitle ?? '')}"${websiteUrl ? `\n        websiteUrl="${escapeString(websiteUrl)}"` : ''}${docsUrl ? `\n        docsUrl="${escapeString(docsUrl)}"` : ''}
      />
      <Audio src={staticFile(\`\${VO}/vo-${pad(voIndex)}.mp3\`)} volume={${volume}} />
    </>
  ));`;
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd packages/cli && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/builder/templates.ts
git commit -m "feat(cli): add code generation templates for all scene types"
```

---

### Task 3: Lock Block Preservation

**Files:**
- Create: `packages/cli/src/builder/lock.ts`
- Create: `packages/cli/tests/builder/lock.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// packages/cli/tests/builder/lock.test.ts
import { describe, it, expect } from 'vitest';
import { preserveLockedBlocks } from '../../src/builder/lock';

describe('preserveLockedBlocks', () => {
  it('preserves locked blocks from existing code', () => {
    const existing = `
  // ── Grid View (9.5s) ──
  // @autoguide-lock
  <HighlightOverlay delay={40} highlights={[{ x: 78, y: 12, width: 8, height: 7, label: 'Custom' }]} />
  // @autoguide-unlock
  rest of code`;

    const generated = `
  // ── Grid View (9.5s) ──
  <HighlightOverlay delay={40} highlights={[{ x: 10, y: 20, width: 30, height: 40 }]} />
  rest of code`;

    const result = preserveLockedBlocks(existing, generated);
    expect(result).toContain("label: 'Custom'");
    expect(result).not.toContain('x: 10');
  });

  it('returns generated code unchanged when no locks exist', () => {
    const existing = 'some old code';
    const generated = 'some new code';
    expect(preserveLockedBlocks(existing, generated)).toBe(generated);
  });

  it('handles multiple locked blocks', () => {
    const existing = `
  // ── Scene A ──
  // @autoguide-lock
  custom block A
  // @autoguide-unlock
  // ── Scene B ──
  // @autoguide-lock
  custom block B
  // @autoguide-unlock`;

    const generated = `
  // ── Scene A ──
  generated A
  // ── Scene B ──
  generated B`;

    const result = preserveLockedBlocks(existing, generated);
    expect(result).toContain('custom block A');
    expect(result).toContain('custom block B');
  });
});
```

- [ ] **Step 2: Run tests to verify fail**

- [ ] **Step 3: Create lock module**

```typescript
// packages/cli/src/builder/lock.ts

interface LockedBlock {
  contextLine: string;
  content: string;
}

export function extractLockedBlocks(code: string): LockedBlock[] {
  const lockRegex = /\/\/ @autoguide-lock\n([\s\S]*?)\/\/ @autoguide-unlock/g;
  const blocks: LockedBlock[] = [];

  let match;
  while ((match = lockRegex.exec(code)) !== null) {
    const beforeLock = code.substring(0, match.index);
    const lastSceneComment = beforeLock.lastIndexOf('// ──');
    const contextLine = lastSceneComment !== -1
      ? beforeLock.substring(lastSceneComment, beforeLock.indexOf('\n', lastSceneComment)).trim()
      : '';

    blocks.push({
      contextLine,
      content: match[1],
    });
  }

  return blocks;
}

export function preserveLockedBlocks(existingCode: string, generatedCode: string): string {
  const blocks = extractLockedBlocks(existingCode);

  if (blocks.length === 0) return generatedCode;

  let result = generatedCode;

  for (const block of blocks) {
    if (!block.contextLine) continue;

    const contextIndex = result.indexOf(block.contextLine);
    if (contextIndex === -1) continue;

    // Find the content after the context line up to the next scene comment or end
    const afterContext = contextIndex + block.contextLine.length;
    const nextSceneComment = result.indexOf('// ──', afterContext + 1);
    const endPos = nextSceneComment !== -1 ? nextSceneComment : result.length;

    // Replace the generated content between context and next scene with locked content
    const beforeContent = result.substring(0, afterContext);
    const afterContent = result.substring(endPos);

    result = beforeContent + '\n  // @autoguide-lock\n' + block.content + '// @autoguide-unlock\n' + afterContent;
  }

  return result;
}
```

- [ ] **Step 4: Run tests**

Run: `cd packages/cli && npx vitest run tests/builder/lock.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/builder/lock.ts packages/cli/tests/builder/lock.test.ts
git commit -m "feat(cli): add lock block preservation for manual code edits"
```

---

### Task 4: Composition Generator

**Files:**
- Create: `packages/cli/src/builder/generator.ts`

- [ ] **Step 1: Create generator**

```typescript
// packages/cli/src/builder/generator.ts
import fs from 'fs';
import path from 'path';
import type { VideoPlan, AutoguideConfig } from '@autoguide/core';
import { calculateTotalFrames } from './duration';
import {
  generateImports,
  generateIntro,
  generateSectionTitle,
  generateScreenshotScene,
  generateOutro,
} from './templates';
import { preserveLockedBlocks } from './lock';

function pascalCase(str: string): string {
  return str
    .replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
}

export function generateVideoComposition(
  plan: VideoPlan,
  config: AutoguideConfig,
): string {
  const componentName = pascalCase(plan.video.id);
  const fps = config.output.fps;
  const overlap = config.defaults.overlap;
  const sectionTitleDur = config.defaults.sectionTitle?.duration ?? 2.5;
  const volume = config.voiceover.volume ?? 0.85;
  const websiteUrl = config.defaults.outro?.websiteUrl;
  const docsUrl = config.defaults.outro?.docsUrl;

  let voIndex = 0;
  const sceneParts: string[] = [];

  // Intro
  sceneParts.push(generateIntro(plan, voIndex++, volume));

  // Sections
  for (const section of plan.sections) {
    sceneParts.push(generateSectionTitle(section, voIndex++, volume));
    for (const scene of section.scenes) {
      sceneParts.push(generateScreenshotScene(scene, voIndex++, volume));
    }
  }

  // Outro
  sceneParts.push(generateOutro(plan, voIndex++, volume, websiteUrl, docsUrl));

  const totalFrames = calculateTotalFrames(plan, fps, overlap, sectionTitleDur);

  return `${generateImports(plan.video.id)}
const FPS = ${fps};
const SEC = FPS;
const OVERLAP = ${overlap};

export const ${componentName}: React.FC = () => {
  const scenes: { from: number; duration: number; el: React.ReactNode }[] = [];
  let cursor = 0;

  const add = (durationSec: number, el: React.ReactNode) => {
    const dur = Math.round(durationSec * SEC);
    scenes.push({ from: cursor, duration: dur, el });
    cursor += dur - OVERLAP;
  };

  const addHard = (durationSec: number, el: React.ReactNode) => {
    const dur = Math.round(durationSec * SEC);
    scenes.push({ from: cursor, duration: dur, el });
    cursor += dur;
  };

  const sectionTitleDur = ${sectionTitleDur};
${sceneParts.join('\n')}

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

// Total: ${totalFrames} frames (${(totalFrames / fps).toFixed(1)}s at ${fps}fps)
export const ${componentName}DurationInFrames = ${totalFrames};
`;
}

export function writeComposition(
  plan: VideoPlan,
  config: AutoguideConfig,
  outputDir: string,
): { filePath: string; totalFrames: number } {
  const code = generateVideoComposition(plan, config);
  const componentName = pascalCase(plan.video.id);
  const videoDir = path.join(outputDir, plan.video.id);
  const filePath = path.join(videoDir, `${componentName}.tsx`);

  fs.mkdirSync(videoDir, { recursive: true });

  // Preserve locked blocks if file exists
  if (fs.existsSync(filePath)) {
    const existingCode = fs.readFileSync(filePath, 'utf-8');
    const preserved = preserveLockedBlocks(existingCode, code);
    fs.writeFileSync(filePath, preserved, 'utf-8');
  } else {
    fs.writeFileSync(filePath, code, 'utf-8');
  }

  const totalFrames = calculateTotalFrames(
    plan,
    config.output.fps,
    config.defaults.overlap,
    config.defaults.sectionTitle?.duration ?? 2.5,
  );

  return { filePath, totalFrames };
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd packages/cli && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/builder/generator.ts
git commit -m "feat(cli): add composition code generator with template system"
```

---

### Task 5: `autoguide build` Command

**Files:**
- Create: `packages/cli/src/commands/build.ts`
- Modify: `packages/cli/src/index.ts` — add build command

- [ ] **Step 1: Create build command**

```typescript
// packages/cli/src/commands/build.ts
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, writePlan, listPlans } from '../plan/parser';
import { writeComposition } from '../builder/generator';

export function createBuildCommand(): Command {
  return new Command('build')
    .description('Generate Remotion compositions from video plans')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Build all video plans')
    .option('--dry-run', 'Preview without writing files')
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

      const srcDir = path.join(paths.src, 'videos');

      for (const id of videoIds) {
        const planPath = paths.planFile(id);
        const plan = readPlan(planPath);

        logger.header(`Building: ${id}`);

        if (opts.dryRun) {
          const { generateVideoComposition } = require('../builder/generator');
          const code = generateVideoComposition(plan, config);
          logger.info(`Would write ${code.length} chars to src/videos/${id}/`);
          continue;
        }

        const { filePath, totalFrames } = writeComposition(plan, config, srcDir);

        const sceneCount = plan.sections.reduce((s, sec) => s + sec.scenes.length, 0);
        const fps = config.output.fps;

        logger.success(`Generated: ${path.relative(root, filePath)}`);
        logger.step('sections', String(plan.sections.length));
        logger.step('scenes', String(sceneCount));
        logger.step('total', `${totalFrames} frames (${(totalFrames / fps).toFixed(1)}s)`);

        // Update plan metadata
        plan.metadata.totalFrames = totalFrames;
        plan.metadata.totalDuration = Math.round((totalFrames / fps) * 10) / 10;
        plan.metadata.lastBuilt = new Date().toISOString();
        writePlan(planPath, plan);
      }

      logger.blank();
      logger.success('Build complete.');
    });
}
```

- [ ] **Step 2: Update CLI entry point**

Add to `packages/cli/src/index.ts`:
```typescript
import { createBuildCommand } from './commands/build';
program.addCommand(createBuildCommand());
```

- [ ] **Step 3: Verify TypeScript + build + CLI help**

Run: `cd packages/cli && npx tsc --noEmit && npx tsup && node dist/index.js build --help`

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/build.ts packages/cli/src/index.ts
git commit -m "feat(cli): add autoguide build command for Remotion composition generation"
```

---

## What's Next

- **Phase 6: Render + Pipeline** — `render`, `go` commands
- **Phase 7: Claude Code Skills**
