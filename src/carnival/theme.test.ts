import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  dayColors,
  halloweenColors,
  onThemeChange,
  setThemeMode,
  theme,
  themeMode,
} from './theme';

/** A stand-in for an element: records the CSS properties set on it. */
function fakeRoot() {
  const props = new Map<string, string>();
  const root = {
    style: { setProperty: (name: string, value: string) => props.set(name, value) },
  } as unknown as HTMLElement;
  return { root, props };
}

afterEach(() => {
  setThemeMode('halloween');
  vi.unstubAllGlobals();
});

describe('theme colours', () => {
  it('gives the day and Halloween looks the same keys', () => {
    expect(Object.keys(dayColors).sort()).toEqual(Object.keys(halloweenColors).sort());
  });

  it('keeps the day look from before the Halloween change', () => {
    expect(dayColors).toEqual({
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
    });
  });

  it('starts in Halloween, so the carnival looks as it did', () => {
    expect(themeMode()).toBe('halloween');
    expect(theme.colors).toEqual(halloweenColors);
  });
});

describe('setThemeMode', () => {
  it('changes the colours in place and reports the mode', () => {
    const colors = theme.colors;

    setThemeMode('day');
    expect(themeMode()).toBe('day');
    expect(theme.colors).toBe(colors);
    expect(theme.colors).toEqual(dayColors);

    setThemeMode('halloween');
    expect(themeMode()).toBe('halloween');
    expect(theme.colors).toBe(colors);
    expect(theme.colors).toEqual(halloweenColors);
  });

  it('leaves the colour sets themselves alone', () => {
    setThemeMode('day');
    setThemeMode('halloween');
    expect(dayColors.accent).toBe('#ffcc33');
    expect(halloweenColors.accent).toBe('#ffb627');
  });

  it('works without a document', () => {
    expect(typeof document).toBe('undefined');
    expect(() => setThemeMode('day')).not.toThrow();
  });

  it("updates the page's CSS variables when there is a document", () => {
    const { root, props } = fakeRoot();
    vi.stubGlobal('document', { documentElement: root });

    setThemeMode('day');
    expect(props.get('--color-accent')).toBe(dayColors.accent);

    setThemeMode('halloween');
    expect(props.get('--color-accent')).toBe(halloweenColors.accent);
  });
});

describe('onThemeChange', () => {
  it('calls listeners once per actual change', () => {
    const listener = vi.fn();
    const stop = onThemeChange(listener);

    setThemeMode('halloween');
    expect(listener).not.toHaveBeenCalled();

    setThemeMode('day');
    setThemeMode('day');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith('day');

    setThemeMode('halloween');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith('halloween');
    stop();
  });

  it('stops calling a listener once it unsubscribes', () => {
    const listener = vi.fn();
    const stop = onThemeChange(listener);
    stop();

    setThemeMode('day');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('applyTheme', () => {
  it('copies the current colours, font and radius into CSS variables', () => {
    const { root, props } = fakeRoot();
    applyTheme(root);
    expect(props.get('--color-background')).toBe(halloweenColors.background);
    expect(props.get('--color-wood')).toBe(halloweenColors.wood);
    expect(props.get('--font-family')).toBe(theme.font.family);
    expect(props.get('--radius')).toBe(`${theme.radius}px`);

    setThemeMode('day');
    applyTheme(root);
    expect(props.get('--color-background')).toBe(dayColors.background);
  });
});
