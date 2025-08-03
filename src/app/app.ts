import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
  protected readonly title = signal('centar-sensus-app');
}
