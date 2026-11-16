// Actors: the player and the five bots, and everything that happens
// when a shot is fired — line of sight, hits, deaths, the kill feed.
import * as THREE from 'three';
import { G } from '../core/state.js';
import { W, COL, TN } from '../core/util.js';
import { S, B } from '../world/world.js';
import { rayBox, raySph } from '../core/math.js';
import { tracer, smoke } from '../fx/fx.js';

// The player. y is ground height (gh), vy vertical speed; yaw/pit look;
// money/own/cur the economy; ammo per weapon {m: magazine, r: reserve}.
export const P = {
  team: 0, isP: 1, hp: 100, x: 0, y: 0, z: -34, vy: 0, yaw: Math.PI, pit: 0,
  money: 800, own: [0], cur: 0, ammo: W.map(w => ({ m: w.mag, r: w.res })),
  cd: 0, rl: 0, held: 0, hurt: 0, step: 0, died: 0, mv: 0, kills: 0,
};

function mkBot(team, t) {
  const g = new THREE.Group(),
    m = new THREE.MeshStandardMaterial({ color: COL[team], roughness: .6 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .9, 4, 8), m),
    head = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), new THREE.MeshStandardMaterial({ color: 0xe8d8c8 })),
    gn = new THREE.Mesh(new THREE.BoxGeometry(.07, .09, .55), new THREE.MeshStandardMaterial({ color: 0x151a1d }));
  body.position.y = .8; head.position.y = 1.62; gn.position.set(.3, 1.1, -.3);
  g.add(body, head, gn);
  S.add(g);
  // hear/ht: a noise the bot heard (position) and how long it remembers it.
  // stuck/dodge: the stuck-avoidance sidestep. seen: seconds the target
  // has been continuously visible. path/pathGoal/pathAge: the navgraph
  // route the bot is following, its goal, and how stale it is.
  return {
    team, t, hp: 100, x: 0, y: 0, z: 0, yaw: 0, g,
    cd: 0, seen: 0, hear: null, ht: 0, stuck: 0, dodge: 0,
    path: null, pathGoal: null, pathAge: 0, kills: 0,
  };
}

// 3v3: the player + 2 Harbor Guard bots vs 3 Salvage Crew bots.
export const A = [P, mkBot(0, 1), mkBot(0, 2), mkBot(1, 1), mkBot(1, 2), mkBot(1, 3)];

export const name = a => a === P ? 'YOU' : TN[a.team] + '-' + a.t;

export function feed(s) {
  G.feedL.push(s);
  if (G.feedL.length > 5) G.feedL.shift();
}

// A sound at src heard by every live enemy bot within rad metres — they
// turn toward it for 3 seconds. Gunfire is loud (30-35 m), footsteps
// quiet (9 m, 20 m splashing in water).
export function noise(src, rad) {
  for (const b of A)
    if (b !== P && b.hp > 0 && b.team !== src.team && Math.hypot(b.x - src.x, b.z - src.z) < rad) {
      b.hear = { x: src.x, z: src.z };
      b.ht = 3;
    }
}

export function hurt(e, dmg, src) {
  if (e.hp <= 0) return;
  e.hp -= dmg;
  if (e === P) P.hurt = .3;
  if (e.hp <= 0) die(e, src);
}

function die(e, src) {
  e.hp = 0;
  if (src) src.kills++;
  smoke(e.x, e.y, e.z);
  if (G.core.carrier === e) { G.core.carrier = null; G.core.x = e.x; G.core.z = e.z; }
  feed(name(src) + '  ▸  ' + name(e));
  if (src === P) { P.money += 300; }
  if (e === P) P.died = 1;
}

// One hitscan pellet: nearest wall or enemy body along d from o.
// Headshots (the .21 sphere) deal 2.5x. Draws the tracer either way.
export function hitscan(o, d, dmg, src, col) {
  let tw = 1e9;
  for (const b of B) tw = Math.min(tw, rayBox(o, d, b));
  let best = null, bt = tw, head = 0;
  for (const e of A) {
    if (e === src || e.hp <= 0 || e.team === src.team) continue;
    const h = raySph(o, d, { x: e.x, y: e.y + 1.62, z: e.z }, .21),
      t = Math.min(raySph(o, d, { x: e.x, y: e.y + 1.1, z: e.z }, .38), raySph(o, d, { x: e.x, y: e.y + .5, z: e.z }, .38)),
      m = Math.min(h, t);
    if (m < bt) { bt = m; best = e; head = h < t; }
  }
  if (best) hurt(best, dmg * (head ? 2.5 : 1), src);
  const L = Math.min(bt, 60), s = new THREE.Vector3(o.x, o.y - .12, o.z);
  tracer(s, new THREE.Vector3(o.x + d.x * L, o.y + d.y * L, o.z + d.z * L), col);
}

// True when nothing (no wall) stands between a's eyes and e's chest.
export function los(a, e) {
  const o = { x: a.x, y: a.y + 1.5, z: a.z }, dx = e.x - a.x, dy = e.y + 1.3 - o.y, dz = e.z - a.z,
    L = Math.hypot(dx, dy, dz), d = { x: dx / L, y: dy / L, z: dz / L };
  for (const b of B) if (rayBox(o, d, b) < L) return false;
  return true;
}
