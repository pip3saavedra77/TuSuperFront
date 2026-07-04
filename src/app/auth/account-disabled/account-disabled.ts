import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-account-disabled',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  templateUrl: './account-disabled.html',
  styleUrl: './account-disabled.scss',
})
export class AccountDisabled {}
