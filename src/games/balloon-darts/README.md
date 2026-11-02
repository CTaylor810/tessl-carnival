# Balloon Darts

Balloons drift up the board. Throw darts to pop them before they float away.

## How to play

- A round gives you 10 darts.
- Balloons appear at the bottom of the board at random spots and drift
  upwards, swaying gently from side to side. Small balloons rise fastest and
  large ones slowest. A balloon that rises past the top floats away.
- Move the mouse to aim the crosshair, and click to throw a dart. It lands
  straight away, right under the crosshair, and pops every balloon there.
- The round ends when you throw your 10th dart. Click again to play another
  round.

## Scoring

- Small balloon: 30 points. Medium: 20. Large: 10.
- A dart that pops two or more overlapping balloons scores double: a small and
  a large together score `(30 + 10) * 2 = 80`.
- A dart that misses scores nothing, and still counts as thrown.

Your score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `step`, `spawnBalloon`, `throwDart`,
  `scoreForDart`, `isHit`, `seededRandom`) and the `balloonDarts` entry, the
  default export the midway finds.
- `game.test.ts`: tests for the game logic.
