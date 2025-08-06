import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators'; // Uvezi filter operator

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  standalone: true,
  styleUrl: './app.css',
  template: `
    <router-outlet></router-outlet>
  `,
})
export class App {
  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          if (!document.body.classList.contains('menu-open')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      }
    });
  }
}
