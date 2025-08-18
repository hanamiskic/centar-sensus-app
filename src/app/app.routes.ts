import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

/**
 * Glavni router:
 * - LayoutComponent kao shell (header/footer), djeca su stranice
 * - Svaka stranica je lazy-loaded standalone komponenta (loadComponent)
 * - `data.animation` se koristi u routeAnimations triggeru
 * - `title` postavlja <title> u tabu preglednika
 */
export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Početna
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.component').then(m => m.HomeComponent),
        data: { animation: 'Home' },
        title: 'Početna – Centar Sensus',
      },

      // Događaji (lista)
      {
        path: 'events',
        loadComponent: () =>
          import('./pages/events/events.component').then(m => m.EventsComponent),
        data: { animation: 'Dogadaji' },
        title: 'Događaji – Centar Sensus',
      },

      // Događaj (detalj)
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./pages/event-details/event-details.component').then(
            m => m.EventDetailsComponent
          ),
        data: { animation: 'DogadajiDetalji' },
        title: 'Detalji događaja – Centar Sensus',
        // kad se promijeni :id ili query param, ponovno resolveri/hookovi
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
      },

      // Galerija
      {
        path: 'gallery',
        loadComponent: () =>
          import('./pages/gallery/gallery.component').then(m => m.GalleryComponent),
        data: { animation: 'Galerija' },
        title: 'Galerija – Centar Sensus',
      },

      // O nama
      {
        path: 'about',
        loadComponent: () =>
          import('./pages/about/about.component').then(m => m.AboutComponent),
        data: { animation: 'Onama' },
        title: 'O nama – Centar Sensus',
      },

      // Blog
      {
        path: 'blog',
        loadComponent: () =>
          import('./pages/blog/blog.component').then(m => m.BlogComponent),
        data: { animation: 'Blog' },
        title: 'Blog – Centar Sensus',
      },

      // Kontakt
      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact/contact.component').then(m => m.ContactComponent),
        data: { animation: 'Kontakt' },
        title: 'Kontakt – Centar Sensus',
      },

      // Program (detalj)
      {
        path: 'program/:id',
        loadComponent: () =>
          import('./pages/programi/program-details/program-details.component').then(
            m => m.ProgramDetailsComponent
          ),
        data: { animation: 'Program' },
        title: 'Detalji programa – Centar Sensus',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
      },

      // Auth (prijava/registracija)
      {
        path: 'auth',
        loadComponent: () =>
          import('./pages/auth/auth.component').then(m => m.AuthComponent),
        data: { animation: 'Auth' },
        title: 'Prijava / Registracija – Centar Sensus',
      },

      // Profil
      {
        path: 'profil',
        loadComponent: () =>
          import('./pages/profil/profil.component').then(m => m.ProfilComponent),
        data: { animation: 'Profil' },
        title: 'Moj profil – Centar Sensus',
      },

      // Wildcard → početna (ili kasnije 404 komponenta)
      { path: '**', redirectTo: '' },
    ],
  },
];
