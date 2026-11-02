# Strongman Bell

Test your strength: swing the mallet and send the puck up the tower to ring the bell.

## How to play

- The power meter beside the tower moves up and down between empty and full.
- Click the game to swing the mallet. The puck climbs as high as the meter was
  when you clicked, pauses at the top, then falls back to the base.
- You can't swing again until the puck is back at the base.
- The meter gets a little faster after every swing, so later swings are harder.
- A round is 5 swings. It ends when the 5th puck lands; click again to play
  another round.

## Scoring

- A swing scores its power out of 100: `Math.round(power * 100)`, from 0 to 100.
- Power of 0.95 or more (the red band at the top of the meter) rings the bell,
  shows "DING!" and scores 150: 100 plus a 50 point bonus.
- The round's score is the sum of the 5 swings, from 0 to 750.

Your score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `swing`, `step`, `moveMeter`, `meterSpeed`,
  `scoreForSwing`, `rings`) and the `strongmanBell` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
