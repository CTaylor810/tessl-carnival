import { describe, expect, it } from 'vitest';
import {
  DUCK_COUNT,
  DUCK_RADIUS,
  DUCK_SPEED,
  DUCK_Y,
  HOOK_TOP,
  LOOP_OFFSET,
  ROUND_TIME,
  createState,
  duckValue,
  moveHook,
  scoreForDuck,
  setHookDown,
  step,
  type HookADuckState,
} from './game';
import { theme } from '../../carnival';

const LOOP_Y = DUCK_Y - LOOP_OFFSET;

/** A random source that always returns the same roll, so every duck is the same number. */
const always = (roll: number) => () => roll;

/** Puts the hook tip just below the loop of the first duck, ready to rise through it. */
function hookUnderFirstDuck(state: HookADuckState, offsetX = 0) {
  moveHook(state, state.ducks[0].x + offsetX);
  state.hook.y = LOOP_Y + 20;
  setHookDown(state, false);
}

describe('hook a duck', () => {
  it('starts with a full timer, no score, eight ducks and the hook raised', () => {
    const state = createState(always(0));
    expect(state.timeLeft).toBe(ROUND_TIME);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.ducks).toHaveLength(DUCK_COUNT);
    expect(state.hook.y).toBe(HOOK_TOP);
    expect(state.hook.carrying).toBeNull();
  });

  it('gives each duck a 1, 2 or 3, with 3s the rarest', () => {
    expect(duckValue(0)).toBe(1);
    expect(duckValue(0.6)).toBe(2);
    expect(duckValue(0.9)).toBe(3);
    expect(createState(always(0.99)).ducks.every((d) => d.value === 3)).toBe(true);
  });

  it('floats the ducks left to right', () => {
    const state = createState(always(0));
    const before = state.ducks[0].x;
    step(state, 0.5);
    expect(state.ducks[0].x).toBeCloseTo(before + DUCK_SPEED * 0.5);
  });

  it('wraps a duck back to the left when it leaves the right edge', () => {
    const state = createState(always(0));
    state.ducks[0].x = theme.canvas.width + DUCK_RADIUS - 1;
    step(state, 0.05);
    expect(state.ducks[0].x).toBeLessThan(0);
  });

  it('lowers the hook while the button is held and raises it when let go', () => {
    const state = createState(always(0));
    setHookDown(state, true);
    step(state, 0.2);
    const lowered = state.hook.y;
    expect(lowered).toBeGreaterThan(HOOK_TOP);
    setHookDown(state, false);
    step(state, 0.05);
    expect(state.hook.y).toBeLessThan(lowered);
  });

  it('catches a duck when the hook rises through its loop', () => {
    const state = createState(always(0.6));
    hookUnderFirstDuck(state);
    const caughtX = state.ducks[0].x;
    step(state, 0.1);
    expect(state.score).toBe(20);
    expect(state.hook.carrying).toBe(2);
    // The caught duck is replaced by a new one off the left edge.
    expect(state.ducks[0].x).toBeLessThan(caughtX);
    expect(state.ducks[0].x).toBeLessThan(0);
  });

  it('misses when the hook rises beside the loop', () => {
    const state = createState(always(0));
    hookUnderFirstDuck(state, 30);
    step(state, 0.1);
    expect(state.score).toBe(0);
    expect(state.hook.carrying).toBeNull();
  });

  it('does not catch a duck on the way down', () => {
    const state = createState(always(0));
    moveHook(state, state.ducks[0].x);
    state.hook.y = LOOP_Y - 20;
    setHookDown(state, true);
    step(state, 0.1);
    expect(state.score).toBe(0);
  });

  it('scores 10 points times the number on the duck', () => {
    expect(scoreForDuck({ x: 0, value: 1 })).toBe(10);
    expect(scoreForDuck({ x: 0, value: 2 })).toBe(20);
    expect(scoreForDuck({ x: 0, value: 3 })).toBe(30);
  });

  it('carries only one duck until the hook reaches the top', () => {
    const state = createState(always(0));
    hookUnderFirstDuck(state);
    step(state, 0.1);
    expect(state.score).toBe(10);

    // Rising through another duck's loop while still carrying catches nothing.
    hookUnderFirstDuck(state);
    state.ducks[0].x = state.hook.x;
    step(state, 0.1);
    expect(state.score).toBe(10);

    // Once the hook is back at the top, it can catch again.
    step(state, 2);
    expect(state.hook.y).toBe(HOOK_TOP);
    expect(state.hook.carrying).toBeNull();
    hookUnderFirstDuck(state);
    step(state, 0.1);
    expect(state.score).toBe(20);
  });

  it('ends the round when the timer runs out', () => {
    const state = createState(always(0));
    step(state, ROUND_TIME - 1);
    expect(state.phase).toBe('playing');
    step(state, 1);
    expect(state.timeLeft).toBe(0);
    expect(state.phase).toBe('over');
  });
});
