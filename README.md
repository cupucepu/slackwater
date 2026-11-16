# SLACKWATER — a tactical FPS at the harbor

[![make.fun · threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![rank](https://make.fun/badge/threejs-fps-02/cupucepu/slackwater/rank.svg)](https://make.fun/bounty/threejs-fps-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![reward](https://make.fun/badge/threejs-fps-02/cupucepu/slackwater/reward.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)

Built for the [threejs-fps-02 bounty on make.fun](https://make.fun/bounty/threejs-fps-02) — a round-based tactical shooter in the style Counter-Strike made famous,
built on three.js 0.187.0 (vendored, no build step, no network). You are
**Harbor Guard** — grab the glowing core from the basin and carry it to
your dock, or eliminate the **Salvage Crew**. The tide rises and falls
every round, flooding the channel and slowing the wade. First to 5
rounds takes the harbor.

## How to play

Serve `game/` with any static server (`node serve.ts`, then open
http://localhost:8080) and click to play. Single-player against bots
(3v3: you + 2 Harbor Guard bots vs 3 Salvage Crew bots).

| Input | Action |
|---|---|
| W A S D | Move |
| Mouse | Look (pointer lock) |
| Click | Fire |
| R | Reload |
| Shift | Walk slow |
| Space | Jump |
| 1–4 | Buy / switch weapon (buy phase) |

## The game

- **Rounds**: 6 s buy phase, then a 75 s live round. Win by carrying
  the core to your dock, by eliminating the enemy team, or on time.
  First to 5 round wins.
- **Tide**: LOW / MID / HIGH water in the basin channel, a different
  level each round. Wading through water slows you down.
- **Economy**: $800 to start, +$300 per kill, +$1,800 for a round win,
  +$1,100 for a loss or a draw.
- **Weapons**: Pier .9 (free), Gull SMG ($1,200), Tern AR ($2,700),
  Brine 12 shotgun ($1,800, 8 pellets). Headshots deal 2.5×.
- **Bots**: waypoint routes through the harbor, they chase the core,
  carry it home, strafe while shooting, dodge when stuck, and react
  to the sound of gunfire.
- **The map**: an original harbor yard — a dredged basin channel,
  docks, crates, silos and salt piles. All art is procedural geometry
  and canvas textures; all sounds are synthesised in Web Audio.

## Layout

- `game/` — the playable game (static files, ES modules)
- `game/src/` — one module per job (see below)
- `game/vendor/three/` — three.js 0.187.0, byte for byte from npm
- `screenshots/` — real renders of the game in Chrome
- `main.ts` — the hand-in program (copies `game/` + `screenshots/`,
  writes `dossier.json`)
- `serve.ts` — local static server for development

## License

MIT. See `LICENSE`.
