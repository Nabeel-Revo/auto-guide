import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, writePlan, listPlans } from '../plan/parser';

export function createRenderCommand(): Command {
  return new Command('render')
    .description('Render final MP4 videos using Remotion')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Render all individual videos')
    .option('--output <path>', 'Custom output file path')
    .option('--quality <crf>', 'CRF quality (lower = better)', '18')
    .option('--concurrency <n>', 'Remotion render concurrency')
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

      const outputDir = path.resolve(root, config.output.directory);
      fs.mkdirSync(outputDir, { recursive: true });

      for (const id of videoIds) {
        const planPath = paths.planFile(id);
        const plan = readPlan(planPath);

        const outputPath = opts.output
          ? path.resolve(opts.output)
          : path.join(outputDir, `${id}.${config.output.format}`);

        logger.header(`Rendering: ${id}`);

        if (plan.metadata.totalFrames) {
          logger.step('composition', `${id} (${plan.metadata.totalFrames} frames, ${plan.metadata.totalDuration}s)`);
        }
        logger.step('output', outputPath);

        const args = [
          'npx', 'remotion', 'render',
          id,
          outputPath,
          '--codec', config.output.codec ?? 'h264',
          '--crf', opts.quality,
        ];

        if (opts.concurrency) {
          args.push('--concurrency', opts.concurrency);
        }

        try {
          execSync(args.join(' '), {
            cwd: root,
            stdio: 'inherit',
          });

          const stats = fs.statSync(outputPath);
          const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);

          logger.success(`Rendered: ${outputPath} (${sizeMb} MB)`);

          plan.metadata.lastRendered = new Date().toISOString();
          writePlan(planPath, plan);
        } catch (err) {
          logger.error(`Render failed for ${id}`);
          if (err instanceof Error) logger.error(err.message);
        }
      }

      logger.blank();
      logger.success(`Render complete. Files in: ${outputDir}`);
    });
}
