/**
 * Mesin Suara Prosedural Real-Time (Web Audio API) bergaya Age of Empires RTS.
 * Murni kalkulasi gelombang suara matematis (osilator + gain), tanpa berkas audio eksternal.
 * 100% luring (offline) dan tidak membebani jaringan.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try {
      const saved = localStorage.getItem('aoe_sound_muted');
      if (saved !== null) this.muted = saved === 'true';
    } catch {
      // Abaikan jika localStorage dilarang di mode file://
    }
  }

  #ensure() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('aoe_sound_muted', String(this.muted));
    } catch {}
    if (!this.muted) this.playClick();
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /** Klik tombol kayu / batu RTS */
  playClick() {
    if (this.muted) return;
    const ctx = this.#ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Denting kilauan bioluminesensi Kunang-Kunang (Firefly Flash) */
  playChime() {
    if (this.muted) return;
    const ctx = this.#ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [587.33, 880, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  /** Pulsa sonar ultrasonik Kelelawar (Bat Echolocation Ping) */
  playPing() {
    if (this.muted) return;
    const ctx = this.#ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(3200, now + 0.06);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** Satu seruan gagak serak sebagai penanda transisi adegan. */
  playCrow() {
    if (this.muted) return;
    const ctx = this.#ensure();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.62;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    const croak = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    croak.type = 'sawtooth';
    croak.frequency.setValueAtTime(520, now);
    croak.frequency.exponentialRampToValueAtTime(190, now + duration);
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(680, now);
    filter.frequency.exponentialRampToValueAtTime(230, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    croak.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    croak.start(now);
    source.stop(now + duration);
    croak.stop(now + duration);
  }

  /** Denting benturan pedang besi RTS (Mulai Adu / Duel) */
  playSword() {
    if (this.muted) return;
    const ctx = this.#ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Komponen logam tajam
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(987, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /** Trompet megah pergantian Era / Zaman (Age of Empires Fanfare) */
  playHorn() {
    if (this.muted) return;
    const ctx = this.#ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const melody = [
      { f: 261.63, d: 0.18 }, // C4
      { f: 329.63, d: 0.18 }, // E4
      { f: 392.00, d: 0.22 }, // G4
      { f: 523.25, d: 0.45 }  // C5
    ];

    let t = now;
    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.linearRampToValueAtTime(0.11, t + note.d * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 0.85;
    });
  }

  /** Kemenangan perang strategi (Victory Fanfare) */
  playVictory() {
    if (this.muted) return;
    const ctx = this.#ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const fanfare = [
      { f: 392.00, d: 0.12 }, // G4
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.14 }, // E5
      { f: 783.99, d: 0.40 }  // G5
    ];

    let t = now;
    fanfare.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + n.d);
      t += n.d * 0.75;
    });
  }
}

export const sound = new SoundEngine();
