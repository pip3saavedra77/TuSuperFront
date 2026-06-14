import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /** Sonido para nuevo pedido (tendero) — chime ascendente alegre */
  playNewOrder(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const notes = [
        { freq: 523.25, start: 0,    dur: 0.15 }, // C5
        { freq: 659.25, start: 0.12, dur: 0.15 }, // E5
        { freq: 783.99, start: 0.24, dur: 0.3  }, // G5
      ];

      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        gain.gain.setValueAtTime(0, now + note.start);
        gain.gain.linearRampToValueAtTime(0.25, now + note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.start);
        osc.stop(now + note.start + note.dur);
      }
    } catch {
      // Silently ignore — browser may block audio without user gesture
    }
  }

  /** Sonido para cambio de estado (usuario) — notificación suave de dos tonos */
  playStatusChange(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const notes = [
        { freq: 783.99, start: 0,    dur: 0.12 }, // G5
        { freq: 987.77, start: 0.1,  dur: 0.25 }, // B5
      ];

      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        gain.gain.setValueAtTime(0, now + note.start);
        gain.gain.linearRampToValueAtTime(0.2, now + note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.start);
        osc.stop(now + note.start + note.dur);
      }
    } catch {
      // Silently ignore
    }
  }
}
