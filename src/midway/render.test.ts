import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MidwayWorld } from './flip';
import { drawBooth, drawProp } from './render';
import { layoutMidway, type PropKind } from './world';

/** The alpha `faded()` in midway.ts draws with when a prop would hide the player. */
const FADED = 0.4;

/** Every prop kind, so a new kind fails to compile until it is listed here. */
const ALL_KINDS: Record<PropKind, true> = {
  'big-top': true,
  'round-tent': true,
  'peaked-tent': true,
  'ferris-wheel': true,
  carousel: true,
  wagon: true,
  cart: true,
  'ticket-booth': true,
  bench: true,
  planter: true,
  balloons: true,
  'bunting-pole': true,
  billboard: true,
  'jack-o-lantern': true,
  'food-stand': true,
  'flip-tent': true,
};

/**
 * A 2D context that draws nothing and records every `globalAlpha` it is given,
 * keeping `save()` and `restore()` honest about the alpha.
 */
function alphaRecorder(start: number) {
  const assigned: number[] = [];
  const stack: number[] = [];
  const state: Record<PropertyKey, unknown> = { globalAlpha: start };
  const noop = () => undefined;
  const methods: Record<PropertyKey, unknown> = {
    save: () => stack.push(state.globalAlpha as number),
    restore: () => {
      if (stack.length) state.globalAlpha = stack.pop();
    },
    measureText: (text: string) => ({ width: text.length * 6 }),
  };
  const ctx = new Proxy(state, {
    get: (target, key) => (key in target ? target[key] : (methods[key] ?? noop)),
    set: (target, key, value) => {
      if (key === 'globalAlpha') assigned.push(value as number);
      target[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, assigned };
}

describe('drawing under the player-visibility fade', () => {
  beforeEach(() => {
    // The billboard loads its banner with `new Image()`, which Node has no DOM for.
    vi.stubGlobal(
      'Image',
      class {
        src = '';
        complete = false;
        naturalWidth = 0;
      },
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const map = layoutMidway(['water-cannon', 'ring-toss']);

  it('lays out every prop kind, so every kind is drawn below', () => {
    const kinds = new Set(map.props.map((p) => p.kind));
    expect([...kinds].sort()).toEqual(Object.keys(ALL_KINDS).sort());
  });

  const worlds: MidwayWorld[] = ['right-side-up', 'upside-down'];
  for (const world of worlds) {
    for (const kind of Object.keys(ALL_KINDS) as PropKind[]) {
      it(`keeps the fade for a ${kind}, ${world}`, () => {
        for (const prop of map.props.filter((p) => p.kind === kind)) {
          for (const t of [0, 0.37, 1.9]) {
            const { ctx, assigned } = alphaRecorder(FADED);
            drawProp(ctx, prop, t, world);
            expect(Math.max(FADED, ...assigned)).toBeLessThanOrEqual(FADED);
            expect(ctx.globalAlpha).toBe(FADED);
          }
        }
      });
    }
  }

  it('keeps the fade for a booth, lit and unlit', () => {
    for (const glow of [false, true]) {
      const { ctx, assigned } = alphaRecorder(FADED);
      drawBooth(ctx, map.booths[0], 'Water Cannon', 0.5, glow);
      expect(Math.max(FADED, ...assigned)).toBeLessThanOrEqual(FADED);
      expect(ctx.globalAlpha).toBe(FADED);
    }
  });
});
