import { describe, it, expect } from 'vitest';
import { preserveLockedBlocks } from '../../src/builder/lock';

describe('preserveLockedBlocks', () => {
  it('preserves locked blocks from existing code', () => {
    const existing = `
  // ── Grid View (9.5s) ──
  // @autoguide-lock
  <HighlightOverlay delay={40} highlights={[{ x: 78, y: 12, width: 8, height: 7, label: 'Custom' }]} />
  // @autoguide-unlock
  rest of code`;

    const generated = `
  // ── Grid View (9.5s) ──
  <HighlightOverlay delay={40} highlights={[{ x: 10, y: 20, width: 30, height: 40 }]} />
  rest of code`;

    const result = preserveLockedBlocks(existing, generated);
    expect(result).toContain("label: 'Custom'");
    expect(result).not.toContain('x: 10');
  });

  it('returns generated code unchanged when no locks exist', () => {
    const existing = 'some old code';
    const generated = 'some new code';
    expect(preserveLockedBlocks(existing, generated)).toBe(generated);
  });

  it('handles multiple locked blocks', () => {
    const existing = `
  // ── Scene A ──
  // @autoguide-lock
  custom block A
  // @autoguide-unlock
  // ── Scene B ──
  // @autoguide-lock
  custom block B
  // @autoguide-unlock`;

    const generated = `
  // ── Scene A ──
  generated A
  // ── Scene B ──
  generated B`;

    const result = preserveLockedBlocks(existing, generated);
    expect(result).toContain('custom block A');
    expect(result).toContain('custom block B');
  });
});
