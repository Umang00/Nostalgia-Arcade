
import { registerPWAInstallPrompt } from './pwa/install';
import { navigate, initRouter } from './router';
import { initHome } from './screens/home';
import { initGameRoute } from './screens/game';

// Simple SPA router init
initRouter({
  '/': initHome,
  '/game/:id': initGameRoute
});

// PWA install button handling
registerPWAInstallPrompt(document.getElementById('installPwaBtn') as HTMLButtonElement);

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Navigate initial
navigate(location.pathname + location.search);
