import { Component } from '@angular/core';
import { UsersListComponent } from './components/users-list/users-list.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [UsersListComponent],
  template: `<app-users-list></app-users-list>`,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class Users {}
