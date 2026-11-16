// Shared constants and tiny helpers for SLACKWATER.
// Pure: nothing here touches the scene or the game state.
export const $ = id => document.getElementById(id);
export const Q = new URLSearchParams(location.search);
export const SHOT = +Q.get('shot') || 0;

// In ?shot= staging the random stream is seeded (deterministic renders);
// in a real game it is Math.random().
let sd = 7;
export const rnd = () => SHOT ? ((sd = sd * 16807 % 2147483647) / 2147483647) : Math.random();
export const cl = (v, a, b) => Math.min(b, Math.max(a, v));

// Tide levels (water height in the basin channel) and team colours.
export const TIDES = [{ n: 'LOW', y: -1.45 }, { n: 'MID', y: -.8 }, { n: 'HIGH', y: -.15 }];
export const COL = [0xffb347, 0xe0457b];
export const TN = ['HG', 'SC'];

// Weapons: name, price, damage, seconds between shots, spread, magazine,
// reserve, full-auto, pellets per shot, reload seconds.
export const W = [
  { n: 'Pier .9', cost: 0, dmg: 24, rate: .28, spr: .012, mag: 12, res: 48, auto: 0, pel: 1, rl: 1.2 },
  { n: 'Gull SMG', cost: 1200, dmg: 15, rate: .075, spr: .03, mag: 30, res: 90, auto: 1, pel: 1, rl: 1.6 },
  { n: 'Tern AR', cost: 2700, dmg: 28, rate: .1, spr: .014, mag: 30, res: 90, auto: 1, pel: 1, rl: 2 },
  { n: 'Brine 12', cost: 1800, dmg: 11, rate: .8, spr: .07, mag: 6, res: 24, auto: 0, pel: 8, rl: 2.4 },
];
