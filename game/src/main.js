// SLACKWATER — boot. Wires input, starts the first round, runs the
// frame loop. The game itself lives in the modules under src/; this file
// only starts it. See README.md for the full picture.
import { $ , W, SHOT, TIDES, cl } from './core/util.js';
import { G } from './core/state.js';
import { P } from './entities/actors.js';
import { R, S, cam, water, gh } from './world/world.js';
import { initAudio } from './audio/audio.js';
import { newRound, step } from './match/rounds.js';
import './debug/debug.js';

// ---- input
addEventListener('keydown', e => {
  G.keys[e.code] = 1;
  if (e.code === 'Tab') { e.preventDefault(); G.board = true; }
  if (e.code === 'KeyR') {
    const w = W[P.cur], a = P.ammo[P.cur];
    if (a.m < w.mag && a.r > 0 && P.rl <= 0) P.rl = w.rl;
  }
  if (/^Digit[1-4]$/.test(e.code)) {
    const i = +e.code.slice(5) - 1;
    if (!P.own.includes(i) && G.ph.n === 'freeze' && P.money >= W[i].cost) {
      P.money -= W[i].cost;
      P.own.push(i);
    }
    if (P.own.includes(i)) { P.cur = i; P.rl = 0; }
  }
});
addEventListener('keyup', e => { G.keys[e.code] = 0; if (e.code === 'Tab') G.board = false; });
addEventListener('mousedown', () => G.mouse = 1);
addEventListener('mouseup', () => G.mouse = 0);
addEventListener('mousemove', e => {
  if (document.pointerLockElement) {
    P.yaw -= e.movementX * .0022;
    P.pit = cl(P.pit - e.movementY * .0022, -1.4, 1.4);
  }
});
addEventListener('resize', () => {
  R.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
});
$('click').onclick = () => { initAudio(); R.domElement.requestPointerLock(); };
document.addEventListener('pointerlockchange', () => {
  G.playing = !!document.pointerLockElement;
  $('click').style.display = G.playing ? 'none' : 'flex';
});

// ---- boot
newRound();
if (SHOT) {
  const p = [[-9, -27.5, Math.PI - .35, -.12], [0, -28, Math.PI, -.28], [0, -12, Math.PI, -.1], [-10, 10, -.9, 0]][SHOT - 1] || [0, -30, Math.PI, 0];
  [P.x, P.z, P.yaw, P.pit] = p;
  P.y = gh(P.x, P.z);
  water.position.y = TIDES[G.tide].y;
  G.ph = { n: 'live', t: 75 };
  $('click').style.display = 'none';
}

// dt is clamped to [0, 0.05]: never negative (a backwards frame-clock
// would otherwise inflate every cooldown) and never a huge step.
let last = performance.now();
(function loop(n) {
  requestAnimationFrame(loop);
  const dt = Math.max(0, Math.min((n - last) / 1000, .05));
  last = n;
  if (G.playing || SHOT) step(dt);
  R.render(S, cam);
})(last);
