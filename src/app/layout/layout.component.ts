import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';
import { routeAnimations } from '../route-animations';

/**
 * Layout shell aplikacije:
 * - fiksni header i footer
 * - <router-outlet> u sredini s animacijama između ruta
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  animations: [routeAnimations],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements AfterViewInit {
  constructor(private readonly cdr: ChangeDetectorRef) {}

  // Spriječi ExpressionChanged... kod route animacija u dev modu
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  // Vraća naziv animacije s rute (ili null ako nije postavljeno)
  getRouteAnimationState(outlet: RouterOutlet): string | null {
    return outlet?.activatedRouteData?.['animation'] ?? null;
  }
}
