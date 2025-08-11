import { Injectable } from '@angular/core';

import {
  Firestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  orderBy,
  query,
  where,
  getDocs,
  serverTimestamp,
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class EventRegistrationsService {
  private colName = 'eventRegistrations';

  constructor(private db: Firestore) {}

  /** Generiraj deterministički ID dokumenta da spriječiš duplikate */
  private regDocId(eventId: string, uid: string) {
    return `${eventId}_${uid}`;
  }

  /** Je li korisnik već prijavljen? */
  async isRegistered(eventId: string, uid: string): Promise<boolean> {
    const snap = await getDoc(doc(this.db, this.colName, this.regDocId(eventId, uid)));
    return snap.exists();
  }

  /** Broj prijava na događaj */
  async countForEvent(eventId: string): Promise<number> {
    const q = query(collection(this.db, this.colName), where('eventId', '==', eventId));
    const snap = await getDocs(q);
    return snap.size;
  }

  /** Prijavi korisnika na događaj */
  async register(eventId: string, uid: string): Promise<void> {
    const ref = doc(this.db, this.colName, this.regDocId(eventId, uid));
    await setDoc(ref, {
      eventId,
      uid,
      createdAt: serverTimestamp(),
    });
  }

  /** Odjavi korisnika s događaja */
  async unregister(eventId: string, uid: string): Promise<void> {
    await deleteDoc(doc(this.db, this.colName, this.regDocId(eventId, uid)));
  }

   async listWithUsers(eventId: string): Promise<Array<{
    uid: string;
    createdAt: Date | null;
    fullName: string;
    email: string | null;
  }>> {
    const col = collection(this.db, this.colName);
    const q = query(col, where('eventId', '==', eventId), orderBy('createdAt','asc'));
    const snap = await getDocs(q);

    const rows = await Promise.all(snap.docs.map(async d => {
      const data: any = d.data();
      const uid = data?.uid as string;
      const createdAtRaw = data?.createdAt;
      const createdAt = createdAtRaw?.toDate ? createdAtRaw.toDate() : (createdAtRaw ? new Date(createdAtRaw) : null);

      // povuci user profil
      let fullName = '';
      let email: string | null = null;
      try {
        const uref = doc(this.db, 'users', uid);
        const usnap = await getDoc(uref);
        const u = usnap.data() as any || {};
        const first = (u?.firstName || '').trim();
        const last = (u?.lastName || '').trim();
        fullName = (first + ' ' + last).trim();
        email = (u?.email || null);
      } catch { /* ignore */ }

      return {
        uid,
        createdAt,
        fullName: fullName || '(bez imena)',
        email,
      };
    }));

    return rows;
  }
}
