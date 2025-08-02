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
      { path: '', component: HomeComponent },
      { path: 'dogadaji', component: DogadajiComponent },
      { path: 'galerija', component: GalerijaComponent },
      { path: 'onama', component: OnamaComponent },
      { path: 'kontakt', component: KontaktComponent },
    ],
  },
];
