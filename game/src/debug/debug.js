// Debug handle for testing (harmless in play): window.__sw exposes the
// live state and the few controls a test driver needs when pointer lock
// is unavailable (headless Chrome). It changes nothing about the game.
import { G } from '../core/state.js';
import { P, A } from '../entities/actors.js';
import { S, cam, water } from '../world/world.js';
import { findPath, navInfo } from '../ai/navgraph.js';
import { newRound } from '../match/rounds.js';

window.__sw = {
  G, P, A, S, cam, water,
  navInfo, findPath, newRound,
  // Aim the player directly (yaw/pitch in radians).
  aim(yaw, pit) { P.yaw = yaw; P.pit = pit; },
  // Hold / release the trigger.
  pressFire() { G.mouse = 1; },
  releaseFire() { G.mouse = 0; },
  // Hold / release a key by its KeyboardEvent code ('KeyW', 'KeyR', ...).
  key(code, down) { G.keys[code] = down ? 1 : 0; },
};
