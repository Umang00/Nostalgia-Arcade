
import { loadGame } from '../util/registry';
import { track } from '../engine/Analytics';
import { audio } from '../engine/Audio';

export function initGameRoute(params?: Record<string,string>) {
  const id = params?.id || 'snake';
  const root = document.getElementById('route-root')!;
  root.innerHTML = `
    <a class="btn secondary" href="/">← Back</a>
    <div style="margin-top:10px;"></div>
    <div id="game-wrap" class="card" style="height:70vh; display:flex; flex-direction:column;">
      <div id="hud" style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
        <div>Score: <span id="score">0</span></div>
        <div>Best: <span id="best">0</span></div>
        <div class="controls">
          <button id="btnPause" class="btn secondary">Pause</button>
          <button id="btnReset" class="btn secondary">Reset</button>
        </div>
      </div>
      <div id="canvasHost" style="flex:1; position:relative;"></div>
      <div id="touchControls" class="controls" style="justify-content:center; margin-top:8px;">
        <button class="btn secondary" data-dir="up">↑</button>
        <div>
          <button class="btn secondary" data-dir="left">←</button>
          <button class="btn secondary" data-dir="right">→</button>
        </div>
        <button class="btn secondary" data-dir="down">↓</button>
      </div>
    </div>
    <div id="endModal" class="card hidden">
      <div style="font-weight:600;">Game Over</div>
      <div>Final Score: <span id="finalScore">0</span></div>
      <div id="endMessage" style="margin:6px 0 10px 0;"></div>
      <div class="controls">
        <button id="btnPlayAgain" class="btn">Play Again</button>
        <button id="btnShare" class="btn secondary">Share score</button>
      </div>
    </div>
  `;

  const bestKey = `best_${id}`;
  const bestEl = document.getElementById('best')!;
  bestEl.textContent = String(Number(localStorage.getItem(bestKey) || '0'));

  const host = document.getElementById('canvasHost')!;
  const game = loadGame(id);
  game.init(host);

  let score = 0;
  const scoreEl = document.getElementById('score')!;
  let paused = false;
  let lastShareOverride: string | undefined;

  game.on('score', (delta:number) => {
    score += delta;
    scoreEl.textContent = String(score);
  });
  game.on('game_over', () => {
    const prevBest = Number(localStorage.getItem(bestKey) || '0');
    const isNewBest = score > prevBest;
    if (isNewBest) localStorage.setItem(bestKey, String(score));
    const nowBest = Number(localStorage.getItem(bestKey) || '0');
    bestEl.textContent = String(nowBest);
    (document.getElementById('finalScore') as HTMLElement).textContent = String(score);
    const msgEl = document.getElementById('endMessage') as HTMLElement;
    if (isNewBest) {
      msgEl.textContent = `Yess! New best score: ${score} 🎉 Now try to beat this one—hit Play Again.`;
    } else {
      msgEl.textContent = `Wooo! You scored ${score} but didn’t beat your best ${nowBest}. Click Play Again and crush it.`;
    }
    document.getElementById('endModal')!.classList.remove('hidden');
    track('game_end', { id, score });
    audio.stopMusic();
    audio.play('gameover');
  });
  game.on('share_payload', (payload:any) => {
    lastShareOverride = typeof payload === 'string' ? payload : payload?.text;
    console.log('share payload', payload);
  });

  // Controls
  const btnPause = document.getElementById('btnPause') as HTMLButtonElement;
  btnPause.addEventListener('click', () => {
    if (!paused) { game.pause(); paused = true; btnPause.textContent = 'Resume'; }
    else { game.resume(); paused = false; btnPause.textContent = 'Pause'; }
  });
  document.getElementById('btnReset')!.addEventListener('click', () => {
    score = 0; scoreEl.textContent = '0'; paused = false; btnPause.textContent = 'Pause';
    game.reset();
    game.start();
    audio.startMusic();
  });
  document.getElementById('btnPlayAgain')!.addEventListener('click', () => {
    score = 0; scoreEl.textContent = '0'; paused = false; btnPause.textContent = 'Pause';
    (document.getElementById('endModal')!).classList.add('hidden');
    game.reset(); game.start();
    audio.startMusic();
  });
  document.getElementById('btnShare')!.addEventListener('click', async () => {
    const pretty = id === 'tetris' ? 'Tetris' : id === 'snake' ? 'Snake' : id;
    const defaultText = `Just scored ${score} in ${pretty} at Nostalgia Arcade! Can you beat me? 🎮\nPlay here: ${location.origin}/`;
    const text = lastShareOverride || defaultText;
    const url = location.origin + '/';
    if (navigator.share) {
      try { await navigator.share({ title: 'Nostalgia Arcade', text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Share text copied to clipboard!');
    }
    track('share_clicked', { id, score });
  });

  // Touch controls
  // Tap/click dispatch; also support hold-to-soft-drop on down button
  document.querySelectorAll('#touchControls [data-dir]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = (btn as HTMLElement).dataset.dir!;
      const ev = new CustomEvent('virtual-direction', { detail: dir });
      window.dispatchEvent(ev);
    });
  });
  const downBtn = document.querySelector('#touchControls [data-dir="down"]') as HTMLButtonElement;
  let downHoldTimer: number | undefined;
  let downHoldInterval: number | undefined;
  const startHold = () => {
    // small delay before continuous repeat
    downHoldTimer = window.setTimeout(() => {
      downHoldInterval = window.setInterval(() => {
        const ev = new CustomEvent('virtual-direction', { detail: 'down' });
        window.dispatchEvent(ev);
      }, 60);
    }, 200);
  };
  const endHold = () => {
    if (downHoldTimer) { clearTimeout(downHoldTimer); downHoldTimer = undefined; }
    if (downHoldInterval) { clearInterval(downHoldInterval); downHoldInterval = undefined; }
  };
  downBtn.addEventListener('mousedown', startHold);
  downBtn.addEventListener('touchstart', startHold, { passive: true } as any);
  ['mouseup','mouseleave','touchend','touchcancel'].forEach(type => downBtn.addEventListener(type as any, endHold));

  game.start();
  track('game_start', { id });
}
