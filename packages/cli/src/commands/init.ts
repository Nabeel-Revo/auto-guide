import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Command } from 'commander';
import type { AutoguideConfig } from '@autoguide/core';
import { logger } from '../utils/logger';

const DEFAULT_CONFIG: AutoguideConfig = {
  project: {
    name: 'My Project',
    url: 'http://localhost:3000',
  },
  branding: {
    theme: 'dark',
  },
  voiceover: {
    provider: 'none',
    apiKey: '',
    mode: 'auto',
  },
  capture: {
    viewport: { width: 1920, height: 1080 },
    delay: 1000,
  },
  output: {
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    format: 'mp4',
    directory: './output',
  },
  defaults: {
    overlap: 10,
    intro: { duration: 4 },
    outro: { duration: 5 },
    sectionTitle: { duration: 2.5 },
    callout: { size: 'md' },
  },
};

export function createInitCommand(): Command {
  return new Command('init')
    .description('Initialize Autoguide in the current project')
    .option('--template <name>', 'Theme template (dark|light|minimal)', 'dark')
    .option('--no-voiceover', 'Skip voiceover configuration')
    .option('--yes', 'Accept all defaults (non-interactive)')
    .action(async (opts) => {
      const cwd = process.cwd();
      const configPath = path.join(cwd, 'autoguide.config.yaml');

      if (fs.existsSync(configPath)) {
        logger.warn('autoguide.config.yaml already exists. Use --force to overwrite.');
        return;
      }

      const config = { ...DEFAULT_CONFIG };
      config.branding.theme = opts.template as 'dark' | 'light' | 'minimal';

      if (opts.voiceover === false) {
        config.voiceover.provider = 'none';
      }

      const configContent = yaml.dump(config, {
        lineWidth: 120,
        noRefs: true,
        sortKeys: false,
      });
      fs.writeFileSync(configPath, configContent, 'utf-8');
      logger.success('Created autoguide.config.yaml');

      const dirs = [
        'plans',
        path.join('public', 'screenshots'),
        path.join('public', 'voiceover'),
        'output',
      ];

      for (const dir of dirs) {
        const fullPath = path.join(cwd, dir);
        fs.mkdirSync(fullPath, { recursive: true });
        logger.success(`Created ${dir}/`);
      }

      logger.blank();
      logger.info("Run 'autoguide plan <video-id>' to create your first video plan.");
    });
}
