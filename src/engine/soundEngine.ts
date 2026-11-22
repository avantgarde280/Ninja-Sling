import type {MaterialType, NinjaType} from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastStretchAt = 0;
  private lastImpactAt = 0;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  unlock(): void {
    this.ensureContext();
  }

  playUiClick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.05);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  playStretch(ratio: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const perfNow = performance.now();
    if (perfNow - this.lastStretchAt < 85) return;
    this.lastStretchAt = perfNow;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    const baseFreq = 110 + ratio * 150;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq + 25, now + 0.045);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playLaunch(ninjaType: NinjaType): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Elastic snap + wind whoosh
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const pitch = ninjaType === 'oni_buster' ? 160 : ninjaType === 'kunoichi' ? 320 : 240;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 2.4, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.26);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.29);

    // Filtered noise burst for air slice
    this.playNoiseBurst(0.18, 900, 2200, 0.09);
  }

  playAbility(ninjaType: NinjaType): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (ninjaType === 'oni_buster') {
      this.playExplosion();
      return;
    }

    if (ninjaType === 'kunoichi') {
      // Triple metallic shuriken chimes
      [0, 0.045, 0.09].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(980 + idx * 240, now + delay);
        osc.frequency.exponentialRampToValueAtTime(1650 + idx * 220, now + delay + 0.09);
        gain.gain.setValueAtTime(0.09, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.11);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      });
      return;
    }

    if (ninjaType === 'tengu') {
      // Steep supersonic dive whistle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 750;
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
      return;
    }

    // Shadow Shinobi Dash
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(1120, now + 0.11);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
    this.playNoiseBurst(0.14, 1400, 3400, 0.11);
  }

  playImpact(material: MaterialType, intensity: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const perfNow = performance.now();
    if (perfNow - this.lastImpactAt < 38) return;
    this.lastImpactAt = perfNow;

    const now = ctx.currentTime;
    const vol = Math.min(0.18, 0.03 + intensity * 0.12);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (material === 'ice') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1250 + Math.random() * 450, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);
    } else if (material === 'stone') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(115 + Math.random() * 35, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.11);
    } else if (material === 'bamboo') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360 + Math.random() * 90, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.07);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(195 + Math.random() * 60, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.08);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playBreak(material: MaterialType): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (material === 'ice') {
      this.playNoiseBurst(0.16, 2200, 5200, 0.13);
    } else if (material === 'stone') {
      this.playNoiseBurst(0.22, 180, 700, 0.16);
    } else {
      this.playNoiseBurst(0.14, 480, 1600, 0.14);
    }
  }

  playExplosion(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Deep sub-bass punch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.42);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);

    this.playNoiseBurst(0.38, 120, 1400, 0.24);
  }

  playEnemyDefeat(isBoss: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isBoss ? [330, 440, 660, 880] : [440, 660];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.12, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Pentatonic victory fanfare (D - F# - A - B - D5)
    const freqs = [293.66, 369.99, 440, 493.88, 587.33];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  playDefeat(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [261.63, 233.08, 196.0, 146.83];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.14;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  private playNoiseBurst(duration: number, lowFreq: number, highFreq: number, volume: number): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((lowFreq + highFreq) * 0.5, ctx.currentTime);
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  }
}

export const soundEngine = new SoundEngine();
