import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleService } from './core/services/idle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html'
})
export class App implements OnInit {
  private readonly idleService = inject(IdleService);
  protected readonly title = signal('adso_3063267');

  ngOnInit(): void {
    this.idleService.startWatching();
  }
}
