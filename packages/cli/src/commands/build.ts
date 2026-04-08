import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, writePlan, listPlans } from '../plan/parser';
import {
  writeComposition,
  generateVideoComposition,
  writeRootTsx,
  writeThemeFile,
} from '../builder/generator';
import { calculateTotalFrames } from '../builder/duration';

export function createBuildCommand(): Command {
  return new Command('build')
    .description('Generate Remotion compositions from video plans')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Build all video plans + Root.tsx + theme')
    .option('--dry-run', 'Preview without writing files')
    .option('--no-root', 'Skip Root.tsx generation')
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

      const srcDir = paths.src;
      const videosDir = path.join(srcDir, 'videos');
      const builtPlans: Array<{ plan: import('@autoguide/core').VideoPlan; totalFrames: number }> = [];

      for (const id of videoIds) {
        const planPath = paths.planFile(id);
        const plan = readPlan(planPath);

        logger.header(`Building: ${id}`);

        if (opts.dryRun) {
          const code = generateVideoComposition(plan, config);
          logger.info(`Would write ${code.length} chars to src/videos/${id}/`);
          continue;
        }

        const { filePath, totalFrames } = writeComposition(plan, config, videosDir);

        const sceneCount = plan.sections.reduce((s, sec) => s + sec.scenes.length, 0);
        const fps = config.output.fps;

        logger.success(`Generated: ${path.relative(root, filePath)}`);
        logger.step('sections', String(plan.sections.length));
        logger.step('scenes', String(sceneCount));
        logger.step('total', `${totalFrames} frames (${(totalFrames / fps).toFixed(1)}s)`);

        plan.metadata.totalFrames = totalFrames;
        plan.metadata.totalDuration = Math.round((totalFrames / fps) * 10) / 10;
        plan.metadata.lastBuilt = new Date().toISOString();
        writePlan(planPath, plan);

        builtPlans.push({ plan, totalFrames });
      }

      // Generate Root.tsx and theme when building all (or single video if no --no-root)
      if (!opts.dryRun && opts.root !== false && builtPlans.length > 0) {
        // Generate theme.ts
        const themePath = writeThemeFile(config, srcDir);
        logger.success(`Generated: ${path.relative(root, themePath)}`);

        // Generate Root.tsx
        const rootPath = writeRootTsx(builtPlans, config, srcDir);
        logger.success(`Generated: ${path.relative(root, rootPath)}`);
      }

      logger.blank();
      logger.success('Build complete.');
    });
}
