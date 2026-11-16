// Ray / collision math. Boxes are the map colliders from world.js
// ({x0,x1,z0,z1,h}); spheres are actors (head r .21, body r .38).
import { B } from '../world/world.js';
import { cl } from './util.js';

// Ray vs axis-aligned box. Returns the entry distance, or 1e9 on a miss.
// The box stands on the ground (y from 0 to h).
export function rayBox(o, d, b) {
  let t0 = 0, t1 = 1e9;
  for (const [a, lo, hi] of [['x', b.x0, b.x1], ['y', 0, b.h], ['z', b.z0, b.z1]]) {
    if (Math.abs(d[a]) < 1e-8) { if (o[a] < lo || o[a] > hi) return 1e9; }
    else { let u = (lo - o[a]) / d[a], v = (hi - o[a]) / d[a]; if (u > v) [u, v] = [v, u]; t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) return 1e9; }
  }
  return t0;
}

// Ray vs sphere. Returns the hit distance, or 1e9 on a miss.
export function raySph(o, d, c, r) {
  const x = o.x - c.x, y = o.y - c.y, z = o.z - c.z, b = x * d.x + y * d.y + z * d.z,
    q = b * b - (x * x + y * y + z * z - r * r);
  if (q < 0) return 1e9;
  const t = -b - Math.sqrt(q);
  return t > 0 ? t : 1e9;
}

// Push a point (circle of radius r) out of every box it overlaps, so
// actors slide along walls instead of sticking to them.
export function slide(p, r) {
  for (const b of B) {
    const cx = cl(p.x, b.x0, b.x1), cz = cl(p.z, b.z0, b.z1), dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d < r) {
      if (d > 1e-4) { p.x += dx / d * (r - d); p.z += dz / d * (r - d); }
      else p.x += r;
    }
  }
}
