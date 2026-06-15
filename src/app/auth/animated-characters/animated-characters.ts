import { Component, ElementRef, Input, ViewChild, HostListener, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FacePosition {
  faceX: number;
  faceY: number;
  bodySkew: number;
}

@Component({
  selector: 'app-animated-characters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animated-characters.html',
  styleUrl: './animated-characters.scss',
})
export class AnimatedCharacters implements OnDestroy {
  @Input() hidePassword = true;
  @Input() isTyping = false;
  @Input() passwordLength = 0;

  @ViewChild('greenRef', { static: false }) greenRef!: ElementRef<HTMLDivElement>;
  @ViewChild('darkGreenRef', { static: false }) darkGreenRef!: ElementRef<HTMLDivElement>;
  @ViewChild('lightGreenRef', { static: false }) lightGreenRef!: ElementRef<HTMLDivElement>;
  @ViewChild('limeRef', { static: false }) limeRef!: ElementRef<HTMLDivElement>;

  mouseX = signal(0);
  mouseY = signal(0);
  isGreenBlinking = signal(false);
  isDarkGreenBlinking = signal(false);
  isLookingAtEachOther = signal(false);
  isGreenPeeking = signal(false);

  private readonly blinkTimeoutIds: number[] = [];
  private readonly peekTimeoutId: number | null = null;

  constructor() {
    this.startBlinking('green');
    this.startBlinking('darkGreen');
  }

  ngOnDestroy(): void {
    this.blinkTimeoutIds.forEach(id => clearTimeout(id));
    if (this.peekTimeoutId) clearTimeout(this.peekTimeoutId);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);
  }

  private startBlinking(character: 'green' | 'darkGreen'): void {
    const schedule = () => {
      const interval = Math.random() * 4000 + 3000;
      const timeout = globalThis.setTimeout(() => {
        if (character === 'green') {
          this.isGreenBlinking.set(true);
          globalThis.setTimeout(() => {
            this.isGreenBlinking.set(false);
            schedule();
          }, 150);
        } else {
          this.isDarkGreenBlinking.set(true);
          globalThis.setTimeout(() => {
            this.isDarkGreenBlinking.set(false);
            schedule();
          }, 150);
        }
      }, interval);
      this.blinkTimeoutIds.push(timeout);
    };
    schedule();
  }

  calculatePosition(ref: ElementRef<HTMLDivElement> | HTMLDivElement | undefined): FacePosition {
    const el = ref instanceof ElementRef ? ref.nativeElement : ref;
    if (!el) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;

    const deltaX = this.mouseX() - centerX;
    const deltaY = this.mouseY() - centerY;

    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  }

  get passwordVisible(): boolean {
    return this.passwordLength > 0 && !this.hidePassword;
  }

  get passwordHidden(): boolean {
    return this.passwordLength > 0 && this.hidePassword;
  }

  calculateEyePosition(ref: ElementRef<HTMLDivElement> | HTMLDivElement | undefined, maxDistance: number): { x: number; y: number } {
    const el = ref instanceof ElementRef ? ref.nativeElement : ref;
    if (!el) return { x: 0, y: 0 };

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = this.mouseX() - centerX;
    const deltaY = this.mouseY() - centerY;
    const distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }

  getForcedLook(lookType: 'away' | 'eachOther' | 'peeking' | undefined): { x: number; y: number } | null {
    if (!lookType) return null;
    if (lookType === 'away') return { x: -4, y: -4 };
    if (lookType === 'eachOther') return { x: 3, y: 4 };
    if (lookType === 'peeking') return { x: 4, y: 5 };
    return null;
  }
}
