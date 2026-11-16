// Synthesised audio only — no sound files. A single white-noise buffer
// is filtered and shaped into gunshots, footsteps and splashes.
import { P } from '../entities/actors.js';

let AC, NB;

// Idempotent: safe to call on every click; the context is made once.
export function initAudio() {
  if (AC) return;
  AC = new AudioContext();
  NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
  const c = NB.getChannelData(0);
  for (let i = 0; i < c.length; i++) c[i] = Math.random() * 2 - 1;
}

// A filtered noise burst at position s. Volume falls off with distance
// from the player, so far-away shots are quiet.
export function boom(s, vol, dur, fc) {
  if (!AC) return;
  const v = vol * Math.max(0, 1 - Math.hypot(s.x - P.x, s.z - P.z) / 45);
  if (v < .01) return;
  const n = AC.currentTime, b = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  b.buffer = NB;
  f.type = 'lowpass';
  f.frequency.setValueAtTime(fc, n);
  f.frequency.exponentialRampToValueAtTime(120, n + dur);
  g.gain.setValueAtTime(v, n);
  g.gain.exponentialRampToValueAtTime(.001, n + dur);
  b.connect(f).connect(g).connect(AC.destination);
  b.start();
}
