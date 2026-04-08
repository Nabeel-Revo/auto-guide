// packages/cli/src/builder/duration.ts
import type { VideoPlan } from '@autoguide/core';

export function calculateTotalFrames(
  plan: VideoPlan,
  fps: number,
  overlap: number,
  sectionTitleDuration: number,
): number {
  let cursor = 0;
  cursor += Math.round(plan.intro.duration * fps);
  for (const section of plan.sections) {
    cursor += Math.round(sectionTitleDuration * fps);
    for (const scene of section.scenes) {
      const dur = Math.round(scene.duration * fps);
      cursor += dur - overlap;
    }
  }
  cursor += Math.round(plan.outro.duration * fps);
  return cursor;
}
