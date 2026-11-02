/**
 * The flip tent's rules: which world the midway is in, and the card-flip that
 * turns it over. Plain functions with no canvas or DOM, so Vitest can run them.
 */

export type MidwayWorld = 'right-side-up' | 'upside-down';

/** How long a whole flip takes, in seconds. The world switches halfway. */
export const FLIP_SECONDS = 1;

export interface FlipState {
  world: MidwayWorld;
  /** How far through the flip, from 0 to 1, or undefined when not flipping. */
  progress: number | undefined;
  /** False while the player still stands on the doorway that last flipped. */
  armed: boolean;
}

export function createFlip(world: MidwayWorld = 'right-side-up'): FlipState {
  return { world, progress: undefined, armed: true };
}

export function otherWorld(world: MidwayWorld): MidwayWorld {
  return world === 'right-side-up' ? 'upside-down' : 'right-side-up';
}

export function isFlipping(state: FlipState): boolean {
  return state.progress !== undefined;
}

/**
 * Starts a flip when the player is on the doorway and has stepped off it
 * since the last one. With `instant`, the world switches straight away.
 * Returns true when a flip started (or, with `instant`, happened).
 */
export function tryStartFlip(state: FlipState, onDoorway: boolean, instant = false): boolean {
  if (!onDoorway) {
    state.armed = true;
    return false;
  }
  if (!state.armed || isFlipping(state)) return false;
  state.armed = false;
  if (instant) state.world = otherWorld(state.world);
  else state.progress = 0;
  return true;
}

/**
 * Moves a flip on by `dt` seconds. Returns true on the step the world
 * switches, halfway through, so the caller can redraw in the other world.
 */
export function stepFlip(state: FlipState, dt: number): boolean {
  if (state.progress === undefined) return false;
  const before = state.progress;
  const after = Math.min(1, before + dt / FLIP_SECONDS);
  state.progress = after >= 1 ? undefined : after;
  if (before < 0.5 && after >= 0.5) {
    state.world = otherWorld(state.world);
    return true;
  }
  return false;
}

/** How tall the view is drawn: 1 → 0 as it turns over, then 0 → 1. */
export function flipScale(state: FlipState): number {
  return state.progress === undefined ? 1 : Math.abs(1 - 2 * state.progress);
}
