import { theme } from '../carnival';

const { colors } = theme;

/**
 * The midway map's Halloween night palette. Tent pumpkin oranges, ghostly
 * whites and candle golds come from the carnival theme; the moonlit sky, dark
 * grass, lantern-lit paths and other scenery shades only the map uses live
 * here. The `blue` and `pink` tent shades are a witchy purple and a slime
 * green after dark.
 */
export const palette = {
  sky: '#2c2050',
  skyHigh: '#0a0720',
  cloud: '#4b4070',
  cloudShade: '#382d5a',
  haze: '#3a3358',
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

  skins: ['#f1c27d', '#c68642', '#8d5524', '#e0ac69', '#ffdbac'],
  hairs: ['#3b2219', '#1b1035', '#a55728', '#e6c35c', '#6b4429'],
  shirts: [colors.stripeA, '#6b3fa0', '#1a1226', colors.stripeB, '#7cc94f', colors.danger],
  pants: ['#1a1226', '#2c2140', '#3b2a1f'],
  bunting: [colors.stripeA, '#1a1226', '#6b3fa0', colors.accent],
  balloons: [colors.stripeA, '#6b3fa0', '#1a1226', '#7cc94f', colors.stripeB],
} as const;
