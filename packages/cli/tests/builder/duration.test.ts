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
    expect(calculateTotalFrames(plan, 30, 10, 2.5)).toBe(300);
  });

  it('calculates frames with one section and one scene', () => {
    const plan = makePlan(5, 5, [[8]]);
    expect(calculateTotalFrames(plan, 30, 10, 2.5)).toBe(605);
  });

  it('calculates frames with multiple scenes (overlap)', () => {
    const plan = makePlan(5, 5, [[8, 6]]);
    expect(calculateTotalFrames(plan, 30, 10, 2.5)).toBe(775);
  });
});
