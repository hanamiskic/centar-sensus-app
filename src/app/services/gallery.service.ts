// src/app/services/gallery.service.ts
import {
  Injectable, inject, EnvironmentInjector, runInInjectionContext
} from '@angular/core';
import {
  Storage, ref, listAll, getDownloadURL, uploadBytes, deleteObject
} from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private env = inject(EnvironmentInjector);
  constructor(private storage: Storage) {}

  /** Helper: izvrši zadani async poziv unutar AF injection konteksta */
  private inCtx<T>(fn: () => Promise<T>) {
    return runInInjectionContext(this.env, fn);
  }

  listGallery(): Promise<string[]> {
    return this.inCtx(async () => {
      const folderRef = ref(this.storage, 'galerija');

      // AF poziv u kontekstu
      const res = await this.inCtx(() => listAll(folderRef));

      // ❗ važno: i svaki getDownloadURL wrapati u kontekst
      const urls = await Promise.all(
        res.items.map(it => this.inCtx(() => getDownloadURL(it)))
      );
      return urls;
    });
  }

  uploadToGallery(file: File): Promise<string> {
    return this.inCtx(async () => {
      const path = `galerija/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const fileRef = ref(this.storage, path);

      await this.inCtx(() => uploadBytes(fileRef, file));
      return this.inCtx(() => getDownloadURL(fileRef));
    });
  }

  deleteImageByUrl(url: string): Promise<void> {
    return this.inCtx(async () => {
      // ako imaš path već – koristi ga direktno
      const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
      const fileRef = ref(this.storage, path);
      await this.inCtx(() => deleteObject(fileRef));
    });
  }
}
