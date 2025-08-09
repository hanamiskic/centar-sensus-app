// src/app/services/gallery.service.ts
import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Storage, ref, listAll, getDownloadURL, uploadBytes, deleteObject } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private injector = inject(EnvironmentInjector);

  listGallery(): Promise<string[]> {
    return runInInjectionContext(this.injector, async () => {
      const storage = inject(Storage);
      const folderRef = ref(storage, 'galerija');
      const res = await listAll(folderRef);
      return Promise.all(res.items.map(it => getDownloadURL(it)));
    });
  }

  uploadToGallery(file: File): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const storage = inject(Storage);
      const path = `galerija/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    });
  }

  deleteImageByUrl(url: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const storage = inject(Storage);
      // ako imaš path već – koristi ref(storage, path)
      const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]); // fallback
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
    });
  }
}
