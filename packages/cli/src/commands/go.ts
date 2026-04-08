import { execSync } from 'child_process';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { findProjectRoot } from '../utils/paths';

const STAGES = ['capture', 'voiceover', 'build', 'render'] as const;

export function createGoCommand(): Command {
  return new Command('go')
    .description('Run full pipeline (capture > voiceover > build > render)')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Run for all video plans')
    .option('--skip-capture', 'Skip screenshot capture stage')
    .option('--skip-voiceover', 'Skip voiceover generation stage')
    .option('--skip-render', 'Skip final render')
    .option('--from <stage>', 'Start from a specific stage (capture|voiceover|build|render)')
    .action(async (videoId: string | undefined, opts) => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      if (!videoId && !opts.all) {
        logger.error('Provide a video-id or use --all');
        process.exit(1);
      }

      const target = opts.all ? '--all' : videoId!;

      let startIndex = 0;
      if (opts.from) {
        const idx = STAGES.indexOf(opts.from);
        if (idx === -1) {
          logger.error(`Unknown stage: ${opts.from}. Use: ${STAGES.join(', ')}`);
          process.exit(1);
        }
        startIndex = idx;
      }

      const skips = new Set<string>();
      if (opts.skipCapture) skips.add('capture');
      if (opts.skipVoiceover) skips.add('voiceover');
      if (opts.skipRender) skips.add('render');

      logger.header(`Autoguide Pipeline: ${target}`);

      for (let i = startIndex; i < STAGES.length; i++) {
        const stage = STAGES[i];

        if (skips.has(stage)) {
          logger.step('skip', stage);
          continue;
        }

        logger.blank();
        logger.info(`Stage: ${stage}`);

        const cmd = opts.all
          ? `npx autoguide ${stage} --all`
          : `npx autoguide ${stage} ${target}`;

        try {
          execSync(cmd, {
            cwd: root,
            stdio: 'inherit',
          });
        } catch (err) {
          logger.error(`Stage "${stage}" failed.`);
          if (err instanceof Error) logger.error(err.message);
          logger.info('Fix the issue and resume with: autoguide go ' + target + ' --from ' + stage);
          process.exit(1);
        }
      }

      logger.blank();
      logger.success('Pipeline complete!');
    });
}
