
type EventName = 'game_start' | 'game_end' | 'score' | 'share_clicked' | 'pwa_install';
export function track(event: EventName, props: Record<string, any> = {}) {
  // Console for dev
  console.log('[analytics]', event, props);
  // Plausible support (optional)
  const w:any = window as any;
  if (w.plausible) {
    w.plausible(event, { props });
  }
}
