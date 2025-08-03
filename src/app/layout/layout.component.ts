import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';
import { routeAnimations } from '../route-animations';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  animations: [routeAnimations],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  getRouteAnimationState(outlet: RouterOutlet) {
    const state = outlet?.activatedRouteData?.['animation'] || null;
    return state;
  }
}




