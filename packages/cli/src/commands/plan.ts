import fs from 'fs';
import { Command } from 'commander';
import type { VideoPlan } from '@autoguide/core';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { readPlan, writePlan } from '../plan/parser';

function createScaffoldPlan(videoId: string): VideoPlan {
  const videoNumber = parseInt(videoId.match(/^(\d+)/)?.[1] ?? '1', 10);
  const title = videoId
    .replace(/^\d+-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    video: {
      id: videoId,
      title,
      module: 'Untitled Module',
      videoNumber,
    },
    intro: {
      title,
      subtitle: '',
      duration: 7,
      voiceover: { script: `${title}.`, file: null, duration: null },
    },
    sections: [
      {
        id: 'section-1',
        title: 'Section 1',
        step: '01',
        voiceover: { script: 'Section one.', file: null, duration: null },
        scenes: [
          {
            id: 'scene-1',
            type: 'screenshot',
            capture: { mode: 'auto', route: '/', actions: [] },
            screenshot: null,
            duration: 8,
            highlights: [],
            voiceover: { script: 'Describe this scene.', file: null, duration: null },
          },
        ],
      },
    ],
    outro: {
      duration: 5,
      voiceover: { script: 'That covers the basics.', file: null, duration: null },
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
}

export function createPlanCommand(): Command {
  return new Command('plan')
    .description('Create or update a video plan')
    .argument('<video-id>', 'Video identifier (e.g., 01-project-overview)')
    .option('--module <name>', 'Pre-fill module name')
    .option('--edit', 'Open plan in $EDITOR after generation')
    .action(async (videoId: string, opts) => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      const paths = resolveProjectPaths(root);
      const planPath = paths.planFile(videoId);

      if (fs.existsSync(planPath)) {
        const plan = readPlan(planPath);
        const sceneCount = plan.sections.reduce((s, sec) => s + sec.scenes.length, 0);
        logger.info(`Plan exists: ${videoId}`);
        logger.step('sections', String(plan.sections.length));
        logger.step('scenes', String(sceneCount));
        logger.step('path', planPath);

        if (opts.edit) {
          const editor = process.env.EDITOR || 'code';
          const { execSync } = require('child_process');
          execSync(`${editor} "${planPath}"`, { stdio: 'inherit' });
        }
        return;
      }

      const plan = createScaffoldPlan(videoId);
      if (opts.module) {
        plan.video.module = opts.module;
      }

      writePlan(planPath, plan);

      const sceneCount = plan.sections.reduce((s, sec) => s + sec.scenes.length, 0);
      const autoCount = plan.sections.reduce(
        (s, sec) => s + sec.scenes.filter((sc) => sc.capture.mode === 'auto').length,
        0,
      );
      const manualCount = sceneCount - autoCount;

      logger.success(`Plan written: ${planPath}`);
      logger.step('sections', String(plan.sections.length));
      logger.step('scenes', `${sceneCount} (${autoCount} auto, ${manualCount} manual)`);

      logger.blank();
      logger.info(`Next: autoguide capture ${videoId}`);

      if (opts.edit) {
        const editor = process.env.EDITOR || 'code';
        const { execSync } = require('child_process');
        execSync(`${editor} "${planPath}"`, { stdio: 'inherit' });
      }
    });
}
