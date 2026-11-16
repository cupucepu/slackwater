// The player: WASD movement, jumping, water drag, footsteps that make
// noise, and firing / reloading the current weapon. Only runs while the
// round is live (and only moves while the round is live).
import * as THREE from 'three';
import { G } from '../core/state.js';
import { W, cl, rnd } from '../core/util.js';
import { P, hitscan, noise } from './actors.js';
import { boom } from '../audio/audio.js';
import { slide } from '../core/math.js';
import { cam, water, gh } from '../world/world.js';

export function movePlayer(dt) {
  const k = G.keys, live = G.ph.n === 'live',
    f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0),
    depth = Math.max(0, water.position.y - gh(P.x, P.z));
  let sp = (k.ShiftLeft ? 2.6 : 5.2) * (1 - .5 * Math.min(depth, 1.5) / 1.5);
  if (!live) sp = 0;
  const l = Math.hypot(f, s) || 1, sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  P.mv = sp > 3 && (f || s);
  P.x += (-sy * f + cy * s) / l * sp * dt;
  P.z += (-cy * f - sy * s) / l * sp * dt;
  slide(P, .4);
  P.x = cl(P.x, -37, 37); P.z = cl(P.z, -37, 37);
  const g = gh(P.x, P.z);
  P.vy -= 22 * dt; P.y += P.vy * dt;
  if (P.y <= g) { P.y = g; P.vy = 0; if (k.Space && live) P.vy = 7; }
  if (P.mv && P.y <= g + .05) {
    P.step -= dt;
    if (P.step <= 0) { P.step = .42; noise(P, depth > .1 ? 20 : 9); if (depth > .1) boom(P, .12, .18, 2500); }
  }
  P.cd -= dt;
  const w = W[P.cur], am = P.ammo[P.cur];
  if (P.rl > 0) {
    P.rl -= dt;
    if (P.rl <= 0) { const n = Math.min(w.mag - am.m, am.r); am.m += n; am.r -= n; }
  }
  else if (live && G.mouse && P.cd <= 0 && (w.auto || !P.held)) {
    if (am.m > 0) {
      am.m--; P.cd = w.rate; G.kick = 1; boom(P, .4, .14, 1800); noise(P, 35);
      const o = cam.position.clone(), fw = new THREE.Vector3();
      cam.getWorldDirection(fw);
      for (let i = 0; i < w.pel; i++) {
        const q = w.spr * (P.mv ? 2 : 1);
        hitscan(o, fw.clone().add(new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).multiplyScalar(q * 2)).normalize(), w.dmg, P, 0xfff2b0);
      }
    }
    else if (am.r > 0) P.rl = w.rl;
  }
  P.held = G.mouse;
}
