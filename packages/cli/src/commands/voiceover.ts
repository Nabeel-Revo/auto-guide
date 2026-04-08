import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import type { VideoPlan, VoiceoverEntry } from '@autoguide/core';
import { logger } from '../utils/logger';
import { resolveProjectPaths, findProjectRoot } from '../utils/paths';
import { loadConfig } from '../utils/config';
import { readPlan, writePlan, listPlans } from '../plan/parser';
import { ElevenLabsProvider } from '../elevenlabs/client';
import type { VoiceConfig } from '../elevenlabs/types';
import { getMp3Duration } from '../elevenlabs/duration';

interface VoiceoverClip {
  index: number;
  label: string;
  script: string;
  entry: VoiceoverEntry;
}

function extractClips(plan: VideoPlan): VoiceoverClip[] {
  const clips: VoiceoverClip[] = [];
  let index = 0;

  clips.push({ index: index++, label: 'intro', script: plan.intro.voiceover.script, entry: plan.intro.voiceover });

  for (const section of plan.sections) {
    clips.push({ index: index++, label: `section-${section.id}`, script: section.voiceover.script, entry: section.voiceover });
    for (const scene of section.scenes) {
      clips.push({ index: index++, label: scene.id, script: scene.voiceover.script, entry: scene.voiceover });
    }
  }

  clips.push({ index: index++, label: 'outro', script: plan.outro.voiceover.script, entry: plan.outro.voiceover });

  return clips;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

async function generateVoiceovers(
  videoId: string,
  plan: VideoPlan,
  provider: ElevenLabsProvider,
  voiceConfig: VoiceConfig,
  voiceoverDir: string,
  planPath: string,
  opts: { force?: boolean; scene?: string; dryRun?: boolean },
  buffer: number,
): Promise<void> {
  const clips = extractClips(plan);

  const targetClips = opts.scene
    ? clips.filter((c) => c.label === opts.scene)
    : clips;

  if (targetClips.length === 0) {
    logger.warn(`No clips found${opts.scene ? ` matching scene "${opts.scene}"` : ''}`);
    return;
  }

  const estimate = provider.estimateCost(targetClips.map((c) => c.script));
  logger.info(`Estimated: ${targetClips.length} clips, ${estimate.characters} characters, ~$${estimate.estimatedCost.toFixed(2)}`);

  if (opts.dryRun) {
    logger.blank();
    const headers = ['Clip', 'Script', 'Est.'];
    const rows = targetClips.map((c) => [
      `vo-${pad(c.index)} ${c.label}`,
      c.script.length > 50 ? c.script.substring(0, 47) + '...' : c.script,
      `~${Math.ceil(c.script.length / 15)}s`,
    ]);
    logger.table(headers, rows);
    return;
  }

  logger.blank();
  fs.mkdirSync(voiceoverDir, { recursive: true });

  const durationAdjustments: Array<{ label: string; from: number; to: number }> = [];

  for (const clip of targetClips) {
    const fileName = `vo-${pad(clip.index)}.mp3`;
    const filePath = path.join(voiceoverDir, fileName);
    const relPath = `public/voiceover/${videoId}/${fileName}`;

    if (!opts.force && clip.entry.file && fs.existsSync(filePath)) {
      logger.step('skip', `${fileName} (already exists)`);
      continue;
    }

    try {
      const audioBuffer = await provider.generateSpeech(clip.script, voiceConfig);
      fs.writeFileSync(filePath, audioBuffer);

      const duration = await getMp3Duration(filePath);
      const roundedDuration = Math.round(duration * 100) / 100;

      clip.entry.file = relPath;
      clip.entry.duration = roundedDuration;

      logger.step('saved', `vo-${pad(clip.index)} ${clip.label} ${'·'.repeat(Math.max(1, 20 - clip.label.length))} ${roundedDuration}s`);

      const voDurationWithBuffer = roundedDuration + buffer;

      if (clip.label === 'intro' && plan.intro.duration < voDurationWithBuffer) {
        const oldDur = plan.intro.duration;
        plan.intro.duration = Math.round(voDurationWithBuffer * 10) / 10;
        durationAdjustments.push({ label: 'intro', from: oldDur, to: plan.intro.duration });
      } else if (clip.label === 'outro' && plan.outro.duration < voDurationWithBuffer) {
        const oldDur = plan.outro.duration;
        plan.outro.duration = Math.round(voDurationWithBuffer * 10) / 10;
        durationAdjustments.push({ label: 'outro', from: oldDur, to: plan.outro.duration });
      } else {
        for (const section of plan.sections) {
          for (const scene of section.scenes) {
            if (scene.id === clip.label && scene.duration < voDurationWithBuffer) {
              const oldDur = scene.duration;
              scene.duration = Math.round(voDurationWithBuffer * 10) / 10;
              durationAdjustments.push({ label: scene.id, from: oldDur, to: scene.duration });
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`  vo-${pad(clip.index)} ${clip.label}: ${msg}`);
    }
  }

  if (durationAdjustments.length > 0) {
    logger.blank();
    logger.info('Duration adjustments:');
    for (const adj of durationAdjustments) {
      logger.step(adj.label, `${adj.from}s → ${adj.to}s`);
    }
  }

  plan.metadata.voiceoverGenerated = extractClips(plan).filter((c) => c.entry.file !== null).length;

  writePlan(planPath, plan);
  logger.blank();
  logger.success(`Plan updated: ${planPath}`);
}

export function createVoiceoverCommand(): Command {
  return new Command('voiceover')
    .description('Generate voiceover audio from plan scripts')
    .argument('[video-id]', 'Video identifier')
    .option('--all', 'Generate for all plans')
    .option('--dry-run', 'Show scripts and cost estimate without generating')
    .option('--force', 'Regenerate all clips even if files exist')
    .option('--scene <scene-id>', 'Regenerate a specific scene')
    .option('--voice <voice-id>', 'Override voice ID')
    .action(async (videoId: string | undefined, opts) => {
      const root = findProjectRoot();
      if (!root) {
        logger.error('No autoguide.config.yaml found. Run "autoguide init" first.');
        process.exit(1);
      }

      const paths = resolveProjectPaths(root);
      const config = loadConfig(paths.config);

      if (config.voiceover.provider === 'none' && !opts.dryRun) {
        logger.error('No voiceover provider configured. Update autoguide.config.yaml.');
        process.exit(1);
      }

      let videoIds: string[];
      if (opts.all) {
        videoIds = listPlans(paths.plans);
      } else if (videoId) {
        videoIds = [videoId];
      } else {
        logger.error('Provide a video-id or use --all');
        process.exit(1);
      }

      const provider = new ElevenLabsProvider(config.voiceover.apiKey);
      const voiceConfig: VoiceConfig = {
        voiceId: opts.voice || config.voiceover.voiceId || '',
        model: config.voiceover.model || 'eleven_multilingual_v2',
        settings: config.voiceover.settings || { stability: 0.5, similarity_boost: 0.75, speed: 1.0 },
      };
      const buffer = config.voiceover.buffer ?? 0.8;

      for (const id of videoIds) {
        const planPath = paths.planFile(id);
        const plan = readPlan(planPath);
        const voiceoverDir = paths.voiceoverDir(id);

        logger.header(`Voiceover: ${id}`);

        await generateVoiceovers(id, plan, provider, voiceConfig, voiceoverDir, planPath, {
          force: opts.force,
          scene: opts.scene,
          dryRun: opts.dryRun,
        }, buffer);
      }
    });
}
