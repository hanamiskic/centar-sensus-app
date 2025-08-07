import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { 
        path: '', 
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), 
        data: { animation: 'Home' } 
      },
      { 
        path: 'dogadaji', 
        loadComponent: () => import('./pages/dogadaji/dogadaji.component').then(m => m.DogadajiComponent), 
        data: { animation: 'Dogadaji' } 
      },
      { 
        path: 'galerija', 
        loadComponent: () => import('./pages/galerija/galerija.component').then(m => m.GalerijaComponent), 
        data: { animation: 'Galerija' } 
      },
      { 
        path: 'onama', 
        loadComponent: () => import('./pages/onama/onama.component').then(m => m.OnamaComponent), 
        data: { animation: 'Onama' } 
      },
      { 
        path: 'kontakt', 
        loadComponent: () => import('./pages/kontakt/kontakt.component').then(m => m.KontaktComponent), 
        data: { animation: 'Kontakt' } 
      },
      { 
        path: 'program/:id', 
        loadComponent: () => import('./pages/programi/detaljiprograma/detaljiprograma.component').then(m => m.DetaljiProgramaComponent), 
        data: { animation: 'Program' } 
      },
      { 
        path: 'auth', 
        loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent), 
        data: { animation: 'Auth' } 
      },
      { 
        path: 'profil', 
        loadComponent: () => import('./pages/profil/profil.component').then(m => m.ProfilComponent), 
        data: { animation: 'Profil' } 
      }
    ],
  },
];