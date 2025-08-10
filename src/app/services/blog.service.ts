import { Injectable } from '@angular/core';
import {
  Firestore, collection, doc, setDoc, getDocs, query, orderBy,
  serverTimestamp, updateDoc, deleteDoc
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: Date | null;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  constructor(private db: Firestore, private storage: Storage) {}

  async listPosts(): Promise<BlogPost[]> {
    const colRef = collection(this.db, 'blog');
    const qy = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);

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

  async addPost(
    form: { title: string; content: string },
    file: File
  ): Promise<void> {
    // 1) upload u Storage
    const path = `blog/${Date.now()}_${file.name}`;
    const fileRef = ref(this.storage, path);
    await uploadBytes(fileRef, file);
    const imageUrl = await getDownloadURL(fileRef);

    // 2) upis u Firestore
    const newDocRef = doc(collection(this.db, 'blog'));
    await setDoc(newDocRef, {
      title: form.title.trim(),
      content: form.content.trim(),
      imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  async updatePost(
    id: string,
    form: { title: string; content: string },
    newFile?: File,
    oldImageUrl?: string
  ): Promise<void> {
    let imageUrlToUse: string | undefined;

    // ako je odabrana nova slika – upload i (pokušaj) brisanja stare
    if (newFile) {
      const path = `blog/${Date.now()}_${newFile.name}`;
      const fileRef = ref(this.storage, path);
      await uploadBytes(fileRef, newFile);
      imageUrlToUse = await getDownloadURL(fileRef);

      // obriši staru sliku ako postoji
      if (oldImageUrl) {
        try {
          const oldRef = ref(this.storage, oldImageUrl); // može primiti i https URL
          await deleteObject(oldRef);
        } catch {
          // ako zakaže, samo preskoči – nije kritično
        }
      }
    }

    const docRef = doc(this.db, 'blog', id);
    await updateDoc(docRef, {
      title: form.title.trim(),
      content: form.content.trim(),
      ...(imageUrlToUse ? { imageUrl: imageUrlToUse } : {}),
      updatedAt: serverTimestamp()
    });
  }

  async deletePost(id: string, imageUrl?: string): Promise<void> {
    // obriši dokument
    const docRef = doc(this.db, 'blog', id);
    await deleteDoc(docRef);

    // probaj obrisati i sliku iz Storage-a
    if (imageUrl) {
      try {
        const imgRef = ref(this.storage, imageUrl);
        await deleteObject(imgRef);
      } catch {
        // preskoči ako ne može (npr. URL više ne postoji / permissions)
      }
    }
  }
}
