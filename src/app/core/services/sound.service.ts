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

  /** Espera la primera interacción del usuario para desbloquear audio */
  private listenForUnlock(): void {
    const events = ['click', 'touchstart', 'keydown'] as const;
    const handler = () => {
      if (this.unlocked) return;
      try {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        // Crear un buffer silencioso para "calentar" el contexto
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

  /** Sonido para nuevo pedido (tendero) — chime ascendente alegre */
  playNewOrder(): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      const notes = [
        { freq: 523.25, start: 0,    dur: 0.15 },
        { freq: 659.25, start: 0.12, dur: 0.15 },
        { freq: 783.99, start: 0.24, dur: 0.3  },
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
      // Silently ignore
    }
  }

  /** Sonido para cambio de estado (usuario) — notificación suave de dos tonos */
  playStatusChange(): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      const notes = [
        { freq: 783.99, start: 0,    dur: 0.12 },
        { freq: 987.77, start: 0.1,  dur: 0.25 },
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
