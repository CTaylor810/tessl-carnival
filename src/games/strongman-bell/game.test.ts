import { describe, expect, it } from 'vitest';
import {
  SWINGS_PER_ROUND,
  createState,
  meterSpeed,
  moveMeter,
  scoreForSwing,
  step,
  swing,
  type StrongmanBellState,
} from './game';

/** Steps until the puck is back at the base. */
function land(state: StrongmanBellState) {
  for (let i = 0; i < 1000 && state.puck.motion !== 'resting'; i++) step(state, 0.02);
}

describe('strongman bell', () => {
  it('starts with no swings, no score and the puck at the base', () => {
    const state = createState();
    expect(state.swings).toBe(0);
    expect(state.score).toBe(0);
    expect(state.meter).toBe(0);
    expect(state.puck.height).toBe(0);
    expect(state.puck.motion).toBe('resting');
    expect(state.phase).toBe('playing');
  });

  it('scores Math.round(power * 100) below the bell', () => {
    expect(scoreForSwing(0)).toBe(0);
    expect(scoreForSwing(0.12)).toBe(12);
    expect(scoreForSwing(0.5)).toBe(50);
    expect(scoreForSwing(0.949)).toBe(95);
  });

  it('scores 150 when the swing rings the bell', () => {
    expect(scoreForSwing(0.95)).toBe(150);
    expect(scoreForSwing(1)).toBe(150);
  });

  it('keeps the meter within 0 and 1 and reverses at the top', () => {
    const state = createState();
    state.meter = 0.9;
    moveMeter(state, 0.3);
    expect(state.meter).toBeCloseTo(0.8);
    expect(state.meterDirection).toBe(-1);
  });

  it('reverses the meter at the bottom', () => {
    const state = createState();
    state.meter = 0.1;
    state.meterDirection = -1;
    moveMeter(state, 0.3);
    expect(state.meter).toBeCloseTo(0.2);
    expect(state.meterDirection).toBe(1);
  });

  it('never lets the meter leave 0 to 1 over many steps', () => {
    const state = createState();
    for (let i = 0; i < 500; i++) {
      step(state, 0.05);
      expect(state.meter).toBeGreaterThanOrEqual(0);
      expect(state.meter).toBeLessThanOrEqual(1);
    }
  });

  it('makes the meter faster with every swing', () => {
    for (let swings = 0; swings < SWINGS_PER_ROUND; swings++) {
      expect(meterSpeed(swings + 1)).toBeGreaterThan(meterSpeed(swings));
    }
  });

  it('swings at the meter power and sends the puck up', () => {
    const state = createState();
    state.meter = 0.4;
    expect(swing(state)).toBe(true);
    expect(state.score).toBe(40);
    expect(state.swings).toBe(1);
    expect(state.puck.motion).toBe('rising');
    expect(state.puck.peak).toBe(0.4);
  });

  it('ignores swings while the puck is still moving', () => {
    const state = createState();
    state.meter = 0.6;
    swing(state);
    step(state, 0.05);
    expect(swing(state)).toBe(false);
    expect(state.swings).toBe(1);
    expect(state.score).toBe(60);
  });

  it('lets the next swing start once the puck is back at the base', () => {
    const state = createState();
    state.meter = 0.6;
    swing(state);
    land(state);
    expect(state.puck.height).toBe(0);
    expect(swing(state)).toBe(true);
  });

  it('flashes the bell when the puck reaches it', () => {
    const state = createState();
    state.meter = 0.97;
    swing(state);
    for (let i = 0; i < 100 && state.puck.motion === 'rising'; i++) step(state, 0.02);
    expect(state.flash).toBeGreaterThan(0);
  });

  it('ends the round once the fifth swing lands, not before', () => {
    const state = createState();
    for (let i = 0; i < SWINGS_PER_ROUND; i++) {
      state.meter = 0.5;
      swing(state);
      if (i < SWINGS_PER_ROUND - 1) {
        land(state);
        expect(state.phase).toBe('playing');
      }
    }
    step(state, 0.02);
    expect(state.phase).toBe('playing');
    land(state);
    expect(state.phase).toBe('over');
    expect(state.score).toBe(250);
    expect(swing(state)).toBe(false);
  });
});
