import { Injectable } from '@angular/core';
import {
  Firestore, doc, docData, setDoc, collection, collectionData, addDoc,
  updateDoc, deleteDoc, getDoc, query, orderBy, serverTimestamp
} from '@angular/fire/firestore';
import {
  Storage, ref, uploadBytes, getDownloadURL, deleteObject
} from '@angular/fire/storage';

export type ProgramDoc = {
  id?: string;               // slug (npr. 'programi-za-odrasle')
  title: string;
  order?: number;
  active?: boolean;
  heroImageUrl?: string;
};

export type SubprogramDoc = {
  id?: string;
  subtitle: string;
  description: string;
  imageUrl?: string;
  imagePath?: string;        // path u Storageu (radi brisanja)
  order?: number;
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

@Injectable({ providedIn: 'root' })
export class ProgramsService {
  constructor(private db: Firestore, private storage: Storage) {}

  // ---- kolekcije/refovi ----
  private progRef(id: string) { return doc(this.db, 'programs', id); }
  private subCol(programId: string) { return collection(this.db, `programs/${programId}/subprograms`); }
  private subRef(programId: string, subId: string) { return doc(this.db, `programs/${programId}/subprograms/${subId}`); }

  // ---- čitanje ----
  getProgram(id: string) {
    return docData(this.progRef(id), { idField: 'id' }) as any;
  }

  listSubprograms(programId: string) {
    const q = query(this.subCol(programId), orderBy('order', 'asc'));
    return collectionData(q, { idField: 'id' }) as any;
  }

  // ---- program ----
  async upsertProgram(id: string, data: Partial<ProgramDoc>) {
    await setDoc(this.progRef(id), { active: true, order: 999, ...data, updatedAt: serverTimestamp() }, { merge: true });
  }

  // ---- subprogrami ----
  async addSubprogram(programId: string, data: Partial<SubprogramDoc>, file?: File): Promise<string> {
    let imageUrl = data.imageUrl ?? '';
    let imagePath = data.imagePath ?? '';

    if (file) {
      const p = `programs/${programId}/${Date.now()}_${file.name}`;
      const r = ref(this.storage, p);
      await uploadBytes(r, file);
      imageUrl = await getDownloadURL(r);
      imagePath = p;
    }

    const docRef = await addDoc(this.subCol(programId), {
      subtitle: data.subtitle ?? '',
      description: data.description ?? '',
      order: data.order ?? 999,
      active: data.active ?? true,
      imageUrl, imagePath,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  async updateSubprogram(programId: string, subId: string, data: Partial<SubprogramDoc>, file?: File) {
    const patch: any = { ...data, updatedAt: serverTimestamp() };

    if (file) {
      // učitaj novu sliku
      const p = `programs/${programId}/${Date.now()}_${file.name}`;
      const r = ref(this.storage, p);
      await uploadBytes(r, file);
      patch.imageUrl = await getDownloadURL(r);
      patch.imagePath = p;

      // pobriši staru sliku ako postoji
      if ((data as any)?.imagePath) {
        try { await deleteObject(ref(this.storage, (data as any).imagePath)); } catch {}
      }
    }

    await updateDoc(this.subRef(programId, subId), patch);
  }

  async deleteSubprogram(programId: string, subId: string) {
    const snap = await getDoc(this.subRef(programId, subId));
    const data = snap.data() as SubprogramDoc | undefined;

    await deleteDoc(this.subRef(programId, subId));
    if (data?.imagePath) {
      try { await deleteObject(ref(this.storage, data.imagePath)); } catch {}
    }
  }
}
