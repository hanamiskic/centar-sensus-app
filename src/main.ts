import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// Bootstrap standalone aplikacije.
// Greške tijekom boota prepusti globalnim error listenerima iz app.config-a.
bootstrapApplication(App, appConfig).catch(() => {
});
