import { describe, it, expect } from 'vitest';
import { resolveEnvVars, configSchema } from '../../src/utils/config';

describe('resolveEnvVars', () => {
  it('replaces ${VAR} with env value', () => {
    const env = { MY_KEY: 'secret123' };
    expect(resolveEnvVars('${MY_KEY}', env)).toBe('secret123');
  });

  it('replaces multiple vars in same string', () => {
    const env = { HOST: 'localhost', PORT: '3000' };
    expect(resolveEnvVars('${HOST}:${PORT}', env)).toBe('localhost:3000');
  });

  it('leaves non-var strings unchanged', () => {
    expect(resolveEnvVars('plain text', {})).toBe('plain text');
  });

  it('leaves unresolved vars as-is', () => {
    expect(resolveEnvVars('${MISSING}', {})).toBe('${MISSING}');
  });
});

describe('configSchema', () => {
  it('validates a minimal valid config', () => {
    const config = {
      project: { name: 'Test', url: 'http://localhost:3000' },
      branding: { theme: 'dark' },
      voiceover: { provider: 'none', apiKey: '', mode: 'auto' },
      capture: { viewport: { width: 1920, height: 1080 }, delay: 1000 },
      output: { fps: 30, resolution: { width: 1920, height: 1080 }, format: 'mp4', directory: './output' },
      defaults: { overlap: 10 },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('rejects config missing required project.name', () => {
    const config = {
      project: { url: 'http://localhost:3000' },
      branding: { theme: 'dark' },
      voiceover: { provider: 'none', apiKey: '', mode: 'auto' },
      capture: { viewport: { width: 1920, height: 1080 }, delay: 1000 },
      output: { fps: 30, resolution: { width: 1920, height: 1080 }, format: 'mp4', directory: './output' },
      defaults: { overlap: 10 },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('rejects invalid voiceover provider', () => {
    const config = {
      project: { name: 'Test', url: 'http://localhost:3000' },
      branding: { theme: 'dark' },
      voiceover: { provider: 'invalid', apiKey: '', mode: 'auto' },
      capture: { viewport: { width: 1920, height: 1080 }, delay: 1000 },
      output: { fps: 30, resolution: { width: 1920, height: 1080 }, format: 'mp4', directory: './output' },
      defaults: { overlap: 10 },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});
