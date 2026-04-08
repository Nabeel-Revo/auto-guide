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
