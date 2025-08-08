
import { Game } from '../engine/GameHost';
import { SnakeGame } from '../games/snake/SnakeGame';
import { TetrisGame } from '../games/tetris/TetrisGame';

export function loadGame(id: string): Game {
  switch (id) {
    case 'snake': return new SnakeGame();
    // Future: dynamic imports for code-splitting, e.g.:
    // case 'tetris': return (await import('../games/tetris/TetrisGame')).TetrisGame;
    // For now, snake as placeholder for others
    case 'tetris': return new TetrisGame();
    case 'pong': return new SnakeGame(); // placeholder
    case 'brick': return new SnakeGame(); // placeholder
    default: return new SnakeGame();
  }
}
