/** Simple audio manager using WebAudio for nostalgic 8-bit style bleeps.
 * Persists mute/volume in localStorage and exposes play hooks.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = false;
  private volume = 0.5; // 0..1
  private musicTimer: number | null = null;

  private ensure() {
    if (this.ctx) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = this.getStoredVolume();
    const musicGain = ctx.createGain();
    musicGain.gain.value = 0.25; // music a bit lower than sfx
    musicGain.connect(master);
    master.connect(ctx.destination);
    this.ctx = ctx; this.master = master; this.musicGain = musicGain;
    const muted = localStorage.getItem('audio_muted');
    if (muted) this.setMuted(muted === 'true');
  }

  private getStoredVolume(): number {
    const raw = localStorage.getItem('audio_volume');
    const v = raw ? Number(raw) : this.volume;
    this.volume = Math.max(0, Math.min(1, isNaN(v) ? 0.5 : v));
    return this.volume;
  }

  setMuted(m: boolean) {
    this.ensure();
    this.muted = m;
    localStorage.setItem('audio_muted', String(m));
    if (this.master) this.master.gain.value = m ? 0 : this.volume;
  }
  isMuted() { return this.muted; }

  setVolume(v: number) {
    this.ensure();
    this.volume = Math.max(0, Math.min(1, v));
    localStorage.setItem('audio_volume', String(this.volume));
    if (!this.muted && this.master) this.master.gain.value = this.volume;
  }
  getVolume() { return this.volume; }

  private tone(freq: number, durationMs: number, type: OscillatorType = 'square', gain = 0.2, toMusicBus = false) {
    this.ensure();
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.value = gain;
    if (toMusicBus && this.musicGain) g.connect(this.musicGain); else g.connect(this.master);
    osc.connect(g);
    const now = this.ctx.currentTime;
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  }

  play(name: 'move' | 'rotate' | 'drop' | 'hard' | 'clear' | 'gameover') {
    if (this.muted) return;
    switch (name) {
      case 'move': this.tone(420, 40, 'square', 0.1); break;
      case 'rotate': this.tone(620, 60, 'triangle', 0.12); break;
      case 'drop': this.tone(300, 60, 'square', 0.14); break;
      case 'hard': this.tone(180, 80, 'sawtooth', 0.16); break;
      case 'clear': {
        this.tone(880, 80, 'square', 0.14);
        setTimeout(() => this.tone(990, 90, 'square', 0.12), 60);
        break;
      }
      case 'gameover': {
        this.tone(400, 150, 'sawtooth', 0.15);
        setTimeout(() => this.tone(260, 300, 'triangle', 0.12), 120);
        break;
      }
    }
  }

  startMusic() {
    this.ensure();
    if (!this.ctx || this.musicTimer) return;
    // Simple looping chiptune arpeggio
    const pattern = [523, 659, 784, 659, 523, 587, 698, 587]; // C5 E5 G5 ...
    let i = 0;
    this.musicTimer = window.setInterval(() => {
      if (this.muted) return;
      this.tone(pattern[i % pattern.length], 140, 'triangle', 0.08, true);
      i++;
    }, 180);
  }
  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}

export const audio = new AudioManager();


