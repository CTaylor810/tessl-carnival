export { createRegistry, type CarnivalGame } from './registry';
export { recordScore, bestScore, topScores, createScoreBoard, type ScoreEntry } from './scores';
export { prizeFor, type PrizeTier } from './prizes';
export {
  theme,
  canvasFont,
  applyTheme,
  dayColors,
  halloweenColors,
  themeMode,
  setThemeMode,
  onThemeChange,
  type ThemeMode,
  type ThemeColors,
  type ColorName,
} from './theme';
