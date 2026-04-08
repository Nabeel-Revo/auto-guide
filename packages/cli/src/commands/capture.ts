import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { Command } from 'commander';
import type { Scene, VideoPlan, AutoCapture, ManualCapture } from '@autoguide/core';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, writePlan, listPlans } from '../plan/parser';
import { CaptureEngine } from '../playwright/engine';

interface CaptureStats {
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{ sceneId: string; error: string }>;
}

async function captureVideo(
  videoId: string,
  plan: VideoPlan,
  engine: CaptureEngine | null,
  screenshotDir: string,
  planPath: string,
  opts: { autoOnly?: boolean; manualOnly?: boolean; retake?: string },
): Promise<CaptureStats> {
  const stats: CaptureStats = { succeeded: 0, failed: 0, skipped: 0, errors: [] };

  const allScenes: { scene: Scene; sectionId: string }[] = [];
  for (const section of plan.sections) {
    for (const scene of section.scenes) {
      allScenes.push({ scene, sectionId: section.id });
    }
  }

  logger.header(`Capturing: ${videoId} (${allScenes.length} scenes)`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  for (const { scene } of allScenes) {
    if (opts.retake && scene.id !== opts.retake) {
      stats.skipped++;
      continue;
    }

    const isAuto = scene.capture.mode === 'auto';
    const modeLabel = isAuto ? 'auto' : 'manual';

    if (opts.autoOnly && !isAuto) {
      stats.skipped++;
      continue;
    }
    if (opts.manualOnly && isAuto) {
      stats.skipped++;
      continue;
    }

    const outputPath = path.join(screenshotDir, `${scene.id}.png`);

    if (isAuto && engine) {
      try {
        await engine.captureAutoScene(scene.capture as AutoCapture, outputPath);
        scene.screenshot = `public/screenshots/${videoId}/${scene.id}.png`;
        stats.succeeded++;
        logger.step(modeLabel, `${scene.id} ${'·'.repeat(Math.max(1, 30 - scene.id.length))} saved`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        stats.failed++;
        stats.errors.push({ sceneId: scene.id, error: errorMsg });
        logger.step(modeLabel, `${scene.id} ${'·'.repeat(Math.max(1, 30 - scene.id.length))} FAILED`);
        logger.error(`  ${errorMsg}`);
      }
    } else if (!isAuto) {
      const manualCapture = scene.capture as ManualCapture;
      logger.step(modeLabel, `${scene.id} ${'·'.repeat(Math.max(1, 30 - scene.id.length))} waiting`);
      logger.info(`  → ${manualCapture.instructions}`);
      logger.info(`  → Save to: ${outputPath}`);

      await rl.question('  Press Enter when screenshot is saved...');

      if (fs.existsSync(outputPath)) {
        scene.screenshot = `public/screenshots/${videoId}/${scene.id}.png`;
        stats.succeeded++;
        logger.success('  saved');
      } else {
        stats.failed++;
        stats.errors.push({ sceneId: scene.id, error: `File not found: ${outputPath}` });
        logger.error(`  Screenshot not found at ${outputPath}`);
      }
    }
  }

  rl.close();

  plan.metadata.screenshotsCaptured = plan.sections.reduce(
    (count, sec) => count + sec.scenes.filter((s) => s.screenshot !== null).length,
    0,
  );

  writePlan(planPath, plan);

  return stats;
}

export function createCaptureCommand(): Command {
  return new Command('capture')
    .description('Capture screenshots for a video plan')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Capture for all plans')
    .option('--auto-only', 'Only run auto-capture scenes')
    .option('--manual-only', 'Only prompt for manual captures')
    .option('--headed', 'Run browser in headed mode')
    .option('--retake <scene-id>', 'Re-capture a specific scene')
    .option('--timeout <ms>', 'Page load timeout in ms', '30000')
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
          logger.error('No plans found. Run "autoguide plan <video-id>" first.');
          process.exit(1);
        }
      } else if (videoId) {
        videoIds = [videoId];
      } else {
        logger.error('Provide a video-id or use --all');
        process.exit(1);
      }

      let engine: CaptureEngine | null = null;

      if (!opts.manualOnly) {
        engine = new CaptureEngine({
          viewport: config.capture.viewport,
          headless: !opts.headed,
          baseUrl: config.project.url,
          timeout: parseInt(opts.timeout, 10),
        });

        await engine.init();

        if (config.capture.auth && config.capture.auth.strategy !== 'none') {
          await engine.authenticateWith(config.capture.auth);
        }
      }

      let totalSucceeded = 0;
      let totalFailed = 0;
      const allErrors: Array<{ sceneId: string; error: string }> = [];

      for (const id of videoIds) {
        const planPath = paths.planFile(id);
        const plan = readPlan(planPath);
        const screenshotDir = paths.screenshotDir(id);

        const stats = await captureVideo(id, plan, engine, screenshotDir, planPath, {
          autoOnly: opts.autoOnly,
          manualOnly: opts.manualOnly,
          retake: opts.retake,
        });

        totalSucceeded += stats.succeeded;
        totalFailed += stats.failed;
        allErrors.push(...stats.errors);
      }

      if (engine) {
        await engine.close();
      }

      logger.blank();
      logger.info(`Capture complete: ${totalSucceeded} succeeded, ${totalFailed} failed`);

      if (allErrors.length > 0) {
        const errorLog = path.join(root, '.autoguide', 'capture-errors.log');
        fs.mkdirSync(path.dirname(errorLog), { recursive: true });
        fs.writeFileSync(
          errorLog,
          allErrors.map((e) => `${e.sceneId}: ${e.error}`).join('\n'),
          'utf-8',
        );
        logger.info(`Failed scenes logged to: ${errorLog}`);
      }
    });
}
