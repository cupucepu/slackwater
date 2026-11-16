// The one shared mutable game state. Every module reads and writes the
// same object, so a round, a bot and the HUD never disagree about it.
// core: {x, z, carrier} — the glowing core, or null before the first round.
// ph: {n, t, msg?} — the phase: 'freeze' (buy), 'live', 'end', 'over'.
// rd: round index (0-based). tide: index into TIDES. T: seconds elapsed.
// kick: gun recoil (0..1). playing: pointer is locked. sc: [HG, SC] wins.
// fx: live tracer lines. feedL: last kill-feed lines. keys/mouse: input.
export const G = {
  core: null,
  ph: { n: 'freeze', t: 6 },
  rd: -1,
  tide: 1,
  T: 0,
  kick: 0,
  playing: false,
  sc: [0, 0],
  fx: [],
  feedL: [],
  keys: {},
  mouse: 0,
  board: false, // scoreboard held open (Tab)
};
