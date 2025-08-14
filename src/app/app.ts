import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  styleUrls: ['./app.css'],
  template: `<router-outlet></router-outlet>`,
})
export class App {
  constructor(private router: Router) {
    // Nakon svake uspješne navigacije skrolaj na vrh,
    // osim kad je otvoren mobilni meni (body.menu-open).
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        // Pričekaj jedan frame da se novi view izmjeri/posloži
        requestAnimationFrame(() => {
          if (!document.body.classList.contains('menu-open')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });
  }
}
