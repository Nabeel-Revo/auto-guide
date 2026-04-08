import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, listPlans } from '../plan/parser';

function statusCell(current: number, total: number): string {
  if (total === 0) return '--';
  if (current === total) return 'OK';
  return `${current}/${total}`;
}

export function createStatusCommand(): Command {
  return new Command('status')
    .description('Show pipeline status for all videos')
    .action(async () => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      const paths = resolveProjectPaths(root);
      const config = loadConfig(paths.config);

      logger.header(`Autoguide Status — ${config.project.name}`);

      const planIds = listPlans(paths.plans);

      if (planIds.length === 0) {
        logger.info('No video plans found. Run "autoguide plan <video-id>" to get started.');
        return;
      }

      const headers = ['Video', 'Plan', 'Capture', 'Voiceover', 'Build', 'Render'];
      const rows: string[][] = [];

      for (const id of planIds) {
        try {
          const plan = readPlan(paths.planFile(id));
          const meta = plan.metadata;

          const captureStatus = statusCell(meta.screenshotsCaptured, meta.screenshotsTotal);
          const voStatus = statusCell(meta.voiceoverGenerated, meta.voiceoverTotal);
          const buildStatus = meta.lastBuilt ? 'OK' : '--';
          const renderStatus = meta.lastRendered ? 'OK' : '--';

          rows.push([id, 'OK', captureStatus, voStatus, buildStatus, renderStatus]);
        } catch {
          rows.push([id, 'ERR', '--', '--', '--', '--']);
        }
      }

      logger.table(headers, rows);
      logger.blank();
      logger.info('Legend: OK = complete, N/M = progress, -- = not started');
    });
}
