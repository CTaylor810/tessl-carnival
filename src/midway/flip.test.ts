import { describe, expect, it } from 'vitest';
import { createFlip, FLIP_SECONDS, flipScale, isFlipping, stepFlip, tryStartFlip } from './flip';

describe('the flip', () => {
  it('starts right side up and still', () => {
    const flip = createFlip();
    expect(flip.world).toBe('right-side-up');
    expect(isFlipping(flip)).toBe(false);
    expect(flipScale(flip)).toBe(1);
  });

  it('squashes the view to nothing, switches world halfway, then opens back out', () => {
    const flip = createFlip();
    expect(tryStartFlip(flip, true)).toBe(true);
    expect(flip.progress).toBe(0);
    expect(flipScale(flip)).toBe(1);

    expect(stepFlip(flip, FLIP_SECONDS / 4)).toBe(false);
    expect(flip.world).toBe('right-side-up');
    expect(flipScale(flip)).toBeCloseTo(0.5);

    expect(stepFlip(flip, FLIP_SECONDS / 4)).toBe(true);
    expect(flip.world).toBe('upside-down');
    expect(flipScale(flip)).toBeCloseTo(0);

    expect(stepFlip(flip, FLIP_SECONDS / 4)).toBe(false);
    expect(flipScale(flip)).toBeCloseTo(0.5);

    stepFlip(flip, FLIP_SECONDS);
    expect(isFlipping(flip)).toBe(false);
    expect(flip.world).toBe('upside-down');
    expect(flipScale(flip)).toBe(1);
  });

  it('switches world exactly once, however the frames fall', () => {
    const flip = createFlip();
    tryStartFlip(flip, true);
    let switches = 0;
    for (let i = 0; i < 100; i++) if (stepFlip(flip, 1 / 60)) switches++;
    expect(switches).toBe(1);
    expect(flip.world).toBe('upside-down');
    expect(stepFlip(flip, 1)).toBe(false);
  });

  it("doesn't flip again until the player steps off the doorway and back on", () => {
    const flip = createFlip();
    tryStartFlip(flip, true);
    stepFlip(flip, FLIP_SECONDS);
    // Still standing on the doorway.
    expect(tryStartFlip(flip, true)).toBe(false);
    expect(tryStartFlip(flip, true)).toBe(false);
    expect(flip.world).toBe('upside-down');
    // Step off, then back on.
    expect(tryStartFlip(flip, false)).toBe(false);
    expect(tryStartFlip(flip, true)).toBe(true);
    stepFlip(flip, FLIP_SECONDS);
    expect(flip.world).toBe('right-side-up');
  });

  it("can't start a second flip while one is under way", () => {
    const flip = createFlip();
    tryStartFlip(flip, true);
    stepFlip(flip, 0.1);
    tryStartFlip(flip, false);
    expect(tryStartFlip(flip, true)).toBe(false);
    expect(flip.progress).toBeCloseTo(0.1 / FLIP_SECONDS);
  });

  it('switches straight away with reduced motion', () => {
    const flip = createFlip();
    expect(tryStartFlip(flip, true, true)).toBe(true);
    expect(flip.world).toBe('upside-down');
    expect(isFlipping(flip)).toBe(false);
    expect(tryStartFlip(flip, true, true)).toBe(false);
    tryStartFlip(flip, false, true);
    tryStartFlip(flip, true, true);
    expect(flip.world).toBe('right-side-up');
  });
});
