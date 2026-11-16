// Rounds and the per-frame step. A round is: 6 s buy freeze, 75 s live,
// then the end banner and the next round. First team to 5 round wins
// takes the match. The tide changes every round (LOW / MID / HIGH).
import { G } from '../core/state.js';
import { P, A, name, feed } from '../entities/actors.js';
import { W, TIDES, SHOT } from '../core/util.js';
import { bot } from '../ai/bots.js';
import { movePlayer } from '../entities/player.js';
import { updateHud } from '../ui/hud.js';
import { updateFx, flare } from '../fx/fx.js';
import { water, coreMesh, cam, gun, gh } from '../world/world.js';

export function newRound() {
  if (P.died) { P.own = [0]; P.cur = 0; P.died = 0; }
  G.rd++;
  G.tide = SHOT ? ([2, 0, 1, 2][SHOT - 1] ?? 1) : G.rd % 3;
  P.hp = 100; P.hurt = 0; P.pit = 0;
  P.ammo.forEach((a, i) => { a.m = W[i].mag; a.r = W[i].res; });
  const c = [0, 0];
  for (const a of A) {
    const k = c[a.team]++;
    Object.assign(a, {
      x: (k - 1) * 6, z: a.team ? 34 : -34, y: 0, hp: 100, vy: 0, yaw: a.team ? 0 : Math.PI,
      hear: null, ht: 0, dodge: 0, stuck: 0, seen: 0,
      path: null, pathGoal: null, pathAge: 0,
    });
  }
  G.core = { x: 0, z: 0, carrier: null };
  G.ph = { n: 'freeze', t: 6 };
  if (G.rd === 0) water.position.y = TIDES[G.tide].y;
}

export function endRound(win, why) {
  if (G.ph.n !== 'live') return;
  G.ph = { n: 'end', t: 4.5 };
  if (win >= 0) { G.sc[win]++; P.money += win === 0 ? 1800 : 1100; }
  else P.money += 1100;
  if (why === 'CORE DELIVERED') flare(0, 1, win === 0 ? -33 : 33);
  const L = win < 0 ? 'DRAW — ' + why : (win === 0 ? 'HARBOR GUARD' : 'SALVAGE CREW') + ' — ' + why;
  G.ph.msg = L;
  if (G.sc[0] >= 5 || G.sc[1] >= 5) {
    G.ph = {
      n: 'over', t: 1e9,
      msg: (G.sc[0] >= 5 ? 'MATCH WON' : 'MATCH LOST') + '\n[ reload to play again ]',
    };
  }
}

export function step(dt) {
  G.T += dt;
  G.ph.t -= dt;
  if (G.ph.n === 'freeze' && G.ph.t <= 0) G.ph = { n: 'live', t: 75 };
  else if (G.ph.n === 'live' && G.ph.t <= 0) endRound(-1, 'TIME');
  else if (G.ph.n === 'end' && G.ph.t <= 0) newRound();
  water.position.y += (TIDES[G.tide].y - water.position.y) * Math.min(dt * .8, 1);
  water.material.opacity = .7 + Math.sin(G.T * 2) * .03;
  if (P.hp > 0) movePlayer(dt);
  for (const b of A)
    if (b !== P) {
      if (b.hp > 0 && G.ph.n === 'live') bot(b, dt);
      b.g.visible = b.hp > 0;
      b.g.position.set(b.x, b.y, b.z);
      b.g.rotation.y = b.yaw;
    }
  if (G.ph.n === 'live') {
    const al = [0, 0];
    for (const a of A) if (a.hp > 0) al[a.team]++;
    if (!al[0]) endRound(1, 'ELIMINATION');
    else if (!al[1]) endRound(0, 'ELIMINATION');
    if (!G.core.carrier) {
      for (const a of A)
        if (a.hp > 0 && Math.hypot(a.x - G.core.x, a.z - G.core.z) < 1.3) {
          G.core.carrier = a;
          feed('CORE TAKEN  ▸  ' + name(a));
          break;
        }
    } else {
      const c = G.core.carrier;
      G.core.x = c.x; G.core.z = c.z;
      if (Math.hypot(c.x, c.z - (c.team ? 33 : -33)) < 3) endRound(c.team, 'CORE DELIVERED');
    }
  }
  const c = G.core.carrier;
  coreMesh.position.set(G.core.x, c ? c.y + 2.1 : gh(G.core.x, G.core.z) + 1 + Math.sin(G.T * 2) * .1, G.core.z);
  coreMesh.rotation.y = G.T * 2;
  updateFx(dt);
  cam.position.set(P.x, P.y + (P.hp > 0 ? 1.65 : .4), P.z);
  cam.rotation.set(P.pit, P.yaw, 0, 'YXZ');
  G.kick = Math.max(0, G.kick - dt * 8);
  gun.position.z = -.5 + G.kick * .07;
  P.hurt = Math.max(0, P.hurt - dt);
  updateHud();
}
