import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Storage, ref, listAll, getDownloadURL, uploadBytes, deleteObject } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private env = inject(EnvironmentInjector);
  constructor(private storage: Storage) {}

  /** Helper: izvrši async poziv unutar Angular injection konteksta */
  private inCtx<T>(fn: () => Promise<T>): Promise<T> {
    return runInInjectionContext(this.env, fn);
  }

  /** Vrati sve URL-ove iz foldera 'galerija' (nazivi s timestampom — sortiranje radi reverse). */
  async listGallery(): Promise<string[]> {
    return this.inCtx(async () => {
      const folderRef = ref(this.storage, 'galerija');

      // listAll u kontekstu
      const res = await this.inCtx(() => listAll(folderRef));

      // svaki getDownloadURL wrap-an u kontekst
      const urls = await Promise.all(
        res.items.map(it => this.inCtx(() => getDownloadURL(it)))
      );

      return urls;
    });
  }

  /** Upload jedne slike u 'galerija/' i vrati download URL. */
  async uploadToGallery(file: File): Promise<string> {
    return this.inCtx(async () => {
      const path = `galerija/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const fileRef = ref(this.storage, path);

      await this.inCtx(() => uploadBytes(fileRef, file));
      const url = await this.inCtx(() => getDownloadURL(fileRef));
      return url;
    });
  }

  /**
   * Brisanje slike prema njenom HTTPS URL-u.
   * Napomena: izvlačimo 'o/<PATH>?token=' dio iz URL-a kao storage path.
   */
  async deleteImageByUrl(url: string): Promise<void> {
    return this.inCtx(async () => {
      const encodedPath = url.split('/o/')[1]?.split('?')[0];
      if (!encodedPath) return;
      const path = decodeURIComponent(encodedPath);
      const fileRef = ref(this.storage, path);
      await this.inCtx(() => deleteObject(fileRef));
    });
  }
}
