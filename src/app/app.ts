import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleService } from './core/services/idle.service';
import { InitService } from './core/services/init.service';
import { LoadingScreen } from './shared/components/loading-screen/loading-screen';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingScreen],
  templateUrl: './app.html'
})
export class App implements OnInit {
  private readonly idleService = inject(IdleService);
  protected readonly initService = inject(InitService);
  protected readonly title = 'adso_3063267';

  ngOnInit(): void {
    this.idleService.startWatching();
  }
}
