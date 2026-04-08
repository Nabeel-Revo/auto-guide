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

export function generateRootTsx(
  plans: Array<{ plan: VideoPlan; totalFrames: number }>,
  config: AutoguideConfig,
): string {
  const fps = config.output.fps;
  const fontFamily = config.branding.fonts?.heading ?? 'Inter Tight';
  // Convert "Inter Tight" to "InterTight" for import path
  const fontImport = fontFamily.replace(/\s+/g, '');

  const imports = plans.map(({ plan }) => {
    const name = pascalCase(plan.video.id);
    return `import { ${name} } from './videos/${plan.video.id}/${name}';`;
  }).join('\n');

  const compositions = plans.map(({ plan, totalFrames }) => {
    const name = pascalCase(plan.video.id);
    return `      <Composition
        id="${plan.video.id}"
        component={${name}}
        durationInFrames={${totalFrames}}
        fps={${fps}}
        width={${config.output.resolution.width}}
        height={${config.output.resolution.height}}
      />`;
  }).join('\n');

  return `import React from 'react';
import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/${fontImport}';
${imports}

loadFont('normal', { weights: ['400', '500', '600', '700', '800'] });

const FPS = ${fps};

export const RemotionRoot: React.FC = () => {
  return (
    <>
${compositions}
    </>
  );
};
`;
}

export function writeRootTsx(
  plans: Array<{ plan: VideoPlan; totalFrames: number }>,
  config: AutoguideConfig,
  srcDir: string,
): string {
  const code = generateRootTsx(plans, config);
  const filePath = path.join(srcDir, 'Root.tsx');
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(filePath, code, 'utf-8');
  return filePath;
}

export function generateThemeFile(config: AutoguideConfig): string {
  const themeName = typeof config.branding.theme === 'string'
    ? config.branding.theme
    : config.branding.theme.preset ?? 'dark';

  if (typeof config.branding.theme === 'string') {
    return `import { createTheme } from '@autoguide/core';

export const theme = createTheme('${themeName}');
`;
  }

  // Custom overrides
  const overrides = JSON.stringify(config.branding.theme, null, 2);
  return `import { createTheme } from '@autoguide/core';

export const theme = createTheme(${overrides});
`;
}

export function writeThemeFile(config: AutoguideConfig, srcDir: string): string {
  const code = generateThemeFile(config);
  const stylesDir = path.join(srcDir, 'styles');
  const filePath = path.join(stylesDir, 'theme.ts');
  fs.mkdirSync(stylesDir, { recursive: true });
  fs.writeFileSync(filePath, code, 'utf-8');
  return filePath;
}
