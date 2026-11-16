// The HUD: every text readout on screen, refreshed once per frame from
// the shared state. The elements live in game/index.html.
import { $ , W, TIDES, TN } from '../core/util.js';
import { G } from '../core/state.js';
import { P, A, name } from '../entities/actors.js';
import { drawMinimap } from './minimap.js';

export function updateHud() {
  const w = W[P.cur], am = P.ammo[P.cur];
  $('hp').textContent = Math.max(0, P.hp | 0);
  $('ammo').textContent = (P.rl > 0 ? 'RELOAD' : am.m + ' / ' + am.r) + '  ' + w.n;
  $('money').textContent = '$' + P.money;
  $('timer').textContent = G.ph.n === 'live' ? Math.ceil(G.ph.t) : G.ph.n === 'freeze' ? 'BUY ' + Math.ceil(G.ph.t) : '--';
  $('score').textContent = 'HG ' + G.sc[0] + '  —  ' + G.sc[1] + ' SC';
  $('tide').textContent = 'TIDE ' + TIDES[G.tide].n + (G.core.carrier ? '  ·  CORE: ' + name(G.core.carrier) : '  ·  CORE FREE');
  $('feed').textContent = G.feedL.join('\n');
  $('hit').style.opacity = P.hurt * 3;
  $('msg').textContent = G.ph.n === 'freeze'
    ? 'ROUND ' + (G.rd + 1) + ' · buy with 1-4\nGrab the core in the basin, bring it home'
    : G.ph.msg && (G.ph.n === 'end' || G.ph.n === 'over') ? G.ph.msg
    : P.hp <= 0 && G.ph.n === 'live' ? 'ELIMINATED' : '';
  drawMinimap();
  updateBoard();
}

// The scoreboard (Tab to hold, shown automatically when the match ends):
// each team's players with kills, and the round score.
function updateBoard() {
  const board = $('board');
  if (!board) return;
  const show = G.board || G.ph.n === 'over';
  board.style.display = show ? 'block' : 'none';
  if (!show) return;
  let html = '';
  for (const team of [0, 1]) {
    const rows = A.filter(a => a.team === team)
      .map(a => `<div class="brow"><span>${name(a)}</span><span>${a.hp > 0 ? a.hp : '✕'} HP</span><span>${a.kills} K</span></div>`)
      .join('');
    html += `<div class="bteam"><div class="bhead" style="color:${team === 0 ? '#ffb347' : '#e0457b'}">${team === 0 ? 'HARBOR GUARD' : 'SALVAGE CREW'} — ${G.sc[team]}</div>${rows}</div>`;
  }
  board.innerHTML = html;
}
