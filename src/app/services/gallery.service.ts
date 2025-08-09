// gallery.service.ts
import { Injectable } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject
} from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  constructor(private storage: Storage) {}

  // Brže dohvaćanje svih slika (paralelno)
  async listGallery(): Promise<string[]> {
    const folderRef = ref(this.storage, 'galerija');
    const res = await listAll(folderRef);

    // Umjesto await u petlji — radimo Promise.all
    return Promise.all(res.items.map((item) => getDownloadURL(item)));
  }

  async uploadToGallery(file: File): Promise<string> {
    const path = `galerija/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const fileRef = ref(this.storage, path);

    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  async deleteImageByUrl(url: string): Promise<void> {
    const path = this.extractPathFromUrl(url);
    const fileRef = ref(this.storage, path);
    await deleteObject(fileRef);
  }

  private extractPathFromUrl(url: string): string {
    const match = url.match(/\/o\/(.*?)\?/);
    if (!match || match.length < 2) throw new Error('Ne mogu izvući putanju iz URL-a');
    return decodeURIComponent(match[1]);
  }
}
