import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="page-shell">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .page-shell {
      padding-top: 72px;
      min-height: 100vh;
    }
  `]
})
export class AppComponent {}
