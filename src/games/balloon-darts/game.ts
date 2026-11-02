import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const DARTS_PER_ROUND = 10;
/** Seconds between new balloons. */
export const SPAWN_INTERVAL = 0.7;
/** How far, in pixels, a balloon sways either side of its line. */
export const SWAY = 14;
const SWAY_SPEED = 2;
const BURST_LIFE = 0.35;

export type BalloonSize = 'small' | 'medium' | 'large';

/** Smaller balloons are harder to hit, so they score more. */
export const BALLOON_SIZES: Record<BalloonSize, { radius: number; points: number; speed: number }> =
  {
    small: { radius: 18, points: 30, speed: 110 },
    medium: { radius: 26, points: 20, speed: 85 },
    large: { radius: 36, points: 10, speed: 65 },
  };
const SIZE_ORDER: BalloonSize[] = ['small', 'medium', 'large'];

/** Returns a number from 0 (inclusive) to 1 (exclusive), like `Math.random`. */
export type Random = () => number;

/** A small seeded random source, so a round can be replayed in tests. */
export function seededRandom(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Balloon {
  /** Where the balloon is now, swaying either side of `lineX`. */
  x: number;
  y: number;
  /** The line the balloon sways around. */
  lineX: number;
  size: BalloonSize;
  radius: number;
  /** Pixels per second, upwards. */
  speed: number;
  /** Seconds since the balloon spawned. */
  age: number;
  /** Where in its sway the balloon started, in radians. */
  swayPhase: number;
}

export interface Burst {
  x: number;
  y: number;
  radius: number;
  age: number;
}

export interface BalloonDartsState {
  balloons: Balloon[];
  bursts: Burst[];
  darts: number;
  score: number;
  /** Seconds until the next balloon spawns. */
  spawnIn: number;
  phase: 'playing' | 'over';
  random: Random;
}

export function createState(random: Random = Math.random): BalloonDartsState {
  return {
    balloons: [],
    bursts: [],
    darts: DARTS_PER_ROUND,
    score: 0,
    spawnIn: 0,
    phase: 'playing',
    random,
  };
}

/** Adds a balloon of a random size at a random x, just below the bottom of the board. */
export function spawnBalloon(state: BalloonDartsState): Balloon {
  const size = SIZE_ORDER[Math.min(Math.floor(state.random() * 3), 2)];
  const { radius, speed } = BALLOON_SIZES[size];
  const margin = radius + SWAY;
  const lineX = margin + state.random() * (WIDTH - margin * 2);
  const swayPhase = state.random() * Math.PI * 2;
  const balloon: Balloon = {
    x: lineX + Math.sin(swayPhase) * SWAY,
    y: HEIGHT + radius,
    lineX,
    size,
    radius,
    speed,
    age: 0,
    swayPhase,
  };
  state.balloons.push(balloon);
  return balloon;
}

/** Points for one dart: the popped balloons' points, doubled when it pops two or more. */
export function scoreForDart(popped: readonly Pick<Balloon, 'size'>[]): number {
  const points = popped.reduce((sum, balloon) => sum + BALLOON_SIZES[balloon.size].points, 0);
  return popped.length >= 2 ? points * 2 : points;
}

export function isHit(balloon: Balloon, x: number, y: number): boolean {
  return Math.hypot(x - balloon.x, y - balloon.y) <= balloon.radius;
}

/**
 * Throws one dart, which lands at (x, y) and pops every balloon there.
 * Returns the popped balloons; empty for a miss or when no dart was thrown.
 */
export function throwDart(state: BalloonDartsState, x: number, y: number): Balloon[] {
  if (state.phase !== 'playing' || state.darts === 0) return [];
  state.darts -= 1;
  const popped = state.balloons.filter((balloon) => isHit(balloon, x, y));
  state.balloons = state.balloons.filter((balloon) => !popped.includes(balloon));
  state.score += scoreForDart(popped);
  for (const balloon of popped) {
    state.bursts.push({ x: balloon.x, y: balloon.y, radius: balloon.radius, age: 0 });
  }
  if (state.darts === 0) state.phase = 'over';
  return popped;
}

/** Advances the game by `dt` seconds: balloons drift up, sway, and float away at the top. */
export function step(state: BalloonDartsState, dt: number): void {
  if (state.phase === 'playing') {
    state.spawnIn -= dt;
    while (state.spawnIn <= 0) {
      spawnBalloon(state);
      state.spawnIn += SPAWN_INTERVAL;
    }
  }

  for (const balloon of state.balloons) {
    balloon.age += dt;
    balloon.y -= balloon.speed * dt;
    balloon.x = balloon.lineX + Math.sin(balloon.swayPhase + balloon.age * SWAY_SPEED) * SWAY;
  }
  // A balloon that has risen past the top has floated away.
  state.balloons = state.balloons.filter((balloon) => balloon.y + balloon.radius > 0);

  for (const burst of state.bursts) burst.age += dt;
  state.bursts = state.bursts.filter((burst) => burst.age < BURST_LIFE);
}

const BALLOON_COLORS: Record<BalloonSize, string> = {
  small: theme.colors.stripeA,
  medium: theme.colors.water,
  large: theme.colors.accent,
};

function draw(
  ctx: CanvasRenderingContext2D,
  state: BalloonDartsState,
  aim: { x: number; y: number },
) {
  const { colors } = theme;

  ctx.fillStyle = colors.surface;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // The board's wooden frame.
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, WIDTH - 12, HEIGHT - 12);

  for (const balloon of state.balloons) {
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(balloon.x, balloon.y + balloon.radius);
    ctx.lineTo(balloon.x, balloon.y + balloon.radius * 2.2);
    ctx.stroke();

    ctx.fillStyle = BALLOON_COLORS[balloon.size];
    ctx.beginPath();
    ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.text;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(
      balloon.x - balloon.radius * 0.35,
      balloon.y - balloon.radius * 0.35,
      balloon.radius * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  for (const burst of state.bursts) {
    const grow = burst.radius + (burst.age / BURST_LIFE) * 30;
    ctx.globalAlpha = 1 - burst.age / BURST_LIFE;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.moveTo(burst.x + Math.cos(angle) * grow * 0.5, burst.y + Math.sin(angle) * grow * 0.5);
      ctx.lineTo(burst.x + Math.cos(angle) * grow, burst.y + Math.sin(angle) * grow);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 24, HEIGHT - 24);
  ctx.textAlign = 'right';
  ctx.fillText(`Darts ${state.darts}/${DARTS_PER_ROUND}`, WIDTH - 24, HEIGHT - 24);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of darts! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
    return;
  }

  // Crosshair at the aim.
  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(aim.x, aim.y, 12, 0, Math.PI * 2);
  ctx.moveTo(aim.x - 18, aim.y);
  ctx.lineTo(aim.x + 18, aim.y);
  ctx.moveTo(aim.x, aim.y - 18);
  ctx.lineTo(aim.x, aim.y + 18);
  ctx.stroke();
}

export const balloonDarts: CarnivalGame = {
  id: 'balloon-darts',
  name: 'Balloon Darts',
  description: 'Pop the balloons before they float away. Small ones score most.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const cursor = canvas.style.cursor;
    canvas.style.cursor = 'none';

    let state = createState();
    const aim = { x: WIDTH / 2, y: HEIGHT / 2 };

    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };
    const onMove = (event: PointerEvent) => Object.assign(aim, toCanvas(event));
    const onDown = (event: PointerEvent) => {
      Object.assign(aim, toCanvas(event));
      if (state.phase === 'over') {
        state = createState();
        return;
      }
      throwDart(state, aim.x, aim.y);
      // Record as soon as the last dart lands, so a quick replay or leaving
      // the booth before the next frame can't drop the round's score.
      if (state.darts === 0) recordScore(balloonDarts.id, state.score);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      draw(ctx, state, aim);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.style.cursor = cursor;
    };
  },
};

export default balloonDarts;
