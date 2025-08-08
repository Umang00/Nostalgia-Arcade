import { BaseGame } from '../../engine/GameHost';
import { Cell, SevenBag, ShapeName, WALL_KICK_OFFSETS, getDefinition, rotateCw } from './tetromino';
import { gravityIntervalMs, scoreForLines, scoreHardDrop, scoreSoftDrop, updateLevel } from './scoring';
import { audio } from '../../engine/Audio';

type BoardCell = { filled: boolean; color: string };

interface ActivePiece {
  shape: ShapeName;
  cells: Cell[]; // relative cells
  x: number; // origin on board
  y: number;
  color: string;
}

export class TetrisGame extends BaseGame {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private boardW = 10;
  private boardH = 20; // visible
  private hiddenRows = 2; // spawn safety
  private grid = 24; // will be resized
  private board: BoardCell[][] = [];
  private bag = new SevenBag();
  private active!: ActivePiece;
  private nextShape!: ShapeName;
  private raf = 0;
  private lastFrame = 0;
  private lastGravity = 0;
  private running = false;
  private paused = false;
  private over = false;
  private level = 0;
  private totalLines = 0;
  private score = 0;
  private touchRotateListener = (e: MouseEvent | TouchEvent) => { this.rotate(); };

  init(container: HTMLElement) {
    super.init(container);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.ctx = this.canvas.getContext('2d')!;
    container.innerHTML = '';
    container.appendChild(this.canvas);
    this.onResize();
    addEventListener('resize', () => this.onResize());

    addEventListener('keydown', this.onKey);
    addEventListener('virtual-direction', this.onVirtual as EventListener);
    this.canvas.addEventListener('click', this.touchRotateListener);

    this.reset();
  }

  start() {
    if (this.running) return;
    this.paused = false; this.over = false; this.running = true;
    cancelAnimationFrame(this.raf);
    this.lastFrame = 0; this.lastGravity = 0;
    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop);
      if (this.paused || this.over) return;
      if (!this.lastFrame) { this.lastFrame = t; this.lastGravity = t; this.draw(); return; }
      // gravity
      const gInterval = gravityIntervalMs(this.level);
      if (t - this.lastGravity >= gInterval) {
        if (!this.tryMove(0, 1)) {
          this.lockPiece();
        }
        this.lastGravity = t;
      }
      // redraw at ~60fps
      if (t - this.lastFrame >= 16) { this.draw(); this.lastFrame = t; }
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() { if (!this.running) return; this.paused = true; }
  resume() { if (!this.running) return; this.paused = false; }
  reset() {
    // board includes hidden rows on top
    const H = this.boardH + this.hiddenRows;
    this.board = new Array(H);
    for (let y = 0; y < H; y++) {
      const row: BoardCell[] = new Array(this.boardW);
      for (let x = 0; x < this.boardW; x++) row[x] = { filled: false, color: '#000000' };
      this.board[y] = row;
    }
    this.level = 0; this.totalLines = 0; this.score = 0;
    this.bag = new SevenBag();
    this.nextShape = this.bag.next();
    this.spawn();
    this.running = false; this.over = false; this.paused = false;
    this.draw();
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    removeEventListener('keydown', this.onKey);
    removeEventListener('virtual-direction', this.onVirtual as EventListener);
    this.canvas.removeEventListener('click', this.touchRotateListener);
    this.container.innerHTML = '';
    this.running = false;
  }

  private onVirtual = (e: CustomEvent) => {
    const d = e.detail as string;
    if (d === 'left') this.move(-1);
    else if (d === 'right') this.move(1);
    else if (d === 'down') this.softDrop();
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft') this.move(-1);
    else if (e.code === 'ArrowRight') this.move(1);
    else if (e.code === 'ArrowDown') this.softDrop();
    else if (e.code === 'ArrowUp') this.rotate();
    else if (e.code === 'Space') this.hardDrop();
    else if (e.code === 'KeyP') this.paused ? this.resume() : this.pause();
  };

  private onResize() {
    const rect = this.container.getBoundingClientRect();
    const cell = Math.floor(Math.min(rect.width / this.boardW, rect.height / this.boardH));
    const width = cell * this.boardW;
    const height = cell * this.boardH;
    this.canvas.width = width;
    this.canvas.height = height;
    this.grid = cell;
    // center the canvas area within host
    const host = this.container as HTMLElement;
    host.style.display = 'flex';
    host.style.alignItems = 'center';
    host.style.justifyContent = 'center';
    host.style.overflow = 'hidden';
  }

  private spawn() {
    const shape = this.nextShape;
    this.nextShape = this.bag.next();
    const def = getDefinition(shape);
    this.active = {
      shape,
      cells: def.cells.map(c => ({ ...c })),
      x: Math.floor(this.boardW / 2),
      y: 0,
      color: def.color
    };
    if (this.collides(this.active, 0, 0)) {
      this.gameOver();
    }
  }

  private gameOver() {
    this.over = true;
    this.running = false;
    this.emit('game_over');
  }

  private tryMove(dx: number, dy: number): boolean {
    if (this.collides(this.active, dx, dy)) return false;
    this.active.x += dx; this.active.y += dy; return true;
  }

  private move(dir: -1 | 1) { this.tryMove(dir, 0); }

  /** Rotate active piece clockwise with basic wall kicks. */
  private rotate() {
    const rotated = rotateCw(this.active.cells, this.active.shape);
    const candidate: ActivePiece = { ...this.active, cells: rotated };
    for (const off of WALL_KICK_OFFSETS) {
      if (!this.collides(candidate, off.x, off.y)) {
        this.active.cells = rotated; this.active.x += off.x; this.active.y += off.y; audio.play('rotate'); return;
      }
    }
  }

  /** Soft drop one cell; awards +1 and resets gravity timer slightly. */
  private softDrop() {
    if (!this.over && !this.paused) {
      if (this.tryMove(0, 1)) {
        this.incrementScore(scoreSoftDrop(1));
        audio.play('drop');
        // encourage faster descent by resetting gravity so user input feels responsive
        this.lastGravity = performance.now();
      } else {
        this.lockPiece();
      }
    }
  }

  /** Hard drop to the ghost location; awards +2 per cell. */
  private hardDrop() {
    if (this.over || this.paused) return;
    let steps = 0;
    while (this.tryMove(0, 1)) steps++;
    if (steps > 0) this.incrementScore(scoreHardDrop(steps));
    audio.play('hard');
    this.lockPiece();
  }

  private incrementScore(delta: number) {
    if (delta <= 0) return;
    this.score += delta;
    this.emit('score', delta);
  }

  /** Commit active piece to the board, clear lines, update level, spawn next. */
  private lockPiece() {
    const a = this.active;
    for (const c of a.cells) {
      const x = a.x + c.x; const y = a.y + c.y;
      if (y < 0) continue;
      if (y >= this.board.length || x < 0 || x >= this.boardW) continue;
      this.board[y][x] = { filled: true, color: a.color };
    }
    const cleared = this.clearLines();
    if (cleared > 0) {
      const gained = scoreForLines(cleared);
      this.incrementScore(gained);
      audio.play('clear');
      const upd = updateLevel(this.level, this.totalLines, cleared);
      this.level = upd.level; this.totalLines = upd.totalLines;
    }
    this.spawn();
  }

  /** Returns number of lines cleared. */
  private clearLines(): number {
    let cleared = 0;
    for (let y = this.board.length - 1; y >= 0; y--) {
      if (this.isLineFull(y)) {
        this.removeLine(y);
        cleared++;
        y++; // re-check same y after shifting down
      }
    }
    return cleared;
  }

  private isLineFull(y: number): boolean {
    for (let x = 0; x < this.boardW; x++) if (!this.board[y][x].filled) return false;
    return true;
  }

  private removeLine(y: number) {
    for (let yy = y; yy > 0; yy--) {
      for (let x = 0; x < this.boardW; x++) this.board[yy][x] = { ...this.board[yy - 1][x] };
    }
    for (let x = 0; x < this.boardW; x++) this.board[0][x] = { filled: false, color: '#000000' };
  }

  private collides(piece: ActivePiece, dx: number, dy: number): boolean {
    for (const c of piece.cells) {
      const x = piece.x + c.x + dx;
      const y = piece.y + c.y + dy;
      if (x < 0 || x >= this.boardW || y >= this.board.length) return true;
      if (y >= 0 && this.board[y][x].filled) return true;
    }
    return false;
  }

  private computeGhostY(): number {
    const test: ActivePiece = { ...this.active, cells: this.active.cells.map(c => ({ ...c })) };
    let y = test.y;
    while (!this.collides(test, 0, 1)) { test.y++; y = test.y; }
    return y;
  }

  private draw() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);

    // background
    ctx.fillStyle = '#0f1220';
    ctx.fillRect(0, 0, width, height);

    // visible area starts after hidden rows
    const visibleOffsetPxY = this.hiddenRows * this.grid;

    // grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.boardW; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.grid + 0.5, 0.5);
      ctx.lineTo(x * this.grid + 0.5, this.boardH * this.grid + 0.5);
      ctx.stroke();
    }
    for (let y = 0; y <= this.boardH; y++) {
      ctx.beginPath();
      ctx.moveTo(0.5, y * this.grid + 0.5);
      ctx.lineTo(this.boardW * this.grid + 0.5, y * this.grid + 0.5);
      ctx.stroke();
    }

    // board cells
    for (let y = this.hiddenRows; y < this.board.length; y++) {
      for (let x = 0; x < this.boardW; x++) {
        const cell = this.board[y][x];
        if (!cell.filled) continue;
        ctx.fillStyle = cell.color;
        ctx.fillRect(x * this.grid, (y - this.hiddenRows) * this.grid, this.grid - 1, this.grid - 1);
      }
    }

    // ghost piece
    const ghostY = this.computeGhostY();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (const c of this.active.cells) {
      const gx = (this.active.x + c.x) * this.grid;
      const gy = (ghostY + c.y - this.hiddenRows) * this.grid;
      if (ghostY + c.y >= this.hiddenRows) ctx.fillRect(gx, gy, this.grid - 1, this.grid - 1);
    }

    // active piece
    ctx.fillStyle = this.active.color;
    for (const c of this.active.cells) {
      const px = (this.active.x + c.x) * this.grid;
      const py = (this.active.y + c.y - this.hiddenRows) * this.grid;
      if (this.active.y + c.y >= this.hiddenRows) ctx.fillRect(px, py, this.grid - 1, this.grid - 1);
    }

    // next preview (outside main grid area: draw in a reserved overlay area at top-right
    const previewGrid = Math.max(10, Math.floor(this.grid * 0.85));
    const previewPad = 8;
    const previewX = width - previewGrid * 4 - previewPad;
    const previewY = previewPad;
    ctx.save();
    // clear a rectangle to visually sit on top of board
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(previewX, previewY, previewGrid * 4, previewGrid * 4);
    const nextDef = getDefinition(this.nextShape);
    ctx.fillStyle = nextDef.color;
    const offsetX = previewX + previewGrid * 2;
    const offsetY = previewY + previewGrid * 2;
    for (const c of nextDef.cells) {
      const nx = offsetX + c.x * previewGrid - previewGrid / 2;
      const ny = offsetY + c.y * previewGrid - previewGrid / 2;
      ctx.fillRect(nx, ny, previewGrid - 2, previewGrid - 2);
    }
    ctx.restore();
  }
}


