import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { DogadajiComponent } from './pages/dogadaji/dogadaji.component';
import { GalerijaComponent } from './pages/galerija/galerija.component';
import { OnamaComponent } from './pages/onama/onama.component';
import { KontaktComponent } from './pages/kontakt/kontakt.component';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, data: { animation: 'Home' } },
      { path: 'dogadaji', component: DogadajiComponent, data: { animation: 'Dogadaji' } },
      { path: 'galerija', component: GalerijaComponent, data: { animation: 'Galerija' } },
      { path: 'onama', component: OnamaComponent, data: { animation: 'Onama' } },
      { path: 'kontakt', component: KontaktComponent, data: { animation: 'Kontakt' } },
    ],
  },
];
