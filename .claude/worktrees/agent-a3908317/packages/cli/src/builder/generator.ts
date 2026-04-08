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
  return str.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
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

  sceneParts.push(generateIntro(plan, voIndex++, volume));

  for (const section of plan.sections) {
    sceneParts.push(generateSectionTitle(section, voIndex++, volume));
    for (const scene of section.scenes) {
      sceneParts.push(generateScreenshotScene(scene, voIndex++, volume));
    }
  }

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
