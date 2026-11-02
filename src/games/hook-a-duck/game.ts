import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const ROUND_TIME = 45;
export const DUCK_COUNT = 8;
export const DUCK_RADIUS = 40;
export const DUCK_SPEED = 80;
/** Where the ducks float, and where each duck's hook loop sits above it. */
export const DUCK_Y = 400;
export const LOOP_OFFSET = 34;
export const LOOP_RADIUS = 12;
/** The hook tip's depth: at the rod when raised, below the loops when fully lowered. */
export const HOOK_TOP = 70;
export const HOOK_BOTTOM = DUCK_Y;
export const HOOK_SPEED = 320;
/** The ducks go round a loop this long, so they stay evenly spaced as they wrap. */
const LAP = WIDTH + DUCK_RADIUS * 2;
const SPACING = LAP / DUCK_COUNT;

export type Random = () => number;

export interface Duck {
  x: number;
  /** The number painted on its back. */
  value: 1 | 2 | 3;
}

export interface Hook {
  x: number;
  /** The y of the hook's tip. */
  y: number;
  down: boolean;
  /** The number of the duck on the hook, until the hook reaches the top. */
  carrying: Duck['value'] | null;
}

export interface HookADuckState {
  ducks: Duck[];
  hook: Hook;
  score: number;
  timeLeft: number;
  phase: 'playing' | 'over';
  random: Random;
}

/** Half the ducks are 1s, a third are 2s, and the rest, the rarest, are 3s. */
export function duckValue(roll: number): Duck['value'] {
  if (roll < 0.5) return 1;
  if (roll < 0.85) return 2;
  return 3;
}

export function createState(random: Random = Math.random): HookADuckState {
  const ducks = Array.from({ length: DUCK_COUNT }, (_, i) => ({
    x: -DUCK_RADIUS + SPACING * i + SPACING / 2,
    value: duckValue(random()),
  }));
  return {
    ducks,
    hook: { x: WIDTH / 2, y: HOOK_TOP, down: false, carrying: null },
    score: 0,
    timeLeft: ROUND_TIME,
    phase: 'playing',
    random,
  };
}

/** 10 points times the number on the duck's back. */
export function scoreForDuck(duck: Duck): number {
  return 10 * duck.value;
}

/** Moves the hook to follow the mouse, kept on the canvas. */
export function moveHook(state: HookADuckState, x: number): void {
  state.hook.x = Math.min(Math.max(x, 0), WIDTH);
}

/** Lowers the hook while the button is held, and raises it when it is let go. */
export function setHookDown(state: HookADuckState, down: boolean): void {
  state.hook.down = down;
}

/** True when a rising hook tip, moving from `fromY` up to `toY`, passes through the duck's loop. */
export function hooks(duck: Duck, hookX: number, fromY: number, toY: number): boolean {
  const loopY = DUCK_Y - LOOP_OFFSET;
  return (
    Math.abs(hookX - duck.x) <= LOOP_RADIUS &&
    toY <= loopY + LOOP_RADIUS &&
    fromY >= loopY - LOOP_RADIUS
  );
}

/** Advances the game by `dt` seconds. */
export function step(state: HookADuckState, dt: number): void {
  if (state.phase === 'over') return;

  state.timeLeft = Math.max(0, state.timeLeft - dt);

  for (const duck of state.ducks) {
    duck.x += DUCK_SPEED * dt;
    if (duck.x > WIDTH + DUCK_RADIUS) duck.x -= LAP;
  }

  const { hook } = state;
  const fromY = hook.y;
  if (hook.down) {
    hook.y = Math.min(HOOK_BOTTOM, hook.y + HOOK_SPEED * dt);
  } else {
    hook.y = Math.max(HOOK_TOP, hook.y - HOOK_SPEED * dt);
    if (hook.carrying === null) {
      const duck = state.ducks.find((d) => hooks(d, hook.x, fromY, hook.y));
      if (duck) {
        hook.carrying = duck.value;
        state.score += scoreForDuck(duck);
        // The caught duck is lifted out; a new one takes its place, off the left edge.
        duck.x -= LAP;
        duck.value = duckValue(state.random());
      }
    }
    if (hook.y === HOOK_TOP) hook.carrying = null;
  }

  if (state.timeLeft === 0) state.phase = 'over';
}

function drawDuck(ctx: CanvasRenderingContext2D, x: number, y: number, value: Duck['value']) {
  const { colors } = theme;
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.ellipse(x, y, DUCK_RADIUS * 0.8, DUCK_RADIUS * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + DUCK_RADIUS * 0.55, y - DUCK_RADIUS * 0.45, DUCK_RADIUS * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.stripeA;
  ctx.beginPath();
  ctx.moveTo(x + DUCK_RADIUS * 0.8, y - DUCK_RADIUS * 0.5);
  ctx.lineTo(x + DUCK_RADIUS * 1.05, y - DUCK_RADIUS * 0.4);
  ctx.lineTo(x + DUCK_RADIUS * 0.8, y - DUCK_RADIUS * 0.3);
  ctx.fill();

  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y - LOOP_OFFSET, LOOP_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = colors.background;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x - DUCK_RADIUS * 0.15, y + 2);
  ctx.textBaseline = 'alphabetic';
}

function draw(ctx: CanvasRenderingContext2D, state: HookADuckState) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  // The water channel and its wooden edge.
  ctx.fillStyle = colors.water;
  ctx.fillRect(0, DUCK_Y - 10, WIDTH, HEIGHT - 50 - (DUCK_Y - 10));
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, HEIGHT - 50, WIDTH, 8);

  for (const duck of state.ducks) drawDuck(ctx, duck.x, DUCK_Y, duck.value);

  // Rod, line and hook.
  const { hook } = state;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(hook.x - 40, 48, 80, 10);
  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hook.x, 58);
  ctx.lineTo(hook.x, hook.y);
  ctx.stroke();
  if (hook.carrying !== null) drawDuck(ctx, hook.x, hook.y + LOOP_OFFSET, hook.carrying);
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hook.x - 6, hook.y - 6, 6, 0, Math.PI);
  ctx.stroke();

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 16);
  ctx.textAlign = 'right';
  ctx.fillText(`Time ${Math.ceil(state.timeLeft)}`, WIDTH - 16, HEIGHT - 16);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Time's up! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const hookADuck: CarnivalGame = {
  id: 'hook-a-duck',
  name: 'Hook a Duck',
  description: 'Hook the floating ducks before time runs out. Higher numbers score more.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;

    const toCanvasX = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return ((event.clientX - rect.left) / rect.width) * WIDTH;
    };
    const onMove = (event: PointerEvent) => moveHook(state, toCanvasX(event));
    const onDown = (event: PointerEvent) => {
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
        moveHook(state, toCanvasX(event));
      } else {
        moveHook(state, toCanvasX(event));
        setHookDown(state, true);
      }
    };
    const onUp = () => setHookDown(state, false);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(hookADuck.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onUp);
    };
  },
};

export default hookADuck;
