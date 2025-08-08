
import { navigate } from '../router';

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
  root.querySelectorAll('button[data-game]').forEach(b => {
    b.addEventListener('click', () => {
      const id = (b as HTMLButtonElement).dataset.game!;
      navigate(`/game/${id}`);
    });
  });
}
