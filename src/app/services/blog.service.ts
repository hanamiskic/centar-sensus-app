import { Injectable, EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore, collection, doc, setDoc, getDocs, query, orderBy,
  serverTimestamp, updateDoc, deleteDoc
} from '@angular/fire/firestore';
import {
  Storage, ref, uploadBytes, getDownloadURL, deleteObject
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
  // helper za sigurno izvršavanje AngularFire poziva u injection kontekstu
  private env = inject(EnvironmentInjector);
  private inCtx = <T>(fn: () => Promise<T>) => runInInjectionContext(this.env, fn);

  constructor(private db: Firestore, private storage: Storage) {}

  async listPosts(): Promise<BlogPost[]> {
    const colRef = collection(this.db, 'blog');
    const qy = query(colRef, orderBy('createdAt', 'desc'));

    // ✅ wrap getDocs
    const snap = await this.inCtx(() => getDocs(qy));

    return snap.docs.map(d => {
      const data: any = d.data();
      const createdAt: Date | null = data?.createdAt?.toDate?.() ?? null;
      return {
        id: d.id,
        title: data?.title ?? '',
        content: data?.content ?? '',
        imageUrl: data?.imageUrl ?? '',
        createdAt
      };
    });
  }

  async addPost(form: { title: string; content: string }, file: File): Promise<void> {
    // 1) upload u Storage
    const path = `blog/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const fileRef = ref(this.storage, path);

    // ✅ wrap upload i getDownloadURL
    await this.inCtx(() => uploadBytes(fileRef, file));
    const imageUrl = await this.inCtx(() => getDownloadURL(fileRef));

    // 2) upis u Firestore
    const newDocRef = doc(collection(this.db, 'blog'));

    // ✅ wrap setDoc
    await this.inCtx(() => setDoc(newDocRef, {
      title: form.title.trim(),
      content: form.content.trim(),
      imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
  }

  async updatePost(
    id: string,
    form: { title: string; content: string },
    newFile?: File,
    oldImageUrl?: string
  ): Promise<void> {
    let imageUrlToUse: string | undefined;

    if (newFile) {
      const path = `blog/${Date.now()}_${newFile.name.replace(/\s+/g, '_')}`;
      const fileRef = ref(this.storage, path);

      // ✅ wrap upload i getDownloadURL
      await this.inCtx(() => uploadBytes(fileRef, newFile));
      imageUrlToUse = await this.inCtx(() => getDownloadURL(fileRef));

      if (oldImageUrl) {
        try {
          const oldRef = ref(this.storage, oldImageUrl);
          // ✅ wrap deleteObject
          await this.inCtx(() => deleteObject(oldRef));
        } catch {
          /* ignore */
        }
      }
    }

    const docRef = doc(this.db, 'blog', id);
    // ✅ wrap updateDoc
    await this.inCtx(() => updateDoc(docRef, {
      title: form.title.trim(),
      content: form.content.trim(),
      ...(imageUrlToUse ? { imageUrl: imageUrlToUse } : {}),
      updatedAt: serverTimestamp()
    }));
  }

  async deletePost(id: string, imageUrl?: string): Promise<void> {
    const docRef = doc(this.db, 'blog', id);
    // ✅ wrap deleteDoc
    await this.inCtx(() => deleteDoc(docRef));

    if (imageUrl) {
      try {
        const imgRef = ref(this.storage, imageUrl);
        // ✅ wrap deleteObject
        await this.inCtx(() => deleteObject(imgRef));
      } catch {
        /* ignore */
      }
    }
  }
}
