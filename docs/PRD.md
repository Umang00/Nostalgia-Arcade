# Nostalgia Arcade — Product Requirements Document (PRD)

## 1. Overview
Nostalgia Arcade is a browser-based retro gaming hub featuring classic-style games like Snake, Tetris, and more, built with modern web technologies (Vite, TypeScript, Canvas API). The goal is to provide an instantly playable, shareable, and responsive experience that works seamlessly on both desktop and mobile devices.

This PRD defines gameplay rules, UI/UX requirements, technical specifications, and future expansion plans for the arcade.

---

## 2. Goals
- Deliver a nostalgic yet modern retro gaming experience.
- Ensure games are responsive, smooth, and work on mobile & desktop.
- Support quick replayability and social sharing to encourage competition.
- Provide a scalable foundation to add more games easily.

---

## 3. Target Devices
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Tablets

---

## 4. Core Features

### 4.1 Game Framework
- Multiple games accessible from a central hub (Arcade Menu).
- Common shell/UI for score tracking, pause/resume, and restart.
- Ability to plug in new games without major refactor.

### 4.2 Scoring & Progression
- Score tracking for each game.
- Local high score storage via `localStorage` (`best_<gameId>` key).
- Scoring rules defined per game (e.g., Tetris line clears: 100/300/500/800 points).
- Level progression based on milestones (e.g., lines cleared in Tetris).

### 4.3 Game Lifecycle
- **Start**: Initializes state, loads first piece/entity.
- **Pause/Resume**: Suspends/resumes updates, toggled by button or keyboard.
- **Reset**: Clears state and restarts the game instantly.
- **Game Over**: Displays modal with contextual message and sharing options.

### 4.4 Controls
- **Keyboard**: Arrow keys/WASD for movement, space for special actions.
- **Touch**: Virtual buttons, tap-to-rotate, long-press for repeat actions (e.g., soft drop in Tetris).
- **Pause/Resume Button**: Toggles game state with visible label change.

### 4.5 Sharing
- Web Share API for supported browsers; fallback to clipboard copy.
- Default share message:
Just scored {score} in {prettyGameName} at Nostalgia Arcade! Can you beat me? 🎮 Play here: {origin}/

- `share_payload` override option (string or `{ text: ... }`).

---

## 5. Tetris Specifics

### 5.1 Board & Layout
- 10×20 visible grid; exact sizing with integer cell size.
- Board centered; first/last rows fully visible.
- Subtle grid lines for visual clarity.

### 5.2 Piece Spawning
- Uses 7-bag randomizer.
- Spawn at top-center with hidden rows for entry.

### 5.3 Gravity & Speed
- Fixed interval gravity; starting ~800ms per drop.
- Speeds up by ~85ms per level; minimum 120ms.

### 5.4 Scoring
- Soft drop: +1 point per cell.
- Hard drop: +2 points per cell.
- Line clears: 100/300/500/800 points.

### 5.5 Gameplay Enhancements
- Ghost piece retained.
- Next piece preview overlays without shrinking board.
- Simplified wall kicks for predictable behavior.

---

## 6. UI/UX Requirements
- Responsive layout that adapts to screen size.
- Minimalist retro look with modern polish.
- Smooth animations, no lag between input & action.
- End-of-game modal with dynamic messaging and replay/share options.

---

## 7. Technical Requirements
- Stack: TypeScript, Vite, Canvas API.
- Modular architecture for adding new games.
- Local high score persistence.
- Touch and keyboard event support.
- Idempotent lifecycle methods (`start`, `pause`, `resume`, `reset`, `destroy`).

---

## 8. Future Enhancements
- Additional retro games.
- Online leaderboards.
- Multiplayer challenges.
- Progressive Web App (PWA) installability.

---

## 9. References
- Game mechanics modeled after classic 80s/90s arcade titles.
- Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- Canvas API documentation for rendering.
