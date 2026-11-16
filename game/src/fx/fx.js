// Short-lived effects: tracer lines, smoke puffs and flares. Everything
// here is created, aged and disposed by updateFx (once per frame).
import * as THREE from 'three';
import { G } from '../core/state.js';
import { S } from '../world/world.js';

// A soft radial puff, shared by every smoke sprite (never disposed).
let puffTex = null;
function getPuffTex() {
  if (puffTex) return puffTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,.85)');
  grad.addColorStop(.6, 'rgba(255,255,255,.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  puffTex = new THREE.CanvasTexture(c);
  return puffTex;
}

export function tracer(a, b, c) {
  const l = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([a, b]),
    new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .9 }));
  S.add(l);
  G.fx.push({ o: l, t: .06, life: .06, kind: 'tracer' });
}

// A grey smoke puff where someone died: grows and fades over 1.2 s.
export function smoke(x, y, z) {
  const m = new THREE.SpriteMaterial({
    map: getPuffTex(), color: 0x9aa8a4, transparent: true, opacity: .5, depthWrite: false,
  });
  const s = new THREE.Sprite(m);
  s.position.set(x, y + .8, z);
  s.scale.setScalar(.6);
  S.add(s);
  G.fx.push({ o: s, t: 1.2, life: 1.2, kind: 'smoke', max: 3 });
}

// A flare at a delivery: a warm light that rises and fades over 2 s.
export function flare(x, y, z) {
  const group = new THREE.Group();
  const light = new THREE.PointLight(0xffc978, 30, 26, 2);
  light.position.set(0, 0, 0);
  group.add(light);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: getPuffTex(), color: 0xffc978, transparent: true, opacity: .9, depthWrite: false,
  }));
  glow.scale.setScalar(3);
  group.add(glow);
  group.position.set(x, y + 1, z);
  S.add(group);
  G.fx.push({ o: group, t: 2, life: 2, kind: 'flare', light, glow });
}

// Age every effect; dispose of the expired ones (called once per frame).
export function updateFx(dt) {
  for (let i = G.fx.length - 1; i >= 0; i--) {
    const f = G.fx[i];
    f.t -= dt;
    const k = 1 - Math.max(0, f.t) / f.life; // 0 (born) -> 1 (gone)
    if (f.kind === 'smoke') {
      f.o.scale.setScalar(.6 + k * f.max);
      f.o.material.opacity = .5 * (1 - k);
    } else if (f.kind === 'flare') {
      f.o.position.y += 3 * dt;
      f.light.intensity = 30 * Math.max(0, f.t / f.life);
      f.glow.material.opacity = .9 * Math.max(0, f.t / f.life);
    }
    if (f.t <= 0) {
      S.remove(f.o);
      if (f.kind === 'tracer') {
        f.o.geometry.dispose();
        f.o.material.dispose();
      } else {
        // Sprites share one texture and no geometry of their own: only
        // the material is per-effect.
        const mats = f.kind === 'flare' ? [f.glow.material] : [f.o.material];
        for (const m of mats) m.dispose();
      }
      G.fx.splice(i, 1);
    }
  }
}
