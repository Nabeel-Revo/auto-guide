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
