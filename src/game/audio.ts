class AmbientAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private playing = false;
  private _muted = false;

  get muted() {
    return this._muted;
  }

  private ensureContext() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._muted ? 0 : 1;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.22;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);
  }

  async resume() {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        /* ignore */
      }
    }
  }

  startMusic() {
    this.ensureContext();
    if (!this.ctx || this.playing) return;
    void this.resume();
    this.playing = true;

    const ctx = this.ctx;
    const musicGain = this.musicGain!;
    const now = ctx.currentTime;

    // Root pad: two detuned sine/triangle oscillators an octave apart
    const padOscs: [number, OscillatorType, number][] = [
      [110, 'sine', 0.6], // A2
      [110.3, 'sine', 0.5], // slight detune
      [165, 'triangle', 0.18], // E3 fifth
      [220, 'sine', 0.12], // A3
    ];

    for (const [freq, type, level] of padOscs) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(level, now + 6);
      osc.connect(g);
      g.connect(musicGain);
      osc.start(now);
      this.oscillators.push(osc);
    }

    // Slow lowpass sweep for a breathing pad feel
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 600;
    this.padFilter.Q.value = 0.7;

    // LFO modulates the filter cutoff
    this.lfo = ctx.createOscillator();
    this.lfoGain = ctx.createGain();
    this.lfo.frequency.value = 0.07;
    this.lfoGain.gain.value = 300;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.padFilter.frequency);
    this.lfo.start(now);
  }

  stopMusic() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const musicGain = this.musicGain!;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(musicGain.gain.value, now);
    musicGain.gain.linearRampToValueAtTime(0, now + 1.5);

    this.oscillators.forEach((o) => {
      try {
        o.stop(now + 1.6);
      } catch {
        /* already stopped */
      }
    });
    this.oscillators = [];
    try {
      this.lfo?.stop(now + 1.6);
    } catch {
      /* ignore */
    }
    this.lfo = null;
    this.lfoGain = null;
    this.padFilter = null;
    this.playing = false;

    // restore music gain after fade
    setTimeout(() => {
      if (this.musicGain && !this.playing) {
        this.musicGain.gain.value = 0.22;
      }
    }, 1700);
  }

  setMuted(muted: boolean) {
    this._muted = muted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 1, now + 0.25);
    }
  }

  // SFX: a short bell-like tone whose pitch rises with merge tier
  playMerge(tierId: number) {
    this.ensureContext();
    if (!this.ctx || this._muted) return;
    void this.resume();
    const ctx = this.ctx;
    const out = this.sfxGain!;
    const now = ctx.currentTime;

    const baseNotes = [523.25, 587.33, 659.25, 783.99, 987.77, 1174.66]; // C5..D6
    const freq = baseNotes[Math.min(tierId, baseNotes.length - 1)];

    // primary bell
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.7, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc.connect(g);
    g.connect(out);
    osc.start(now);
    osc.stop(now + 1.25);

    // shimmer harmonic
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.25, now + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc2.connect(g2);
    g2.connect(out);
    osc2.start(now);
    osc2.stop(now + 0.95);
  }

  // soft click for selecting cells on the drag path
  playSelect() {
    this.ensureContext();
    if (!this.ctx || this._muted) return;
    void this.resume();
    const ctx = this.ctx;
    const out = this.sfxGain!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 330;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(g);
    g.connect(out);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // gentle ascending sparkle when a top-tier Moonbloom forms
  playWin() {
    this.ensureContext();
    if (!this.ctx || this._muted) return;
    void this.resume();
    const ctx = this.ctx;
    const out = this.sfxGain!;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t = now + i * 0.09;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  }
}

export const ambientAudio = new AmbientAudio();
