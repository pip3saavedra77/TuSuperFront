import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private unlocked = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      this.listenForUnlock();
    }
  }

  private listenForUnlock(): void {
    const events = ['click', 'touchstart', 'keydown'] as const;
    const handler = () => {
      if (this.unlocked) return;
      try {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        source.stop(0);
        this.unlocked = true;
      } catch {
        // Ignorar
      }
      if (this.unlocked) {
        for (const ev of events) {
          document.removeEventListener(ev, handler);
        }
      }
    };
    for (const ev of events) {
      document.addEventListener(ev, handler);
    }
  }

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /** Sonido nuevo pedido (tendero/admin) — chime ascendente alegre */
  playNewOrder(): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      const notes = [
        { freq: 523.25, start: 0,    dur: 0.15 }, // C5
        { freq: 659.25, start: 0.12, dur: 0.15 }, // E5
        { freq: 783.99, start: 0.24, dur: 0.35 }, // G5 (sostenido)
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
        osc.stop(now + note.start + note.dur + 0.05);
      }
    } catch {
      // Silently ignore
    }
  }

  /** Sonido cambio de estado (cliente) — dos tonos descendentes audibles */
  playStatusChange(): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      // Dos tonos en rango medio, bien audibles
      const notes = [
        { freq: 659.25, start: 0,    dur: 0.18 }, // E5
        { freq: 523.25, start: 0.15, dur: 0.25 }, // C5
      ];

      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        gain.gain.setValueAtTime(0, now + note.start);
        gain.gain.linearRampToValueAtTime(0.3, now + note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.start);
        osc.stop(now + note.start + note.dur + 0.05);
      }
    } catch {
      // Silently ignore
    }
  }
}
