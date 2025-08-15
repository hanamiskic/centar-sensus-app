import { Injectable, EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
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

@Injectable({ providedIn: 'root' })
export class EventsService {
  private env = inject(EnvironmentInjector);

  constructor(private db: Firestore, private storage: Storage) {}

  // izvrši fn unutar Angular injection konteksta
  private inCtx<T>(fn: () => Promise<T>) {
    return runInInjectionContext(this.env, fn);
  }

  // parsaj Firestore Timestamp/Date/ISO u Date | null
  private parseDate(raw: unknown): Date | null {
    if (!raw) return null;
    // Firestore Timestamp
    const maybeTs = raw as { toDate?: () => Date };
    if (maybeTs && typeof maybeTs.toDate === 'function') return maybeTs.toDate();
    // već je Date ili parsabilan string/broj
    const d = raw instanceof Date ? raw : new Date(raw as any);
    return isNaN(d.getTime()) ? null : d;
  }

  // standardiziraj model događaja iz Firestore zapisa
  private toEvent(id: string, data: any) {
    return {
      id,
      naslov: data?.naslov ?? '',
      ciljnaPopulacija: data?.ciljnaPopulacija ?? '',
      opis: data?.opis ?? '',
      datumVrijeme: this.parseDate(data?.datumVrijeme),
      mjesto: data?.mjesto ?? '',
      maxSudionika: Number(data?.maxSudionika ?? 0),
      imageUrl: data?.imageUrl ?? '',
      extraCount: Number.isFinite(data?.extraCount) ? Number(data.extraCount) : 0,
    };
  }

  // upload slike i vrati javni URL
  private async uploadImage(file: File): Promise<string> {
    const safeName = file.name.replace(/\s+/g, '_');
    const filePath = `events/${Date.now()}_${safeName}`;
    const fileRef = ref(this.storage, filePath);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  }

  async addEvent(eventData: any, imageFile: File): Promise<void> {
    return this.inCtx(async () => {
      try {
        const imageUrl = imageFile ? await this.uploadImage(imageFile) : '';
        const dv = this.parseDate(eventData?.datumVrijeme);

        const eventsCol = collection(this.db, 'events');
        await addDoc(eventsCol, {
          naslov: eventData?.naslov ?? '',
          ciljnaPopulacija: eventData?.ciljnaPopulacija ?? '',
          opis: eventData?.opis ?? '',
          datumVrijeme: dv,
          mjesto: eventData?.mjesto ?? '',
          maxSudionika: Number(eventData?.maxSudionika ?? 0),
          imageUrl,
          extraCount: 0,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('addEvent error:', err);
        throw err;
      }
    });
  }

  async listEvents(): Promise<any[]> {
    return this.inCtx(async () => {
      const colRef = collection(this.db, 'events');
      const q = query(colRef, orderBy('datumVrijeme', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => this.toEvent(d.id, d.data()));
    });
  }

  async getEventById(id: string): Promise<any | null> {
    return this.inCtx(async () => {
      const refDoc = doc(this.db, 'events', id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) return null;
      return this.toEvent(snap.id, snap.data());
    });
  }

  async updateEvent(
    id: string,
    eventData: any,
    newImageFile?: File | null,
    oldImageUrl?: string | null
  ): Promise<void> {
    return this.inCtx(async () => {
      try {
        let imageUrl = oldImageUrl || '';

        if (newImageFile) {
          imageUrl = await this.uploadImage(newImageFile);
          // pokušaj obrisati staru sliku ako postoji
          if (oldImageUrl) {
            try {
              const oldRef = ref(this.storage, oldImageUrl);
              await deleteObject(oldRef);
            } catch {
              // 
            }
          }
        }

        const dv = this.parseDate(eventData?.datumVrijeme);
        const target = doc(this.db, 'events', id);

        await updateDoc(target, {
          naslov: eventData?.naslov ?? '',
          ciljnaPopulacija: eventData?.ciljnaPopulacija ?? '',
          opis: eventData?.opis ?? '',
          datumVrijeme: dv,
          mjesto: eventData?.mjesto ?? '',
          maxSudionika: Number(eventData?.maxSudionika ?? 0),
          imageUrl: imageUrl ?? '',
        });
      } catch (err) {
        console.error('updateEvent error:', err);
        throw err;
      }
    });
  }

  async deleteEvent(id: string, imageUrl?: string): Promise<void> {
    return this.inCtx(async () => {
      try {
        if (imageUrl) {
          try {
            const fileRef = ref(this.storage, imageUrl);
            await deleteObject(fileRef);
          } catch {
            // 
          }
        }
        await deleteDoc(doc(this.db, 'events', id));
      } catch (err) {
        console.error('deleteEvent error:', err);
        throw err;
      }
    });
  }

  async setExtraCount(id: string, value: number): Promise<void> {
    return this.inCtx(async () => {
      const target = doc(this.db, 'events', id);
      await updateDoc(target, { extraCount: Math.max(0, Math.floor(value)) });
    });
  }

  async getMany(ids: string[]): Promise<any[]> {
    return this.inCtx(async () => {
      const unique = Array.from(new Set((ids || []).filter(Boolean)));
      if (unique.length === 0) return [];
      const snaps = await Promise.all(unique.map(id => getDoc(doc(this.db, 'events', id))));
      return snaps.filter(s => s.exists()).map(s => this.toEvent(s.id, s.data()));
    });
  }
}
