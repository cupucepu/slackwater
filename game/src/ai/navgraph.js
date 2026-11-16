// Bot navigation graph: waypoints on an 8 m grid over the harbor, kept
// only where a bot can stand (clear of the colliders), linked where the
// straight line between two neighbours is clear. Bots ask findPath for
// a Dijkstra route to their goal instead of steering straight at it —
// so they walk around crates and walls instead of getting stuck on them.
// Edge cost is distance plus a wading penalty from the CURRENT tide, so
// at HIGH tide the route avoids the deep channel and at LOW tide it cuts
// straight through it.
import { B, gh, water } from '../world/world.js';
import { rayBox } from '../core/math.js';

const STEP = 8, EXT = 32;

function clearOfWalls(x, z) {
  for (const b of B) {
    if (x > b.x0 - 1.2 && x < b.x1 + 1.2 && z > b.z0 - 1.2 && z < b.z1 + 1.2) return false;
  }
  return true;
}

const nodes = [];
for (let x = -EXT; x <= EXT; x += STEP) {
  for (let z = -EXT; z <= EXT; z += STEP) {
    if (clearOfWalls(x, z)) nodes.push({ x, z, id: nodes.length, next: [] });
  }
}

// A straight segment at bot height (y=1) is blocked when a wall's ray
// entry is nearer than the far end.
function segmentBlocked(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
  const o = { x: a.x, y: 1, z: a.z }, d = { x: dx / L, y: 0, z: dz / L };
  for (const box of B) if (rayBox(o, d, box) < L) return true;
  return false;
}

for (const n of nodes) {
  for (const m of nodes) {
    if (m.id <= n.id) continue;
    const d = Math.hypot(m.x - n.x, m.z - n.z);
    if (d > 12) continue;
    if (segmentBlocked(n, m)) continue;
    n.next.push(m.id);
    m.next.push(n.id);
  }
}

function nearest(x, z) {
  let best = nodes[0], bd = 1e9;
  for (const n of nodes) {
    const d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

// Cost of walking an edge: its length, doubled per metre of water depth
// at its middle (the tide decides how deep the channel is right now).
function edgeCost(a, b) {
  const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
  const depth = Math.max(0, water.position.y - gh(mx, mz));
  return Math.hypot(b.x - a.x, b.z - a.z) * (1 + depth * 2);
}

// Dijkstra from (fx,fz) to (tx,tz). Returns waypoints from the first node
// after the start to the exact goal. Falls back to a straight line when
// the goal is unreachable on the graph.
export function findPath(fx, fz, tx, tz) {
  const start = nearest(fx, fz), goal = nearest(tx, tz);
  const dist = new Map([[start.id, 0]]), prev = new Map(), done = new Set();
  const open = [start];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      if ((dist.get(open[i].id) ?? 1e9) < (dist.get(open[bi].id) ?? 1e9)) bi = i;
    }
    const cur = open.splice(bi, 1)[0];
    if (done.has(cur.id)) continue;
    done.add(cur.id);
    if (cur.id === goal.id) break;
    for (const nid of cur.next) {
      const nb = nodes[nid];
      const nd = (dist.get(cur.id) ?? 1e9) + edgeCost(cur, nb);
      if (nd < (dist.get(nid) ?? 1e9)) {
        dist.set(nid, nd);
        prev.set(nid, cur.id);
        open.push(nb);
      }
    }
  }
  if (!prev.has(goal.id) && goal.id !== start.id) return [{ x: tx, z: tz }];
  const path = [];
  let id = goal.id;
  while (id !== start.id) {
    path.unshift(nodes[id]);
    id = prev.get(id);
  }
  // Finish at the exact goal, unless the last node already is the goal.
  const last = path[path.length - 1];
  if (!last || Math.hypot(last.x - tx, last.z - tz) > 0.01) path.push({ x: tx, z: tz });
  return path;
}

export function navInfo() {
  return {
    nodes: nodes.length,
    edges: nodes.reduce((s, n) => s + n.next.length, 0) / 2,
  };
}
