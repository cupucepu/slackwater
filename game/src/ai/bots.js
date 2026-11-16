// Bot brains. A bot always has a goal: carry the core home if it holds
// it, chase the core (or its carrier) otherwise, or investigate a noise
// it heard. When it sees an enemy it strafes and fires in bursts; when
// it gets stuck on a wall it sidesteps. Water slows it, like the player.
import * as THREE from 'three';
import { G } from '../core/state.js';
import { A, los, noise, hurt } from '../entities/actors.js';
import { tracer } from '../fx/fx.js';
import { boom } from '../audio/audio.js';
import { slide } from '../core/math.js';
import { water, gh } from '../world/world.js';
import { COL, rnd } from '../core/util.js';
import { findPath } from './navgraph.js';

// The next waypoint on the bot's route to (gx,gz). Re-paths when there is
// no route, it is stale (>1.5 s), or the goal moved. The bot walks the
// waypoints in order, and steers straight at the goal once it is close.
function nextWaypoint(b, gx, gz, dt) {
  if (!b.path || !b.pathGoal || b.pathAge > 1.5 || Math.hypot(b.pathGoal.x - gx, b.pathGoal.z - gz) > 4) {
    b.path = findPath(b.x, b.z, gx, gz);
    b.pathGoal = { x: gx, z: gz };
    b.pathAge = 0;
  }
  b.pathAge += dt;
  while (b.path.length && Math.hypot(b.path[0].x - b.x, b.path[0].z - b.z) < 1.5) b.path.shift();
  if (Math.hypot(gx - b.x, gz - b.z) < 4) return { x: gx, z: gz };
  return b.path.length ? b.path[0] : { x: gx, z: gz };
}

export function bot(b, dt) {
  b.cd -= dt; b.ht -= dt;
  let tgt = null, td = 99;
  for (const e of A) {
    if (e.hp <= 0 || e.team === b.team) continue;
    const d = Math.hypot(e.x - b.x, e.z - b.z);
    if (d < td && d < 38 && los(b, e)) { tgt = e; td = d; }
  }
  b.seen = tgt ? b.seen + dt : 0;
  let gx, gz;
  const c = G.core.carrier;
  if (c === b) { gx = 0; gz = b.team ? 33 : -33; }
  else if (!c) { gx = G.core.x; gz = G.core.z; }
  else { gx = c.x; gz = c.z; }
  if (b.ht > 0 && c !== b && !tgt) { gx = b.hear.x; gz = b.hear.z; }
  // Route around walls via the navgraph whenever the bot is walking to
  // its goal (not strafing in combat, and the carrier too — it walks home
  // while facing its enemy).
  if (!(tgt && c !== b)) { const wp = nextWaypoint(b, gx, gz, dt); gx = wp.x; gz = wp.z; }
  let dx = gx - b.x, dz = gz - b.z, L = Math.hypot(dx, dz) || 1, mx = dx / L, mz = dz / L, sp = 4.2;
  if (tgt) {
    const tx = (tgt.x - b.x) / td, tz = (tgt.z - b.z) / td,
      st = Math.sin(G.T * 1.3 + b.t * 2) > 0 ? 1 : -1;
    b.yaw = Math.atan2(-tx, -tz);
    if (c !== b) {
      mx = -tz * st * .8 + (td > 14 ? tx * .5 : 0);
      mz = tx * st * .8 + (td > 14 ? tz * .5 : 0);
      sp = 2.4;
    }
  }
  else if (L > .5) b.yaw = Math.atan2(-mx, -mz);
  else sp = 0;
  if (b.dodge) {
    const s = Math.sign(b.dodge);
    [mx, mz] = [-mz * s, mx * s];
    b.dodge -= s * dt;
    if (Math.abs(b.dodge) < .05) b.dodge = 0;
  }
  const depth = Math.max(0, water.position.y - gh(b.x, b.z));
  sp *= 1 - .5 * Math.min(depth, 1.5) / 1.5;
  const ox = b.x, oz = b.z;
  b.x += mx * sp * dt; b.z += mz * sp * dt;
  slide(b, .4);
  if (sp > 0 && Math.hypot(b.x - ox, b.z - oz) < sp * dt * .3) {
    b.stuck += dt;
    if (b.stuck > .4) { b.dodge = .8 * (rnd() < .5 ? 1 : -1); b.stuck = 0; }
  } else b.stuck = 0;
  b.y = gh(b.x, b.z);
  if (tgt && b.seen > .4 && b.cd <= 0) {
    b.cd = .16 + rnd() * .1;
    boom(b, .2, .1, 1500);
    noise(b, 30);
    const o = { x: b.x, y: b.y + 1.5, z: b.z },
      dd = new THREE.Vector3(tgt.x - b.x, tgt.y + 1.3 - o.y, tgt.z - b.z).normalize();
    tracer(new THREE.Vector3(o.x, o.y - .2, o.z), new THREE.Vector3(o.x + dd.x * td, o.y + dd.y * td, o.z + dd.z * td), COL[b.team]);
    if (rnd() < Math.max(.1, .6 - td * .014)) hurt(tgt, 13, b);
  }
}
