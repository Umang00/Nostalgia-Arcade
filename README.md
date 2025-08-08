
# Nostalgia Arcade (PWA)

Mobile-first Progressive Web App with pluggable HTML5/Canvas games.
Ships with a sample **Snake** implementation and placeholders for Tetris, Pong, Brick Breaker.

## Quickstart
```bash
npm i
npm run dev
# open http://localhost:5173
```

## Build
```bash
npm run build
npm run preview
```

## Structure
- `src/engine` — Game interfaces & analytics adapter
- `src/screens` — Simple SPA screens (home, game)
- `src/games` — Game implementations (Snake included)
- `public/manifest.webmanifest` — PWA manifest
- `public/sw.js` — Simple cache-first service worker

## Add a new game
1. Create `src/games/<gameId>/<GameName>.ts` implementing `BaseGame`.
2. Register loading in `src/util/registry.ts`.
3. Ensure it emits `score` and `game_over` events.

## Analytics
- Default: console logs.
- Enable Plausible by uncommenting the script in `index.html` and setting your domain.

## Social Sharing
- Uses Web Share API on mobile; falls back to clipboard on desktop from the Game Over modal.

## PWA
- Simple offline cache for core assets.
- Install prompt via the **Install** button in the header (shows when available).

## Notes
- Tetris/Pong/Brick are stubbed to reuse Snake for now. Replace with real games over time.
- Keep assets lightweight (<1MB per game) for fast loads.
