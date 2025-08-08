
export type GameEvent = 'score' | 'game_over' | 'share_payload';

export interface Game {
  init(container: HTMLElement): void;
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  destroy(): void;
  on(event: GameEvent, cb: (...args:any[]) => void): void;
}

export abstract class BaseGame implements Game {
  private listeners: Record<GameEvent, Array<(...args:any[])=>void>> = {
    score: [], game_over: [], share_payload: []
  };
  protected container!: HTMLElement;
  on(event: GameEvent, cb: (...args:any[]) => void) { this.listeners[event].push(cb); }
  protected emit(event: GameEvent, ...args:any[]) { this.listeners[event].forEach(f => f(...args)); }
  init(container: HTMLElement) { this.container = container; }
  abstract start(): void;
  abstract pause(): void;
  abstract resume(): void;
  abstract reset(): void;
  abstract destroy(): void;
}
