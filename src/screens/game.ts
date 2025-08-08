
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
          <button id="btnShareTop" class="btn secondary">Share</button>
          <button id="btnMute" class="btn secondary">Mute</button>
          <input id="rangeVol" type="range" min="0" max="1" step="0.01" style="width:120px;" />
          <button id="btnHelp" class="btn secondary">How to play</button>
        </div>
      </div>
      <div style="flex:1; display:grid; grid-template-columns: 1fr 140px; gap:12px; min-height:0;">
        <div id="canvasHost" style="position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden;"></div>
        <div id="sidebar" class="card" style="display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-start;"></div>
      </div>
      <div id="centerOverlay" class="overlay-card hidden" style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:5;"></div>
      <div id="touchControls" class="controls" style="justify-content:center; margin-top:8px;">
        <button class="btn secondary" data-dir="up">↑</button>
        <div>
          <button class="btn secondary" data-dir="left">←</button>
          <button class="btn secondary" data-dir="right">→</button>
        </div>
        <button class="btn secondary" data-dir="down">↓</button>
      </div>
    </div>
    <div id="endModal" class="card hidden"><!-- kept for accessibility; overlay used for center message --></div>
  `;

  const bestKey = `best_${id}`;
  const bestEl = document.getElementById('best')!;
  bestEl.textContent = String(Number(localStorage.getItem(bestKey) || '0'));

  const host = document.getElementById('canvasHost')!;
  const sidebar = document.getElementById('sidebar')!;
  const game = loadGame(id);
  game.init(host);
  audio.startGameMusic();
  // If Tetris exposes sidebar attachment, wire it
  // @ts-ignore - only Tetris implements it
  if (typeof (game as any).attachSidebar === 'function') {
    // @ts-ignore
    (game as any).attachSidebar(sidebar);
  }
  // In-game audio controls
  const muteBtn = document.getElementById('btnMute') as HTMLButtonElement;
  const volRng = document.getElementById('rangeVol') as HTMLInputElement;
  const updateMute = () => muteBtn.textContent = audio.isMuted() ? 'Unmute' : 'Mute';
  updateMute();
  volRng.value = String(audio.getVolume());
  muteBtn.addEventListener('click', () => { audio.setMuted(!audio.isMuted()); updateMute(); });
  volRng.addEventListener('input', () => audio.setVolume(Number(volRng.value)));

  // Help popover
  const helpBtn = document.getElementById('btnHelp') as HTMLButtonElement;
  const pop = document.createElement('div');
  pop.className = 'overlay-card hidden';
  pop.style.position = 'absolute';
  pop.style.right = '16px';
  pop.style.top = '60px';
  pop.style.zIndex = '6';
  pop.innerHTML = `
    <div style="font-weight:700; margin-bottom:6px;">How to play</div>
    <ul style="margin:0 0 8px 16px; padding:0; line-height:1.4;">
      <li>←/→ to move, ↑ rotate, ↓ soft drop, Space hard drop, P pause</li>
      <li>Tap canvas to rotate; hold ↓ for fast soft drop</li>
      <li>Lines: 100/300/500/800 • Soft +1/cell • Hard +2/cell</li>
      <li>Level up every 10 lines; gravity speeds up</li>
    </ul>
    <div style="text-align:right"><button id="btnCloseHelp" class="btn secondary">Close</button></div>
  `;
  document.getElementById('game-wrap')!.appendChild(pop);
  helpBtn.addEventListener('click', () => pop.classList.toggle('hidden'));
  pop.addEventListener('click', (e) => {
    const t = e.target as HTMLElement; if (t && t.id === 'btnCloseHelp') pop.classList.add('hidden');
  });

  // Pre-game splash overlay
  const splash = document.createElement('div');
  splash.className = 'overlay-card';
  splash.style.position = 'absolute';
  splash.style.left = '50%';
  splash.style.top = '50%';
  splash.style.transform = 'translate(-50%,-50%)';
  splash.style.zIndex = '7';
  splash.innerHTML = `
    <div style="font-size:20px; font-weight:800; text-align:center; margin-bottom:8px;">Tetris</div>
    <div style="text-align:center; color:#9aa3b2; margin-bottom:8px;">Stack tetrominoes to clear lines. Reach higher levels!</div>
    <div style="display:flex; gap:8px; justify-content:center; margin-bottom:8px;">
      <button id="btnSplashPlay" class="btn">Play</button>
      <button id="btnSplashHelp" class="btn secondary">How to play</button>
    </div>
  `;
  document.getElementById('game-wrap')!.appendChild(splash);

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
    // Use centered overlay for message + actions
    const overlay = document.getElementById('centerOverlay')!;
    overlay.innerHTML = `
      <div style="font-size:18px; font-weight:700; text-align:center; margin-bottom:8px;">Game Over</div>
      <div style="text-align:center; margin-bottom:6px;">Final Score: <b>${score}</b></div>
      <div id="endMessage" style="margin:6px 0 10px 0; max-width:260px; text-align:center;"></div>
      <div style="display:flex; gap:8px; justify-content:center;">
        <button id="btnPlayAgain" class="btn">Play Again</button>
        <button id="btnShare" class="btn secondary">Share</button>
      </div>
    `;
    overlay.classList.remove('hidden');
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
  const onPlayAgain = () => {
    score = 0; scoreEl.textContent = '0'; paused = false; btnPause.textContent = 'Pause';
    (document.getElementById('centerOverlay')!).classList.add('hidden');
    game.reset(); game.start();
    audio.startMusic();
  };
  // Delegated handler since overlay recreated on each end
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t && t.id === 'btnPlayAgain') onPlayAgain();
  });
  // Splash actions
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t && t.id === 'btnSplashPlay') {
      splash.remove(); game.reset(); game.start();
      audio.startGameMusic();
    } else if (t && t.id === 'btnSplashHelp') {
      pop.classList.remove('hidden');
    }
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

  // Share button + prompts section beneath HUD
  const shareBar = document.createElement('div');
  shareBar.className = 'controls';
  shareBar.style.marginTop = '6px';
  shareBar.innerHTML = `
    <button class="btn secondary" id="btnShare">Share score</button>
    <button class="btn secondary" id="copyPromptA">Copy: Just scored…</button>
    <button class="btn secondary" id="copyPromptB">Copy: I'm loving…</button>
  `;
  document.getElementById('hud')!.after(shareBar);
  const copy = async (s:string) => { await navigator.clipboard.writeText(s); alert('Copied to clipboard!'); };
  document.getElementById('copyPromptA')!.addEventListener('click', () => {
    const pretty = id === 'tetris' ? 'Tetris' : id === 'snake' ? 'Snake' : id;
    copy(`Just scored ${score} in ${pretty} at Nostalgia Arcade! Can you beat me? 🎮\nPlay here: ${location.origin}/`);
  });
  document.getElementById('copyPromptB')!.addEventListener('click', () => {
    const pretty = id === 'tetris' ? 'Tetris' : id === 'snake' ? 'Snake' : id;
    copy(`I'm just loving the ${pretty} game at Nostalgia Arcade!\nDo you also want to play?\nPlay here: ${location.origin}/`);
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

