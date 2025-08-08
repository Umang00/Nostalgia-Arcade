export interface ScoreState {
  score: number;
  level: number;
  linesClearedTotal: number;
}

export const LINE_POINTS = [0, 100, 300, 500, 800];

/**
 * Compute score delta for a line clear count (1..4).
 */
export function scoreForLines(lines: number): number {
  return LINE_POINTS[lines] || 0;
}

/**
 * Soft drop awards +1 per cell stepped.
 */
export function scoreSoftDrop(cells: number): number { return cells; }

/**
 * Hard drop awards +2 per cell.
 */
export function scoreHardDrop(cells: number): number { return cells * 2; }

/**
 * Update level every 10 lines cleared; returns new level and total lines.
 */
export function updateLevel(prevLevel: number, prevTotalLines: number, linesClearedNow: number): { level: number; totalLines: number } {
  const total = prevTotalLines + linesClearedNow;
  const level = Math.floor(total / 10);
  return { level, totalLines: total };
}

/**
 * Gravity drop interval (ms) by level. Start ~1000ms and speed up.
 */
export function gravityIntervalMs(level: number): number {
  // Classic-ish: start ~800ms; reduce ~80-100ms per level; minimum 120ms
  const start = 800;
  const step = 85;
  const min = 120;
  const ms = start - step * Math.max(0, level);
  return Math.max(min, ms);
}


