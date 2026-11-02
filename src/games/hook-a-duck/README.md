# Hook a Duck

Rubber ducks float round a water channel. Hook as many as you can before time runs out.

## How to play

- The hook hangs from a rod at the top and follows the mouse left and right.
- Hold the mouse button down to lower the hook; let go to raise it.
- Each duck has a hook loop on its back. A duck is caught when the hook's tip is
  inside its loop as the hook rises past it. Lower the hook below a loop, then
  let go to lift the duck out.
- You can carry one duck at a time: the hook has to reach the top before it can
  catch another.
- About 8 ducks float left to right, wrapping round to the left when they leave
  the right edge. A caught duck is lifted out and a new duck enters from the left.
- A round lasts 45 seconds, shown as a countdown. When it hits 0 the round ends;
  click to play again.

## Scoring

Each duck has a number painted on its back: 1, 2 or 3. A duck scores 10 points
times its number:

| Number | Chance | Points |
| ------ | ------ | ------ |
| 1      | 50%    | 10     |
| 2      | 35%    | 20     |
| 3      | 15%    | 30     |

Your score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `step`, `moveHook`, `setHookDown`, `hooks`,
  `duckValue`, `scoreForDuck`) and the `hookADuck` entry, the default export the midway finds.
  `createState` takes a random source, so tests can make the ducks' numbers predictable.
- `game.test.ts`: tests for the game logic.
