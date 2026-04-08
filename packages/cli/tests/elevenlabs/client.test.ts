import { describe, it, expect } from 'vitest';
import { ElevenLabsProvider } from '../../src/elevenlabs/client';

describe('ElevenLabsProvider', () => {
  it('estimates cost correctly', () => {
    const provider = new ElevenLabsProvider('fake-key');
    const result = provider.estimateCost([
      'Hello world',
      'This is a test',
    ]);
    expect(result.characters).toBe(25);
    expect(result.estimatedCost).toBeCloseTo(0.0075, 4);
  });

  it('estimates zero cost for empty texts', () => {
    const provider = new ElevenLabsProvider('fake-key');
    const result = provider.estimateCost([]);
    expect(result.characters).toBe(0);
    expect(result.estimatedCost).toBe(0);
  });
});
