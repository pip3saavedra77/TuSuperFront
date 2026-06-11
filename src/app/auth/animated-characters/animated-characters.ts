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

  private blinkTimeouts: number[] = [];
  private peekTimeout: number | null = null;

  constructor() {
    this.startBlinking('green');
    this.startBlinking('darkGreen');
  }

  ngOnDestroy(): void {
    this.blinkTimeouts.forEach(id => clearTimeout(id));
    if (this.peekTimeout) clearTimeout(this.peekTimeout);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);
  }

  private startBlinking(character: 'green' | 'darkGreen'): void {
    const schedule = () => {
      const interval = Math.random() * 4000 + 3000;
      const timeout = window.setTimeout(() => {
        if (character === 'green') {
          this.isGreenBlinking.set(true);
          window.setTimeout(() => {
            this.isGreenBlinking.set(false);
            schedule();
          }, 150);
        } else {
          this.isDarkGreenBlinking.set(true);
          window.setTimeout(() => {
            this.isDarkGreenBlinking.set(false);
            schedule();
          }, 150);
        }
      }, interval);
      this.blinkTimeouts.push(timeout);
    };
    schedule();
  }

  // When typing starts, characters look at each other briefly
  typingEffect(): void {
    this.isLookingAtEachOther.set(true);
    const timeout = window.setTimeout(() => {
      this.isLookingAtEachOther.set(false);
    }, 800);
    this.blinkTimeouts.push(timeout);
  }

  // Green peeking when password is visible
  peekingEffect(): void {
    if (this.peekTimeout) clearTimeout(this.peekTimeout);
    const schedulePeek = () => {
      this.peekTimeout = window.setTimeout(() => {
        this.isGreenPeeking.set(true);
        window.setTimeout(() => {
          this.isGreenPeeking.set(false);
        }, 800);
      }, Math.random() * 3000 + 2000);
    };
    schedulePeek();
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

  // Eye position calculation
  calculateEyePosition(ref: ElementRef<HTMLDivElement> | HTMLDivElement | undefined, maxDistance: number): { x: number; y: number } {
    const el = ref instanceof ElementRef ? ref.nativeElement : ref;
    if (!el) return { x: 0, y: 0 };

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = this.mouseX() - centerX;
    const deltaY = this.mouseY() - centerY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }

  // For forced look direction (when turning away or looking at each other)
  getForcedLook(lookType: 'away' | 'eachOther' | 'peeking' | undefined): { x: number; y: number } | null {
    if (!lookType) return null;
    if (lookType === 'away') return { x: -4, y: -4 };
    if (lookType === 'eachOther') return { x: 3, y: 4 };
    if (lookType === 'peeking') return { x: 4, y: 5 };
    return null;
  }
}
