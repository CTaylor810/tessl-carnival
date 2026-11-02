import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const SWINGS_PER_ROUND = 5;
/** Power at or above this rings the bell. */
export const BELL_POWER = 0.95;
export const BELL_BONUS = 50;
/** How fast the meter moves on the first swing, in full sweeps (0 to 1) per second. */
export const BASE_METER_SPEED = 0.8;
/** How much faster the meter gets with every swing taken. */
export const METER_SPEED_STEP = 0.3;
/** Tower heights per second. */
const RISE_SPEED = 2.5;
const FALL_SPEED = 2;
/** Seconds the puck waits at the top of its climb. */
const PAUSE_TIME = 0.35;
/** Seconds the bell's flash lasts. */
const FLASH_TIME = 0.5;

const TOWER = { x: WIDTH / 2 - 30, top: 90, bottom: HEIGHT - 70, width: 60 } as const;
const TOWER_HEIGHT = TOWER.bottom - TOWER.top;
const METER = { x: TOWER.x + TOWER.width + 80, top: TOWER.top, width: 30 } as const;

export interface Puck {
  /** How far up the tower the puck is, from 0 (the base) to 1 (the bell). */
  height: number;
  /** How high this climb goes. */
  peak: number;
  motion: 'resting' | 'rising' | 'paused' | 'falling';
  /** Seconds left at the top of the climb. */
  pause: number;
  /** Whether this climb rings the bell. */
  rings: boolean;
}

export interface StrongmanBellState {
  /** The power meter, from 0 to 1. */
  meter: number;
  /** 1 while the meter climbs, -1 while it drops. */
  meterDirection: 1 | -1;
  swings: number;
  puck: Puck;
  /** Points scored by the latest swing. */
  lastPoints: number | null;
  /** Seconds left of the bell's flash. */
  flash: number;
  score: number;
  phase: 'playing' | 'over';
}

export function createState(): StrongmanBellState {
  return {
    meter: 0,
    meterDirection: 1,
    swings: 0,
    puck: { height: 0, peak: 0, motion: 'resting', pause: 0, rings: false },
    lastPoints: null,
    flash: 0,
    score: 0,
    phase: 'playing',
  };
}

export function rings(power: number): boolean {
  return power >= BELL_POWER;
}

/** `Math.round(power * 100)` points, or 100 plus the bell bonus when the bell rings. */
export function scoreForSwing(power: number): number {
  return rings(power) ? 100 + BELL_BONUS : Math.round(power * 100);
}

/** The meter's speed once `swings` swings have been taken. */
export function meterSpeed(swings: number): number {
  return BASE_METER_SPEED + METER_SPEED_STEP * swings;
}

/** Moves the meter by `distance` as a triangle wave, reversing at 0 and 1. */
export function moveMeter(state: StrongmanBellState, distance: number): void {
  let meter = state.meter + state.meterDirection * distance;
  while (meter > 1 || meter < 0) {
    if (meter > 1) {
      meter = 2 - meter;
      state.meterDirection = -1;
    } else {
      meter = -meter;
      state.meterDirection = 1;
    }
  }
  state.meter = meter;
}

export function canSwing(state: StrongmanBellState): boolean {
  return state.phase === 'playing' && state.puck.motion === 'resting';
}

/** Swings the mallet at the meter's current power. Returns false if the swing was ignored. */
export function swing(state: StrongmanBellState): boolean {
  if (!canSwing(state)) return false;
  const power = state.meter;
  const points = scoreForSwing(power);
  state.score += points;
  state.lastPoints = points;
  state.swings += 1;
  state.puck = { height: 0, peak: power, motion: 'rising', pause: 0, rings: rings(power) };
  return true;
}

/** Advances the game by `dt` seconds. */
export function step(state: StrongmanBellState, dt: number): void {
  if (state.phase === 'over') return;

  moveMeter(state, meterSpeed(state.swings) * dt);
  state.flash = Math.max(0, state.flash - dt);

  const puck = state.puck;
  if (puck.motion === 'rising') {
    puck.height = Math.min(puck.peak, puck.height + RISE_SPEED * dt);
    if (puck.height >= puck.peak) {
      puck.motion = 'paused';
      puck.pause = PAUSE_TIME;
      if (puck.rings) state.flash = FLASH_TIME;
    }
  } else if (puck.motion === 'paused') {
    puck.pause -= dt;
    if (puck.pause <= 0) puck.motion = 'falling';
  } else if (puck.motion === 'falling') {
    puck.height = Math.max(0, puck.height - FALL_SPEED * dt);
    if (puck.height === 0) {
      puck.motion = 'resting';
      if (state.swings >= SWINGS_PER_ROUND) state.phase = 'over';
    }
  }
}

function draw(ctx: CanvasRenderingContext2D, state: StrongmanBellState) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  // Tower, with a groove for the puck and a base to strike.
  ctx.fillStyle = colors.wood;
  ctx.fillRect(TOWER.x, TOWER.top, TOWER.width, TOWER_HEIGHT);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(TOWER.x + TOWER.width / 2 - 6, TOWER.top, 12, TOWER_HEIGHT);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(TOWER.x - 40, TOWER.bottom, TOWER.width + 80, 20);

  // Bell on top.
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(TOWER.x + TOWER.width / 2, TOWER.top - 6, 26, Math.PI, 0);
  ctx.fill();

  // Puck.
  const puckY = TOWER.bottom - state.puck.height * TOWER_HEIGHT;
  ctx.fillStyle = colors.stripeA;
  ctx.fillRect(TOWER.x + 6, puckY - 14, TOWER.width - 12, 14);

  // Power meter, with the bell band in danger.
  const bellTop = METER.top + (1 - BELL_POWER) * TOWER_HEIGHT;
  ctx.fillStyle = colors.surface;
  ctx.fillRect(METER.x, METER.top, METER.width, TOWER_HEIGHT);
  ctx.fillStyle = colors.danger;
  ctx.fillRect(METER.x, METER.top, METER.width, bellTop - METER.top);
  const meterY = METER.top + (1 - state.meter) * TOWER_HEIGHT;
  ctx.fillStyle = colors.text;
  ctx.fillRect(METER.x - 8, meterY - 2, METER.width + 16, 4);

  if (state.flash > 0) {
    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = (state.flash / FLASH_TIME) * 0.4;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.font = canvasFont('title', 'bold');
    ctx.textAlign = 'center';
    ctx.fillText('DING!', TOWER.x + TOWER.width / 2, TOWER.top - 44);
  }

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Swing ${state.swings}/${SWINGS_PER_ROUND}`, WIDTH - 16, HEIGHT - 20);
  if (state.lastPoints !== null) {
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.muted;
    ctx.font = canvasFont('body');
    ctx.fillText(`Last swing +${state.lastPoints}`, 16, HEIGHT - 50);
  }

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Round over! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const strongmanBell: CarnivalGame = {
  id: 'strongman-bell',
  name: 'Strongman Bell',
  description: 'Swing the mallet when the meter peaks and ring the bell. Five swings a round.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;

    const onDown = () => {
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
      } else {
        swing(state);
      }
    };
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(strongmanBell.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default strongmanBell;
