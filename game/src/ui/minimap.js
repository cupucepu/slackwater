// The minimap: a 160 x 160 top-down view of the harbor, drawn on a 2D
// canvas every frame. Walls grey, water blue, docks in team colours,
// the core teal, bots as team dots and the player as a white dot with a
// facing tick. The HG dock (z = -33) is up, the SC dock (z = +33) down.
import { G } from '../core/state.js';
import { P, A } from '../entities/actors.js';
import { B } from '../world/world.js';
import { COL } from '../core/util.js';

const SIZE = 160, HALF = 40;
const px = x => (x + HALF) / (HALF * 2) * SIZE;
const pz = z => (z + HALF) / (HALF * 2) * SIZE;

function css(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

let ctx = null;
export function drawMinimap() {
  const c = document.getElementById('map');
  if (!c) return;
  if (!ctx) ctx = c.getContext('2d');
  // Ground.
  ctx.fillStyle = '#101c22';
  ctx.fillRect(0, 0, SIZE, SIZE);
  // Water channel.
  ctx.fillStyle = '#2a8fb0';
  ctx.fillRect(px(-7), pz(-26), px(7) - px(-7), pz(26) - pz(-26));
  // Walls / crates.
  ctx.fillStyle = '#5a6a72';
  for (const b of B) {
    ctx.fillRect(px(b.x0), pz(b.z0), px(b.x1) - px(b.x0), pz(b.z1) - pz(b.z0));
  }
  // Docks.
  for (const [z, team] of [[-33, 0], [33, 1]]) {
    ctx.fillStyle = css(COL[team]);
    ctx.beginPath();
    ctx.arc(px(0), pz(z), 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // The core, when nobody carries it.
  if (G.core && !G.core.carrier) {
    ctx.fillStyle = '#66ffe0';
    ctx.beginPath();
    ctx.arc(px(G.core.x), pz(G.core.z), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Actors: bots as team dots, the player white with a facing tick.
  for (const a of A) {
    if (a.hp <= 0) continue;
    const x = px(a.x), z = pz(a.z);
    ctx.fillStyle = a === P ? '#ffffff' : css(COL[a.team]);
    ctx.beginPath();
    ctx.arc(x, z, a === P ? 3.5 : 3, 0, Math.PI * 2);
    ctx.fill();
    if (a === P) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, z);
      // The player's yaw: forward is (-sin yaw, -cos yaw) in world xz.
      ctx.lineTo(x - Math.sin(a.yaw) * 8, z - Math.cos(a.yaw) * 8);
      ctx.stroke();
    }
  }
}
