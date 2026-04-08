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
