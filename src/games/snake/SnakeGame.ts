
import { BaseGame } from '../../engine/GameHost';

type Point = { x: number; y: number };

export class SnakeGame extends BaseGame {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private grid = 20;
  private snake: Point[] = [];
  private dir: Point = { x: 1, y: 0 };
  private food: Point = { x: 10, y: 10 };
  private raf = 0;
  private last = 0;
  private speedMs = 120;
  private paused = false;
  private alive = true;

  init(container: HTMLElement) {
    super.init(container);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.ctx = this.canvas.getContext('2d')!;
    container.innerHTML = '';
    container.appendChild(this.canvas);

    this.onResize();
    addEventListener('resize', () => this.onResize());

    this.reset();

    addEventListener('keydown', this.handleKeys);
    addEventListener('virtual-direction', this.onVirtualDir as EventListener);
  }

  private onVirtualDir = (e: CustomEvent) => {
    const d = e.detail as string;
    this.applyDir(d);
  };

  private handleKeys = (e: KeyboardEvent) => {
    if (['ArrowUp','KeyW'].includes(e.code)) this.applyDir('up');
    else if (['ArrowDown','KeyS'].includes(e.code)) this.applyDir('down');
    else if (['ArrowLeft','KeyA'].includes(e.code)) this.applyDir('left');
    else if (['ArrowRight','KeyD'].includes(e.code)) this.applyDir('right');
    else if (e.code === 'Space') this.paused ? this.resume() : this.pause();
  };

  private applyDir(d: 'up'|'down'|'left'|'right') {
    const next = { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} }[d];
    // prevent 180
    if (this.snake.length > 1 && (this.dir.x + next.x === 0 && this.dir.y + next.y === 0)) return;
    this.dir = next;
  }

  private onResize() {
    const rect = this.container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    this.canvas.width = Math.floor(size);
    this.canvas.height = Math.floor(size);
  }

  start() {
    this.paused = false; this.alive = true;
    this.last = 0;
    cancelAnimationFrame(this.raf);
    const loop = (t:number) => {
      this.raf = requestAnimationFrame(loop);
      if (this.paused || !this.alive) return;
      if (!this.last) this.last = t;
      if (t - this.last > this.speedMs) {
        this.step();
        this.last = t;
        this.draw();
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }
  reset() {
    this.snake = [{x:5,y:5},{x:4,y:5},{x:3,y:5}];
    this.dir = {x:1,y:0};
    this.randomFood();
    this.alive = true;
    this.draw();
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    removeEventListener('keydown', this.handleKeys);
    removeEventListener('virtual-direction', this.onVirtualDir as EventListener);
    this.container.innerHTML = '';
  }

  private cellsX() { return Math.floor(this.canvas.width / this.grid); }
  private cellsY() { return Math.floor(this.canvas.height / this.grid); }

  private randomFood() {
    this.food = {
      x: Math.floor(Math.random()*this.cellsX()),
      y: Math.floor(Math.random()*this.cellsY())
    };
  }

  private step() {
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
    // wrap around edges
    head.x = (head.x + this.cellsX()) % this.cellsX();
    head.y = (head.y + this.cellsY()) % this.cellsY();

    // collision with body
    if (this.snake.some((p, i) => i>0 && p.x===head.x && p.y===head.y)) {
      this.alive = false;
      this.emit('game_over');
      return;
    }
    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      this.emit('score', 10);
      this.randomFood();
    } else {
      this.snake.pop();
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    // grid bg
    ctx.fillStyle = '#0f1220';
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    // food
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(this.food.x*this.grid, this.food.y*this.grid, this.grid-1, this.grid-1);
    // snake
    ctx.fillStyle = '#60a5fa';
    for (const s of this.snake) {
      ctx.fillRect(s.x*this.grid, s.y*this.grid, this.grid-1, this.grid-1);
    }
  }
}
