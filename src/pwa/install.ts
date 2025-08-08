
export function registerPWAInstallPrompt(btn: HTMLButtonElement) {
  let deferredPrompt: any = null;
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btn) btn.classList.remove('hidden');
  });
  btn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn?.classList.add('hidden');
  });
}
