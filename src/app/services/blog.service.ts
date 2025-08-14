import { Injectable, EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: Date | null;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  // Sigurno izvršavanje AngularFire poziva u injection kontekstu
  private env = inject(EnvironmentInjector);
  private inCtx = <T>(fn: () => Promise<T>) => runInInjectionContext(this.env, fn);

  constructor(private db: Firestore, private storage: Storage) {}

  /** Učitaj sve postove, sortirano po datumu DESC. */
  async listPosts(): Promise<BlogPost[]> {
    const colRef = collection(this.db, 'blog');
    const qy = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await this.inCtx(() => getDocs(qy));

    return snap.docs.map(d => {
      const data: any = d.data();
      const createdAt: Date | null = data?.createdAt?.toDate?.() ?? null; // Timestamp → Date
      return {
        id: d.id,
        title: data?.title ?? '',
        content: data?.content ?? '',
        imageUrl: data?.imageUrl ?? '',
        createdAt,
      };
    });
  }

  /** Dodaj novi post: upload slike → upis dokumenta s imageUrl i timestampovima. */
  async addPost(form: { title: string; content: string }, file: File): Promise<void> {
    const safeName = file.name.replace(/\s+/g, '_');
    const path = `blog/${Date.now()}_${safeName}`;
    const fileRef = ref(this.storage, path);

    await this.inCtx(() => uploadBytes(fileRef, file, { contentType: file.type }));
    const imageUrl = await this.inCtx(() => getDownloadURL(fileRef));

    const newDocRef = doc(collection(this.db, 'blog'));
    await this.inCtx(() =>
      setDoc(newDocRef, {
        title: form.title.trim(),
        content: form.content.trim(),
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  }

  /** Uredi postojeći post; ako je dodana nova slika, uploadaj je i obriši staru. */
  async updatePost(
    id: string,
    form: { title: string; content: string },
    newFile?: File,
    oldImageUrl?: string
  ): Promise<void> {
    let imageUrlToUse: string | undefined;

    if (newFile) {
      const safeName = newFile.name.replace(/\s+/g, '_');
      const path = `blog/${Date.now()}_${safeName}`;
      const fileRef = ref(this.storage, path);

      await this.inCtx(() => uploadBytes(fileRef, newFile, { contentType: newFile.type }));
      imageUrlToUse = await this.inCtx(() => getDownloadURL(fileRef));

      if (oldImageUrl) {
        try {
          const oldRef = ref(this.storage, oldImageUrl); // podržava i full download URL
          await this.inCtx(() => deleteObject(oldRef));
        } catch {
          /* ignore */
        }
      }
    }

    const docRef = doc(this.db, 'blog', id);
    await this.inCtx(() =>
      updateDoc(docRef, {
        title: form.title.trim(),
        content: form.content.trim(),
        ...(imageUrlToUse ? { imageUrl: imageUrlToUse } : {}),
        updatedAt: serverTimestamp(),
      })
    );
  }

  /** Obriši post; potom (best-effort) obriši i sliku. */
  async deletePost(id: string, imageUrl?: string): Promise<void> {
    const docRef = doc(this.db, 'blog', id);
    await this.inCtx(() => deleteDoc(docRef));

    if (imageUrl) {
      try {
        const imgRef = ref(this.storage, imageUrl);
        await this.inCtx(() => deleteObject(imgRef));
      } catch {
        /* ignore */
      }
    }
  }
}
