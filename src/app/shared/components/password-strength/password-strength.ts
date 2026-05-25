import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PasswordStrengthResult {
  score: number; // 0–4
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = [
    { label: 'Al menos 8 caracteres', passed: password.length >= 8 },
    { label: 'Letra mayúscula', passed: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', passed: /[a-z]/.test(password) },
    { label: 'Número', passed: /\d/.test(password) },
    { label: 'Símbolo especial', passed: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/;'`~]/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = password.length === 0 ? 0 : Math.min(4, Math.floor((passedCount / 5) * 4) + (password.length >= 12 ? 1 : 0));
  const clampedScore = Math.min(4, score);

  const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#059669'];

  return {
    score: clampedScore,
    label: labels[clampedScore],
    color: colors[clampedScore],
    checks,
  };
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (password()) {
      <div class="strength-wrapper">
        <div class="strength-bar-track">
          @for (seg of segments; track seg; let i = $index) {
            <div
              class="strength-segment"
              [class.filled]="i < strength().score"
              [style.background-color]="i < strength().score ? strength().color : '#e5e7eb'">
            </div>
          }
        </div>
        <span class="strength-label" [style.color]="strength().color">
          {{ strength().label }}
        </span>

        <ul class="strength-checks">
          @for (check of strength().checks; track check.label) {
            <li [class.passed]="check.passed">
              <span class="check-icon">{{ check.passed ? '✓' : '○' }}</span>
              {{ check.label }}
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: [`
    .strength-wrapper {
      margin-top: 8px;
    }
    .strength-bar-track {
      display: flex;
      gap: 4px;
      height: 6px;
      margin-bottom: 6px;
    }
    .strength-segment {
      flex: 1;
      border-radius: 3px;
      transition: background-color 0.25s ease;
    }
    .strength-label {
      font-size: 0.75rem;
      font-weight: 600;
      display: block;
      margin-bottom: 6px;
    }
    .strength-checks {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
    }
    .strength-checks li {
      font-size: 0.7rem;
      color: #9ca3af;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: color 0.2s;
    }
    .strength-checks li.passed {
      color: #059669;
    }
    .check-icon {
      font-size: 0.8rem;
      width: 12px;
      display: inline-block;
      text-align: center;
    }
  `],
})
export class PasswordStrengthComponent {
  password = input<string>('');
  readonly segments = [0, 1, 2, 3];

  strength() {
    return evaluatePasswordStrength(this.password() ?? '');
  }
}
