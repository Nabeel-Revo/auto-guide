import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { readPlan, writePlan } from '../../src/plan/parser';

describe('plan parser', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autoguide-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes and reads a plan round-trip', () => {
    const plan = {
      video: { id: '01-test', title: 'Test', module: 'Mod', videoNumber: 1 },
      intro: {
        title: 'Test',
        duration: 5,
        voiceover: { script: 'Hi.', file: null, duration: null },
      },
      sections: [],
      outro: {
        duration: 5,
        voiceover: { script: 'Bye.', file: null, duration: null },
      },
      metadata: {
        totalDuration: null,
        totalFrames: null,
        screenshotsCaptured: 0,
        screenshotsTotal: 0,
        voiceoverGenerated: 0,
        voiceoverTotal: 2,
        lastBuilt: null,
        lastRendered: null,
      },
    };

    const filePath = path.join(tmpDir, 'test.yaml');
    writePlan(filePath, plan);

    expect(fs.existsSync(filePath)).toBe(true);

    const loaded = readPlan(filePath);
    expect(loaded.video.id).toBe('01-test');
    expect(loaded.intro.title).toBe('Test');
    expect(loaded.sections).toEqual([]);
    expect(loaded.metadata.screenshotsTotal).toBe(0);
  });

  it('throws on invalid plan file', () => {
    const filePath = path.join(tmpDir, 'bad.yaml');
    fs.writeFileSync(filePath, 'video:\n  title: Missing fields\n');
    expect(() => readPlan(filePath)).toThrow();
  });

  it('throws on missing file', () => {
    expect(() => readPlan(path.join(tmpDir, 'nope.yaml'))).toThrow();
  });
});
