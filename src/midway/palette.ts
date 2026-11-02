import { theme } from '../carnival';
import type { MidwayWorld } from './flip';

/**
 * The midway map's sunny daytime palette, for the right-side-up world. Tent
 * reds, creams and golds come from the carnival theme; the sky, grass, paths
 * and other scenery shades only the map uses live here.
 */
function dayPalette() {
  const { colors } = theme;
  return {
    sky: '#38b4e6',
    skyHigh: '#1f9bd6',
    cloud: '#bfeafc',
    cloudShade: '#94d8f4',
    haze: '#5fc3b8',
    sun: '#fff3b0',
    sunShade: '#ffd84a',
    sunGlow: 'rgba(255, 243, 176, 0.25)',
    moon: '#f4ecc8',
    moonShade: '#d8cc9c',
    moonGlow: 'rgba(244, 236, 200, 0.12)',

    monster: '#120a1e',
    monsterMaw: '#5a0d1c',
    monsterGlow: 'rgba(200, 30, 50, 0.18)',
    monsterTeeth: '#ffb3a1',
    spore: 'rgba(255, 90, 80, 0.75)',

    grass: '#a5c43a',
    grassDark: '#8aab2a',
    grassEdge: '#7a9a22',
    grassLight: '#b6d24c',
    path: '#f3e28e',
    pathShade: '#e2cd70',
    hedge: '#6f9a2c',
    hedgeDark: '#5a8122',
    hedgeLight: '#86b236',
    shadow: 'rgba(60, 90, 10, 0.28)',

    red: colors.stripeA,
    redShade: '#b8283a',
    cream: colors.stripeB,
    creamShade: '#e3d9c2',
    gold: colors.accent,
    goldShade: '#e0a91c',
    blue: '#2b8ccc',
    blueShade: '#1f6aa0',
    sky2: colors.water,
    pink: '#f59ac0',
    pinkShade: '#e076a4',
    wood: colors.wood,
    woodDark: '#6b4429',
    woodLight: '#b7834f',
    board: '#c8955b',
    metal: '#e9e4f2',
    metalShade: '#b9b0cc',
    ink: colors.background,
    opening: '#4a2a28',
    closed: '#a99cc4',
    closedShade: '#8a7daa',
    white: '#ffffff',
    black: '#1a1226',

    pumpkin: colors.stripeA,
    pumpkinShade: '#b8283a',
    pumpkinStem: '#4a6a2c',
    candle: colors.accent,

    bun: '#d99a4e',
    bunShade: '#a8692c',
    patty: '#5a3320',
    pattyShade: '#3d2014',
    steam: 'rgba(255, 255, 255, 0.6)',

    flipTent: '#8e5cc4',
    flipTentShade: '#6c3fa0',
    flipStripe: colors.accent,
    flipStripeShade: '#e0a91c',
    flipDoor: '#2a1a52',
    flipGlow: 'rgba(255, 204, 51, 0.3)',

    skins: ['#f1c27d', '#c68642', '#8d5524', '#e0ac69', '#ffdbac'],
    hairs: ['#3b2219', '#1b1035', '#a55728', '#e6c35c', '#6b4429'],
    shirts: [colors.water, '#7bd389', '#b48ee0', colors.danger, '#2b8ccc', colors.stripeB],
    pants: ['#2d3a6b', '#3b2a4f', '#5a4a3a'],
    bunting: [colors.stripeA, colors.accent, '#2b8ccc', colors.stripeB],
    balloons: [colors.stripeA, colors.accent, '#2b8ccc', colors.water, '#f59ac0'],
  };
}

export type Palette = ReturnType<typeof dayPalette>;

/**
 * The midway map's Halloween night palette, for the upside-down world. Tent
 * pumpkin oranges, ghostly whites and candle golds come from the carnival
 * theme; the moonlit sky, dark grass, lantern-lit paths and other scenery
 * shades only the map uses live here. The `blue` and `pink` tent shades are a
 * witchy purple and a slime green after dark.
 */
function upsideDownPalette(): Palette {
  const { colors } = theme;
  return {
    sky: '#2c2050',
    skyHigh: '#0a0720',
    cloud: '#4b4070',
    cloudShade: '#382d5a',
    haze: '#3a3358',
    sun: '#fff3b0',
    sunShade: '#ffd84a',
    sunGlow: 'rgba(255, 243, 176, 0.25)',
    moon: '#f4ecc8',
    moonShade: '#d8cc9c',
    moonGlow: 'rgba(244, 236, 200, 0.12)',

    monster: '#120a1e',
    monsterMaw: '#5a0d1c',
    monsterGlow: 'rgba(200, 30, 50, 0.18)',
    monsterTeeth: '#ffb3a1',
    spore: 'rgba(255, 90, 80, 0.75)',

    grass: '#2d4228',
    grassDark: '#1f311c',
    grassEdge: '#1a2a17',
    grassLight: '#36502f',
    path: '#d9a95e',
    pathShade: '#b88a44',
    hedge: '#22402a',
    hedgeDark: '#16301d',
    hedgeLight: '#2e5236',
    shadow: 'rgba(8, 2, 20, 0.4)',

    red: colors.stripeA,
    redShade: '#c9500f',
    cream: colors.stripeB,
    creamShade: '#cfc7d9',
    gold: colors.accent,
    goldShade: '#d98a10',
    blue: '#6b3fa0',
    blueShade: '#4b2a75',
    sky2: colors.water,
    pink: '#7cc94f',
    pinkShade: '#5c9a36',
    wood: colors.wood,
    woodDark: '#432a1c',
    woodLight: '#8f6043',
    board: '#9a6c48',
    metal: '#ddd6ea',
    metalShade: '#9d93b3',
    ink: colors.background,
    opening: '#1a0e1c',
    closed: '#5f5479',
    closedShade: '#473e60',
    white: '#ffffff',
    black: '#1a1226',

    pumpkin: colors.stripeA,
    pumpkinShade: '#c9500f',
    pumpkinStem: '#4a6a2c',
    candle: colors.accent,

    bun: '#d99a4e',
    bunShade: '#a8692c',
    patty: '#5a3320',
    pattyShade: '#3d2014',
    steam: 'rgba(244, 236, 200, 0.5)',

    flipTent: '#2a1a2e',
    flipTentShade: '#1a0f1e',
    flipStripe: '#5a0d1c',
    flipStripeShade: '#3d0812',
    flipDoor: '#ff2a3a',
    flipGlow: 'rgba(255, 40, 60, 0.3)',

    skins: ['#f1c27d', '#c68642', '#8d5524', '#e0ac69', '#ffdbac'],
    hairs: ['#3b2219', '#1b1035', '#a55728', '#e6c35c', '#6b4429'],
    shirts: [colors.stripeA, '#6b3fa0', '#1a1226', colors.stripeB, '#7cc94f', colors.danger],
    pants: ['#1a1226', '#2c2140', '#3b2a1f'],
    bunting: [colors.stripeA, '#1a1226', '#6b3fa0', colors.accent],
    balloons: [colors.stripeA, '#6b3fa0', '#1a1226', '#7cc94f', colors.stripeB],
  };
}

/** Builds each world's palette from the carnival theme as it is right now. */
export const palettes: Record<MidwayWorld, () => Palette> = {
  'right-side-up': dayPalette,
  'upside-down': upsideDownPalette,
};

/** The palette the map draws with. `usePalette` updates it in place. */
export const palette: Palette = dayPalette();

/**
 * Switches the map to a world's palette. Call it after `setThemeMode`, so the
 * entries that come from the theme pick up the new mode's colours.
 */
export function usePalette(world: MidwayWorld) {
  Object.assign(palette, palettes[world]());
}
