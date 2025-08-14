import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling} from '@angular/router';
import { routes } from './app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // Globalni listeneri + manje CD ciklusa
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true,
    }),

    // Router: restore scroll pozicije i podrži #ankere
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),

    // Animacije: lazy-load engine (manji initial bundle, sve animacije i dalje rade)
    provideAnimationsAsync(),

    // Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFunctions(() =>
      getFunctions(
        undefined,
        (environment as any)?.firebase?.functionsRegion ?? 'europe-west1'
      )
    ),
  ],
};
