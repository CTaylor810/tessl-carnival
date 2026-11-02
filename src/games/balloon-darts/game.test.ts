import { describe, expect, it } from 'vitest';
import { theme } from '../../carnival';
import {
  BALLOON_SIZES,
  DARTS_PER_ROUND,
  SPAWN_INTERVAL,
  SWAY,
  createState,
  scoreForDart,
  seededRandom,
  spawnBalloon,
  step,
  throwDart,
  type Balloon,
  type BalloonSize,
} from './game';

/** A still balloon at (x, y), for placing hits exactly. */
function balloon(size: BalloonSize, x: number, y: number): Balloon {
  const { radius, speed } = BALLOON_SIZES[size];
  return { x, y, lineX: x, size, radius, speed, age: 0, swayPhase: 0 };
}

describe('balloon darts', () => {
  it('starts with 10 darts, no score and no balloons', () => {
    const state = createState(seededRandom(1));
    expect(state.darts).toBe(DARTS_PER_ROUND);
    expect(DARTS_PER_ROUND).toBe(10);
    expect(state.score).toBe(0);
    expect(state.balloons).toEqual([]);
    expect(state.phase).toBe('playing');
  });

  it('scores 30, 20 and 10 by size', () => {
    expect(scoreForDart([{ size: 'small' }])).toBe(30);
    expect(scoreForDart([{ size: 'medium' }])).toBe(20);
    expect(scoreForDart([{ size: 'large' }])).toBe(10);
    expect(scoreForDart([])).toBe(0);
  });

  it('doubles a dart that pops two or more balloons', () => {
    expect(scoreForDart([{ size: 'small' }, { size: 'large' }])).toBe(80);
    expect(scoreForDart([{ size: 'small' }, { size: 'medium' }, { size: 'large' }])).toBe(120);
  });

  it('pops a balloon the dart lands on and scores it', () => {
    const state = createState(seededRandom(1));
    state.balloons = [balloon('medium', 200, 200), balloon('small', 600, 200)];
    const popped = throwDart(state, 205, 195);
    expect(popped.map((b) => b.size)).toEqual(['medium']);
    expect(state.score).toBe(20);
    expect(state.balloons.map((b) => b.size)).toEqual(['small']);
    expect(state.bursts).toHaveLength(1);
    expect(state.darts).toBe(DARTS_PER_ROUND - 1);
  });

  it('uses up a dart that misses and scores nothing', () => {
    const state = createState(seededRandom(1));
    state.balloons = [balloon('large', 200, 200)];
    expect(throwDart(state, 400, 400)).toEqual([]);
    expect(state.score).toBe(0);
    expect(state.balloons).toHaveLength(1);
    expect(state.darts).toBe(DARTS_PER_ROUND - 1);
  });

  it('pops every overlapping balloon under one dart, for double points', () => {
    const state = createState(seededRandom(1));
    state.balloons = [
      balloon('small', 300, 300),
      balloon('large', 310, 300),
      balloon('medium', 600, 100),
    ];
    expect(throwDart(state, 305, 300)).toHaveLength(2);
    expect(state.score).toBe((30 + 10) * 2);
    expect(state.balloons.map((b) => b.size)).toEqual(['medium']);
  });

  it('spawns balloons at the bottom, inside the board', () => {
    const state = createState(seededRandom(7));
    for (let i = 0; i < 200; i++) {
      const b = spawnBalloon(state);
      expect(b.y).toBe(theme.canvas.height + b.radius);
      expect(b.x - b.radius).toBeGreaterThanOrEqual(0);
      expect(b.x + b.radius).toBeLessThanOrEqual(theme.canvas.width);
      expect(b.radius).toBe(BALLOON_SIZES[b.size].radius);
    }
    expect(new Set(state.balloons.map((b) => b.size))).toEqual(
      new Set(['small', 'medium', 'large']),
    );
  });

  it('is the same round for the same seed', () => {
    const a = createState(seededRandom(42));
    const b = createState(seededRandom(42));
    for (let i = 0; i < 50; i++) {
      step(a, 0.05);
      step(b, 0.05);
    }
    expect(a.balloons).toEqual(b.balloons);
  });

  it('spawns a balloon every spawn interval', () => {
    const state = createState(seededRandom(3));
    step(state, 0.01);
    expect(state.balloons).toHaveLength(1);
    step(state, SPAWN_INTERVAL);
    expect(state.balloons).toHaveLength(2);
  });

  it('drifts balloons up with a sway that stays near their line', () => {
    const state = createState(seededRandom(1));
    state.spawnIn = Infinity;
    const b = balloon('medium', 400, 400);
    state.balloons = [b];
    const xs: number[] = [];
    for (let i = 0; i < 20; i++) {
      step(state, 0.05);
      xs.push(b.x);
      expect(Math.abs(b.x - b.lineX)).toBeLessThanOrEqual(SWAY);
    }
    expect(b.y).toBeCloseTo(400 - BALLOON_SIZES.medium.speed);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0);
  });

  it('lets a balloon float away once it rises past the top', () => {
    const state = createState(seededRandom(1));
    state.spawnIn = Infinity;
    const b = balloon('large', 400, 10);
    state.balloons = [b];
    step(state, 0.1);
    expect(state.balloons).toContain(b);
    step(state, 1);
    expect(state.balloons).not.toContain(b);
    expect(state.score).toBe(0);
  });

  it('ends the round on the 10th dart and throws no more', () => {
    const state = createState(seededRandom(1));
    for (let i = 0; i < DARTS_PER_ROUND - 1; i++) throwDart(state, 0, 0);
    expect(state.phase).toBe('playing');
    state.balloons = [balloon('small', 100, 100)];
    throwDart(state, 100, 100);
    expect(state.darts).toBe(0);
    expect(state.phase).toBe('over');
    expect(state.score).toBe(30);

    state.balloons = [balloon('small', 100, 100)];
    expect(throwDart(state, 100, 100)).toEqual([]);
    expect(state.score).toBe(30);
  });
});
