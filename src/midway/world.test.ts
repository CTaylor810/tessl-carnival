import { describe, expect, it } from 'vitest';
import {
  boothInReach,
  canStand,
  createVisitors,
  createWalker,
  enterWorld,
  findPath,
  followPath,
  inputDirection,
  inWorld,
  isBlocked,
  layoutMidway,
  onFlipDoorway,
  pathToBooth,
  seededRandom,
  toScreen,
  toTile,
  updateVisitor,
  walk,
} from './world';

describe('layoutMidway', () => {
  it('gives every game its own booth, nearest the gate first', () => {
    const map = layoutMidway(['water-cannon', 'ring-toss', 'hook-a-duck']);
    const open = map.booths.filter((b) => b.gameId);
    expect(open.map((b) => b.gameId)).toEqual(['water-cannon', 'ring-toss', 'hook-a-duck']);
    expect(open[0].y).toBeGreaterThan(open[2].y);
  });

  it('fills spare slots with coming-soon booths', () => {
    const map = layoutMidway(['water-cannon']);
    expect(map.booths).toHaveLength(4);
    expect(map.booths.filter((b) => !b.gameId)).toHaveLength(3);
  });

  it('grows the avenue as games are added', () => {
    const ids = Array.from({ length: 9 }, (_, i) => `game-${i}`);
    const small = layoutMidway(ids.slice(0, 1));
    const big = layoutMidway(ids);
    expect(big.booths.filter((b) => b.gameId)).toHaveLength(9);
    expect(big.height).toBeGreaterThan(small.height);
  });

  it('blocks booths and keeps the edge fenced', () => {
    const map = layoutMidway(['water-cannon']);
    const booth = map.booths[0];
    expect(isBlocked(map, booth.x, booth.y)).toBe(true);
    expect(isBlocked(map, 0, 5)).toBe(true);
    expect(isBlocked(map, map.width - 1, 5)).toBe(true);
    expect(isBlocked(map, -1, 0)).toBe(true);
  });

  it('lets the player reach every booth from the gate', () => {
    const ids = Array.from({ length: 7 }, (_, i) => `game-${i}`);
    const map = layoutMidway(ids);
    expect(canStand(map, map.spawn.x, map.spawn.y)).toBe(true);
    for (const booth of map.booths) {
      const path = pathToBooth(map, map.spawn, booth);
      expect(path, `booth ${booth.index}`).toBeDefined();
      expect(boothInReach(map, path!.at(-1)!)).toBe(booth);
    }
  });

  it('never stacks booths and scenery on the same tile, however many games there are', () => {
    for (const count of [0, 1, 4, 9, 15]) {
      const map = layoutMidway(Array.from({ length: count }, (_, i) => `game-${i}`));
      const taken = new Set<string>();
      for (const thing of [...map.booths, ...map.props]) {
        for (let y = thing.y; y < thing.y + thing.h; y++) {
          for (let x = thing.x; x < thing.x + thing.w; x++) {
            expect(taken.has(`${x},${y}`), `${count} games: ${x},${y}`).toBe(false);
            expect(x > 0 && y > 0 && x < map.width - 1 && y < map.height - 1).toBe(true);
            taken.add(`${x},${y}`);
          }
        }
      }
    }
  });

  it('keeps the avenue clear from the gate to the big top', () => {
    const map = layoutMidway(['water-cannon']);
    for (let y = 6; y < map.height - 1; y++) {
      expect(isBlocked(map, map.avenueX, y)).toBe(false);
      expect(isBlocked(map, map.avenueX + 1, y)).toBe(false);
    }
  });

  it("sets out jack-o'-lanterns on the grass without blocking the avenue or any booth", () => {
    for (const count of [0, 1, 4, 9]) {
      const map = layoutMidway(Array.from({ length: count }, (_, i) => `game-${i}`));
      const lanterns = map.props.filter((p) => p.kind === 'jack-o-lantern');
      expect(lanterns.length).toBeGreaterThan(0);
      for (const lantern of lanterns) {
        expect(map.ground[lantern.y * map.width + lantern.x]).toBe('grass');
        expect(lantern.x === map.avenueX || lantern.x === map.avenueX + 1).toBe(false);
      }
      expect(canStand(map, map.spawn.x, map.spawn.y)).toBe(true);
      for (const booth of map.booths) {
        expect(
          pathToBooth(map, map.spawn, booth),
          `${count} games: booth ${booth.index}`,
        ).toBeDefined();
      }
    }
  });

  it('puts a giant food stand on the grass, clear of the avenue, booths and paths to them', () => {
    for (const count of [0, 1, 4, 9, 15]) {
      const map = layoutMidway(Array.from({ length: count }, (_, i) => `game-${i}`));
      const stands = map.props.filter((p) => p.kind === 'food-stand');
      expect(stands, `${count} games`).toHaveLength(1);
      const stand = stands[0];
      for (const cart of map.props.filter((p) => p.kind === 'cart')) {
        expect(stand.w * stand.h).toBeGreaterThan(cart.w * cart.h);
      }
      for (const other of [...map.booths, ...map.props]) {
        if (other === stand) continue;
        const overlaps =
          other.x < stand.x + stand.w &&
          stand.x < other.x + other.w &&
          other.y < stand.y + stand.h &&
          stand.y < other.y + other.h;
        expect(overlaps, `${count} games: overlaps ${JSON.stringify(other)}`).toBe(false);
      }
      for (let y = stand.y; y < stand.y + stand.h; y++) {
        for (let x = stand.x; x < stand.x + stand.w; x++) {
          expect(isBlocked(map, x, y)).toBe(true);
          expect(map.ground[y * map.width + x]).toBe('grass');
        }
      }
      for (let y = 6; y < map.height - 1; y++) {
        expect(isBlocked(map, map.avenueX, y)).toBe(false);
        expect(isBlocked(map, map.avenueX + 1, y)).toBe(false);
      }
      expect(canStand(map, map.spawn.x, map.spawn.y)).toBe(true);
      for (const booth of map.booths) {
        expect(
          pathToBooth(map, map.spawn, booth),
          `${count} games: booth ${booth.index}`,
        ).toBeDefined();
      }
    }
  });

  it('puts a flip tent beside the avenue, clear of everything, with a walkable doorway', () => {
    for (const count of [0, 1, 4, 9, 15]) {
      const map = layoutMidway(Array.from({ length: count }, (_, i) => `game-${i}`));
      const tents = map.props.filter((p) => p.kind === 'flip-tent');
      expect(tents, `${count} games`).toHaveLength(1);
      const tent = tents[0];
      expect([tent.w, tent.h]).toEqual([3, 3]);
      for (const other of [...map.booths, ...map.props]) {
        if (other === tent) continue;
        const overlaps =
          other.x < tent.x + tent.w &&
          tent.x < other.x + other.w &&
          other.y < tent.y + tent.h &&
          tent.y < other.y + other.h;
        expect(overlaps, `${count} games: overlaps ${JSON.stringify(other)}`).toBe(false);
      }

      // Every tile is blocked but the doorway, which sits on the tent's edge.
      const door = map.flipDoorway;
      for (let y = tent.y; y < tent.y + tent.h; y++) {
        for (let x = tent.x; x < tent.x + tent.w; x++) {
          expect(map.ground[y * map.width + x]).toBe('grass');
          expect(isBlocked(map, x, y), `${x},${y}`).toBe(x !== door.x || y !== door.y);
        }
      }
      expect(door.y).toBe(tent.y + tent.h - 1);

      // The avenue stays clear, and the doorway and every booth can be walked to.
      for (let y = 6; y < map.height - 1; y++) {
        expect(isBlocked(map, map.avenueX, y)).toBe(false);
        expect(isBlocked(map, map.avenueX + 1, y)).toBe(false);
      }
      expect(tent.x).toBeGreaterThan(map.avenueX + 1);
      const toDoor = findPath(map, map.spawn, { x: door.x + 0.5, y: door.y + 0.5 });
      expect(toDoor, `${count} games: doorway`).toBeDefined();
      expect(onFlipDoorway(map, toDoor!.at(-1)!)).toBe(true);
      for (const booth of map.booths) {
        const path = pathToBooth(map, map.spawn, booth);
        expect(path, `${count} games: booth ${booth.index}`).toBeDefined();
        expect(path!.some((step) => onFlipDoorway(map, step))).toBe(false);
      }
    }
  });

  it('only stands on the doorway, not beside it', () => {
    const map = layoutMidway(['water-cannon']);
    const door = map.flipDoorway;
    expect(onFlipDoorway(map, { x: door.x + 0.5, y: door.y + 0.5 })).toBe(true);
    expect(onFlipDoorway(map, { x: door.x + 0.5, y: door.y + 1.5 })).toBe(false);
    expect(onFlipDoorway(map, map.spawn)).toBe(false);
    expect(canStand(map, door.x + 0.5, door.y + 0.5)).toBe(true);
  });

  it("only puts the jack-o'-lanterns out in the upside-down world", () => {
    const map = layoutMidway(['water-cannon']);
    const lanterns = map.props.filter((p) => p.kind === 'jack-o-lantern');
    enterWorld(map, 'right-side-up');
    for (const lantern of lanterns) {
      expect(inWorld(lantern, 'right-side-up')).toBe(false);
      expect(isBlocked(map, lantern.x, lantern.y)).toBe(false);
    }
    expect(
      inWorld(
        map.props.find((p) => p.kind === 'flip-tent')!,
        'right-side-up',
      ),
    ).toBe(true);
    enterWorld(map, 'upside-down');
    for (const lantern of lanterns) {
      expect(inWorld(lantern, 'upside-down')).toBe(true);
      expect(isBlocked(map, lantern.x, lantern.y)).toBe(true);
    }
    for (const world of ['right-side-up', 'upside-down'] as const) {
      enterWorld(map, world);
      for (const booth of map.booths) {
        expect(pathToBooth(map, map.spawn, booth), `${world}: booth ${booth.index}`).toBeDefined();
      }
    }
  });

  it('is the same on every visit', () => {
    expect(layoutMidway(['a'])).toEqual(layoutMidway(['a']));
  });
});

describe('isometric projection', () => {
  it('turns tiles into screen pixels and back', () => {
    expect(toScreen(1, 0)).toEqual({ x: 16, y: 8 });
    expect(toScreen(0, 1)).toEqual({ x: -16, y: 8 });
    const back = toTile(toScreen(3.25, 7.5).x, toScreen(3.25, 7.5).y);
    expect(back.x).toBeCloseTo(3.25);
    expect(back.y).toBeCloseTo(7.5);
  });

  it('walks up the screen when up is pressed', () => {
    const up = inputDirection(0, -1);
    const step = toScreen(up.x, up.y);
    expect(step.x).toBeCloseTo(0);
    expect(step.y).toBeLessThan(0);
    expect(Math.hypot(up.x, up.y)).toBeCloseTo(1);
    expect(inputDirection(0, 0)).toEqual({ x: 0, y: 0 });
  });
});

describe('walking', () => {
  it('moves freely across open ground', () => {
    const map = layoutMidway([]);
    const walker = createWalker(map.spawn);
    walk(map, walker, { x: 0, y: -1 }, 0.25);
    expect(walker.y).toBeCloseTo(map.spawn.y - 0.25 * 4.2);
    expect(walker.walking).toBe(true);
    expect(walker.facing).toBe('back');
  });

  it("can't walk through the food stand", () => {
    const map = layoutMidway(['water-cannon']);
    const stand = map.props.find((p) => p.kind === 'food-stand')!;
    const walker = createWalker({ x: stand.x + 1.5, y: stand.y + stand.h + 0.5 });
    for (let i = 0; i < 60; i++) walk(map, walker, { x: 0, y: -1 }, 1 / 60);
    expect(walker.y).toBeGreaterThanOrEqual(stand.y + stand.h + 0.3 - 1e-9);
  });

  it("can't walk through a booth", () => {
    const map = layoutMidway(['water-cannon']);
    const booth = map.booths[0];
    const walker = createWalker({ x: booth.x + 1, y: booth.y + booth.h + 0.5 });
    for (let i = 0; i < 60; i++) walk(map, walker, { x: 0, y: -1 }, 1 / 60);
    expect(walker.y).toBeGreaterThanOrEqual(booth.y + booth.h + 0.3 - 1e-9);
  });

  it('follows a path to the end', () => {
    const map = layoutMidway([]);
    const walker = createWalker(map.spawn);
    walker.path = findPath(map, walker, { x: map.avenueX, y: 5 })!;
    let done = false;
    for (let i = 0; i < 600 && !done; i++) done = followPath(walker, 1 / 30);
    expect(done).toBe(true);
    expect(walker.x).toBe(map.avenueX + 0.5);
    expect(walker.y).toBe(5.5);
  });
});

describe('findPath', () => {
  it('goes round booths rather than through them', () => {
    const map = layoutMidway(['water-cannon']);
    const booth = map.booths[0];
    const path = findPath(
      map,
      { x: booth.x - 0.5, y: booth.y + 1 },
      { x: booth.x + booth.w, y: booth.y + 1 },
    )!;
    expect(path).toBeDefined();
    for (const step of path)
      expect(isBlocked(map, Math.floor(step.x), Math.floor(step.y))).toBe(false);
  });

  it('gives up on tiles nobody can stand on', () => {
    const map = layoutMidway(['water-cannon']);
    const booth = map.booths[0];
    expect(findPath(map, map.spawn, { x: booth.x, y: booth.y })).toBeUndefined();
  });
});

describe('boothInReach', () => {
  it('finds the booth the player is standing at, and nothing out in the open', () => {
    const map = layoutMidway(['water-cannon']);
    const booth = map.booths[0];
    expect(boothInReach(map, { x: booth.x + 1, y: booth.y + booth.h + 0.5 })).toBe(booth);
    expect(boothInReach(map, map.spawn)).toBeUndefined();
  });
});

describe('visitors', () => {
  it('stroll the midway without walking into anything', () => {
    const map = layoutMidway(['water-cannon']);
    const random = seededRandom(1);
    const visitors = createVisitors(map, 5, random);
    for (let i = 0; i < 900; i++) {
      for (const visitor of visitors) updateVisitor(map, visitor, 1 / 30, random);
    }
    for (const visitor of visitors) {
      expect(isBlocked(map, Math.floor(visitor.x), Math.floor(visitor.y))).toBe(false);
      expect(visitor.stride).toBeGreaterThan(0);
    }
  });
});
