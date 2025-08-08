
import { navigate } from '../router';
import { audio } from '../engine/Audio';

type GameMeta = { id: string; name: string; tagline: string; };
const GAMES: GameMeta[] = [
  { id: 'snake', name: 'Snake', tagline: 'Classic Nokia vibes' },
  { id: 'tetris', name: 'Tetris', tagline: 'Stack & clear lines' },
  { id: 'pong', name: 'Pong', tagline: 'Retro paddle duel' },
  { id: 'brick', name: 'Brick Breaker', tagline: 'Smash those bricks' }
];

export function initHome() {
  const root = document.getElementById('route-root')!;
  root.innerHTML = `
    <h1 style="margin:8px 0 12px 0;">All your childhood games, one link.</h1>
    <div class="controls" style="margin-bottom:10px; align-items:center;">
      <button id="btnAudioMute" class="btn secondary"></button>
      <input id="rangeVolume" type="range" min="0" max="1" step="0.01" style="width:160px;" />
    </div>
    <div class="grid">
      ${GAMES.map(g => `
        <div class="card">
          <div style="font-weight:600;">${g.name}</div>
          <div class="pill">${g.tagline}</div>
          <button class="btn" data-game="${g.id}">Play</button>
        </div>
      `).join('')}
    </div>
  `;
  // Audio controls
  const btn = root.querySelector('#btnAudioMute') as HTMLButtonElement;
  const rng = root.querySelector('#rangeVolume') as HTMLInputElement;
  const updateBtn = () => btn.textContent = audio.isMuted() ? 'Unmute' : 'Mute';
  updateBtn();
  rng.value = String(audio.getVolume());
  btn.addEventListener('click', () => { audio.setMuted(!audio.isMuted()); updateBtn(); });
  rng.addEventListener('input', () => audio.setVolume(Number(rng.value)));
  audio.startMusic();
  root.querySelectorAll('button[data-game]').forEach(b => {
    b.addEventListener('click', () => {
      const id = (b as HTMLButtonElement).dataset.game!;
      navigate(`/game/${id}`);
    });
  });
}
