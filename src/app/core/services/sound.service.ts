import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private ctx: AudioContext | null = null;

  constructor() {
    try {
      this.unlock();
    } catch { /* SSR o navegador sin Web Audio */ }
  }

  private unlock(): void {
    const resume = () => {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      // Tocar buffer mudo para desbloquear iOS
      const buf = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.connect(this.ctx.destination);
      src.start(0); src.stop(0);
      document.removeEventListener('click', resume);
      document.removeEventListener('touchstart', resume);
    };
    document.addEventListener('click', resume);
    document.addEventListener('touchstart', resume);
  }

  private play(frequencies: number[], type: OscillatorType = 'sine', vol = 0.22): void {
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
        if (this.ctx.state === 'suspended') return;
      }
      const now = this.ctx.currentTime;
      const step = 0.12;

      frequencies.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        const t = now + i * step;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch { /* ignorar */ }
  }

  playNewOrder(): void {
    this.play([523.25, 659.25, 783.99]); // C5 E5 G5
  }

  playStatusChange(): void {
    this.play([659.25, 523.25]); // E5 C5
  }
}
