import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleService } from './core/services/idle.service';
import { AuthService } from './core/services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html'
})
export class App implements OnInit {
  private readonly idleService = inject(IdleService);
  private readonly authService = inject(AuthService);
  protected readonly title = 'adso_3063267';

  ngOnInit(): void {
    this.idleService.startWatching();
    if (this.authService.getToken()) {
      this.authService.checkAuthStatus().subscribe();
    }
  }
}
