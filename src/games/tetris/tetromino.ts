export type Cell = { x: number; y: number };
export type ShapeName = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface TetrominoDef {
  name: ShapeName;
  color: string;
  // Spawn orientation as 4 relative cells
  cells: Readonly<Cell[]>;
}

// Spawn orientations match classic Tetris top-spawn, centered-ish
const DEFINITIONS: Record<ShapeName, TetrominoDef> = {
  I: { name: 'I', color: '#60a5fa', cells: [ {x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:2,y:0} ] },
  O: { name: 'O', color: '#fbbf24', cells: [ {x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1} ] },
  T: { name: 'T', color: '#a78bfa', cells: [ {x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:0,y:1} ] },
  S: { name: 'S', color: '#34d399', cells: [ {x:0,y:0},{x:1,y:0},{x:-1,y:1},{x:0,y:1} ] },
  Z: { name: 'Z', color: '#f87171', cells: [ {x:-1,y:0},{x:0,y:0},{x:0,y:1},{x:1,y:1} ] },
  J: { name: 'J', color: '#60a5fa', cells: [ {x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:-1,y:1} ] },
  L: { name: 'L', color: '#f59e0b', cells: [ {x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:1,y:1} ] }
};

export function getDefinition(name: ShapeName): TetrominoDef {
  return DEFINITIONS[name];
}

/**
 * Rotate a set of cells clockwise around origin using a simple matrix: (x,y) -> (y, -x)
 * O piece returns unchanged.
 */
export function rotateCw(cells: Readonly<Cell[]>, shape: ShapeName): Cell[] {
  if (shape === 'O') return cells.map(c => ({ ...c }));
  const rotated: Cell[] = new Array(cells.length);
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    rotated[i] = { x: c.y, y: -c.x };
  }
  return rotated;
}

/**
 * Basic wall-kick offsets to try after rotation to avoid getting stuck on walls.
 * Not full SRS; keep it simple for v1.
 */
export const WALL_KICK_OFFSETS: ReadonlyArray<Cell> = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: -1 }
];

/**
 * Simple 7-bag randomizer providing a fair distribution of tetrominoes.
 */
export class SevenBag {
  private queue: ShapeName[] = [];

  next(): ShapeName {
    if (this.queue.length === 0) this.refill();
    return this.queue.pop() as ShapeName;
  }

  peekNext(): ShapeName {
    if (this.queue.length === 0) this.refill();
    return this.queue[this.queue.length - 1];
  }

  private refill() {
    const items: ShapeName[] = ['I','O','T','S','Z','J','L'];
    // Fisher–Yates
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    // Use as a stack for efficient pop
    this.queue.push(...items);
  }
}


