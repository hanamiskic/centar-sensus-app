import { Injectable } from '@angular/core';
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
  constructor(private db: Firestore, private storage: Storage) {}

  async addEvent(eventData: any, imageFile: File): Promise<void> {
    let imageUrl = '';
    if (imageFile) {
      const filePath = `events/${Date.now()}_${imageFile.name.replace(
        /\s+/g,
        '_'
      )}`;
      const fileRef = ref(this.storage, filePath);
      await uploadBytes(fileRef, imageFile);
      imageUrl = await getDownloadURL(fileRef);
    }

    const dv = eventData?.datumVrijeme
      ? new Date(eventData.datumVrijeme)
      : null;

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
  }

  async listEvents(): Promise<any[]> {
    const colRef = collection(this.db, 'events');
    const q = query(colRef, orderBy('datumVrijeme', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data: any = d.data();
      const raw = data?.datumVrijeme;
      const datumVrijeme = raw?.toDate
        ? raw.toDate()
        : raw
        ? new Date(raw)
        : null;

      return { id: d.id, ...data, datumVrijeme };
    });
  }

  async getEventById(id: string): Promise<any | null> {
    const refDoc = doc(this.db, 'events', id);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return null;

    const d: any = snap.data();
    const raw = d?.datumVrijeme;
    const datumVrijeme = raw?.toDate
      ? raw.toDate()
      : raw
      ? new Date(raw)
      : null;

    return {
      id: snap.id,
      naslov: d?.naslov ?? '',
      ciljnaPopulacija: d?.ciljnaPopulacija ?? '',
      opis: d?.opis ?? '',
      datumVrijeme,
      mjesto: d?.mjesto ?? '',
      maxSudionika: d?.maxSudionika ?? 0,
      imageUrl: d?.imageUrl ?? '',
      extraCount: d?.extraCount ?? 0,
    };
  }

  /** UREĐIVANJE */
  async updateEvent(
    id: string,
    eventData: any,
    newImageFile?: File | null,
    oldImageUrl?: string | null
  ): Promise<void> {
    let imageUrl = oldImageUrl || '';

    if (newImageFile) {
      const filePath = `events/${Date.now()}_${newImageFile.name.replace(
        /\s+/g,
        '_'
      )}`;
      const fileRef = ref(this.storage, filePath);
      await uploadBytes(fileRef, newImageFile);
      imageUrl = await getDownloadURL(fileRef);

      // pokušaj obrisati staru sliku (ako postoji)
      if (oldImageUrl) {
        try {
          const oldRef = ref(this.storage, oldImageUrl);
          await deleteObject(oldRef);
        } catch {
          /* ignore */
        }
      }
    }

    const dv = eventData?.datumVrijeme
      ? new Date(eventData.datumVrijeme)
      : null;

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
  }

  /** BRISANJE */
  async deleteEvent(id: string, imageUrl?: string): Promise<void> {
    if (imageUrl) {
      try {
        const fileRef = ref(this.storage, imageUrl);
        await deleteObject(fileRef);
      } catch {
        /* ignore */
      }
    }
    await deleteDoc(doc(this.db, 'events', id));
  }

  async setExtraCount(id: string, value: number): Promise<void> {
    const target = doc(this.db, 'events', id);
    await updateDoc(target, { extraCount: Math.max(0, Math.floor(value)) });
  }

  async getMany(ids: string[]): Promise<any[]> {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    const tasks = unique.map((id) => getDoc(doc(this.db, 'events', id)));
    const snaps = await Promise.all(tasks);

    return snaps
      .filter((s) => s.exists())
      .map((s) => {
        const d: any = s.data();
        const raw = d?.datumVrijeme;
        const datumVrijeme = raw?.toDate
          ? raw.toDate()
          : raw
          ? new Date(raw)
          : null;
        return {
          id: s.id,
          naslov: d?.naslov ?? '',
          ciljnaPopulacija: d?.ciljnaPopulacija ?? '',
          opis: d?.opis ?? '',
          datumVrijeme,
          mjesto: d?.mjesto ?? '',
          maxSudionika: d?.maxSudionika ?? 0,
          imageUrl: d?.imageUrl ?? '',
          extraCount: d?.extraCount ?? 0,
        };
      });
  }
}
