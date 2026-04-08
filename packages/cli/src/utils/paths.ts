import path from 'path';
import fs from 'fs';

export interface ProjectPaths {
  root: string;
  config: string;
  plans: string;
  screenshots: string;
  voiceover: string;
  output: string;
  src: string;
  planFile: (videoId: string) => string;
  screenshotDir: (videoId: string) => string;
  voiceoverDir: (videoId: string) => string;
}

export function resolveProjectPaths(root: string): ProjectPaths {
  return {
    root,
    config: path.join(root, 'autoguide.config.yaml'),
    plans: path.join(root, 'plans'),
    screenshots: path.join(root, 'public', 'screenshots'),
    voiceover: path.join(root, 'public', 'voiceover'),
    output: path.join(root, 'output'),
    src: path.join(root, 'src'),
    planFile: (videoId: string) => path.join(root, 'plans', `${videoId}.yaml`),
    screenshotDir: (videoId: string) => path.join(root, 'public', 'screenshots', videoId),
    voiceoverDir: (videoId: string) => path.join(root, 'public', 'voiceover', videoId),
  };
}

export function findProjectRoot(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  while (true) {
    const configPath = path.join(dir, 'autoguide.config.yaml');
    if (fs.existsSync(configPath)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
