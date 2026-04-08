import { describe, it, expect } from 'vitest';
import path from 'path';
import { resolveProjectPaths } from '../../src/utils/paths';

describe('resolveProjectPaths', () => {
  it('resolves all standard paths from a root', () => {
    const root = '/project';
    const paths = resolveProjectPaths(root);

    expect(paths.root).toBe('/project');
    expect(paths.config).toBe(path.join('/project', 'autoguide.config.yaml'));
    expect(paths.plans).toBe(path.join('/project', 'plans'));
    expect(paths.screenshots).toBe(path.join('/project', 'public', 'screenshots'));
    expect(paths.voiceover).toBe(path.join('/project', 'public', 'voiceover'));
    expect(paths.output).toBe(path.join('/project', 'output'));
    expect(paths.src).toBe(path.join('/project', 'src'));
  });

  it('resolves plan file path', () => {
    const root = '/project';
    const paths = resolveProjectPaths(root);
    expect(paths.planFile('01-overview')).toBe(
      path.join('/project', 'plans', '01-overview.yaml')
    );
  });

  it('resolves screenshot dir for a video', () => {
    const root = '/project';
    const paths = resolveProjectPaths(root);
    expect(paths.screenshotDir('01-overview')).toBe(
      path.join('/project', 'public', 'screenshots', '01-overview')
    );
  });

  it('resolves voiceover dir for a video', () => {
    const root = '/project';
    const paths = resolveProjectPaths(root);
    expect(paths.voiceoverDir('01-overview')).toBe(
      path.join('/project', 'public', 'voiceover', '01-overview')
    );
  });
});
