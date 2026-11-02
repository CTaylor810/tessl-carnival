/**
 * The carnival's colours, fonts and sizes. Games draw with these rather than
 * their own values, so every booth on the midway looks like it belongs.
 */

/** The Halloween look: dusk purples, pumpkin orange and bone white. */
export const halloweenColors = {
  background: '#140b24',
  surface: '#25163d',
  text: '#f6f2ea',
  muted: '#bfb1d6',
  accent: '#ffb627',
  danger: '#ff4d6d',
  stripeA: '#ff6b1a',
  stripeB: '#f6f2ea',
  water: '#6fd3ee',
  wood: '#6b4630',
} as const;

export type ColorName = keyof typeof halloweenColors;
export type ThemeColors = Record<ColorName, string>;

/** The cheerful day look the carnival had before Halloween. */
export const dayColors: Readonly<ThemeColors> = {
  background: '#1b1035',
  surface: '#2a1a52',
  text: '#fff8e7',
  muted: '#b9a9d9',
  accent: '#ffcc33',
  danger: '#ff5a5f',
  stripeA: '#e63946',
  stripeB: '#fff8e7',
  water: '#5ec8f2',
  wood: '#8a5a3b',
};

export type ThemeMode = 'day' | 'halloween';

const colorsFor: Record<ThemeMode, Readonly<ThemeColors>> = {
  day: dayColors,
  halloween: halloweenColors,
};

export const theme = {
  /** The current mode's colours. `setThemeMode` updates this object in place. */
  colors: { ...halloweenColors } as ThemeColors,
  font: {
    family: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
    small: 14,
    body: 18,
    title: 32,
  },
  radius: 12,
  canvas: {
    width: 800,
    height: 500,
  },
} as const;

/** Canvas font string, e.g. canvasFont('title') → 'bold 32px "Trebuchet MS", …'. */
export function canvasFont(size: 'small' | 'body' | 'title', weight: 'normal' | 'bold' = 'normal') {
  return `${weight} ${theme.font[size]}px ${theme.font.family}`;
}

/** Exposes the theme to CSS as custom properties, e.g. --color-accent. */
export function applyTheme(root: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--color-${name}`, value);
  }
  root.style.setProperty('--font-family', theme.font.family);
  root.style.setProperty('--radius', `${theme.radius}px`);
}

let currentMode: ThemeMode = 'halloween';
const listeners = new Set<(mode: ThemeMode) => void>();

/** The mode `theme.colors` currently holds. */
export function themeMode(): ThemeMode {
  return currentMode;
}

/**
 * Switches the whole carnival's look. Updates `theme.colors` in place, so games
 * pick it up on their next frame, refreshes the page's CSS variables when there
 * is a page, and tells every `onThemeChange` listener. Setting the current mode
 * does nothing.
 */
export function setThemeMode(mode: ThemeMode) {
  if (mode === currentMode) return;
  currentMode = mode;
  Object.assign(theme.colors, colorsFor[mode]);
  if (typeof document !== 'undefined') applyTheme();
  for (const listener of [...listeners]) listener(mode);
}

/** Calls `listener` after each theme change. Returns a function that stops it. */
export function onThemeChange(listener: (mode: ThemeMode) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
