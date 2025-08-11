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
  DocumentReference,
  CollectionReference
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class EventRegistrationsService {
  /** Ime kolekcije na jednom mjestu */
  private static readonly COLL = 'eventRegistrations';

  constructor(private db: Firestore) {}

  /** Referenca na kolekciju */
  private colRef(): CollectionReference {
    return collection(this.db, EventRegistrationsService.COLL);
  }

  /** Deterministički ID dokumenta: eventId_uid */
  private regDocId(eventId: string, uid: string): string {
    return `${eventId}_${uid}`;
  }

  /** Referenca na konkretan doc prijave */
  private regDocRef(eventId: string, uid: string): DocumentReference {
    return doc(this.db, EventRegistrationsService.COLL, this.regDocId(eventId, uid));
  }

  /** Je li korisnik već prijavljen? */
  async isRegistered(eventId: string, uid: string): Promise<boolean> {
    const snap = await getDoc(this.regDocRef(eventId, uid));
    return snap.exists();
  }

  /** Broj prijava na događaj */
  async countForEvent(eventId: string): Promise<number> {
    const qy = query(this.colRef(), where('eventId', '==', eventId));
    const snap = await getDocs(qy);
    return snap.size;
  }

  /** Prijavi korisnika na događaj */
  async register(eventId: string, uid: string): Promise<void> {
    await setDoc(this.regDocRef(eventId, uid), {
      eventId,
      uid,
      createdAt: serverTimestamp(),
    });
  }

  /** Odjavi korisnika s događaja */
  async unregister(eventId: string, uid: string): Promise<void> {
    await deleteDoc(this.regDocRef(eventId, uid));
  }

  /** Lista prijavljenih s podacima o korisniku */
  async listWithUsers(eventId: string): Promise<Array<{
    uid: string;
    createdAt: Date | null;
    fullName: string;
    email: string | null;
  }>> {
    const qy = query(
      this.colRef(),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(qy);

    const rows = await Promise.all(
      snap.docs.map(async d => {
        const data: any = d.data();
        const uid = data?.uid as string;

        const createdAtRaw = data?.createdAt;
        const createdAt = createdAtRaw?.toDate
          ? createdAtRaw.toDate()
          : createdAtRaw
          ? new Date(createdAtRaw)
          : null;

        // povuci user profil
        let fullName = '';
        let email: string | null = null;
        try {
          const usnap = await getDoc(doc(this.db, 'users', uid));
          const u = (usnap.data() as any) || {};
          const first = (u?.firstName || '').trim();
          const last  = (u?.lastName  || '').trim();
          fullName = (first + ' ' + last).trim();
          email = u?.email || null;
        } catch { /* ignore */ }

        return {
          uid,
          createdAt,
          fullName: fullName || '(bez imena)',
          email,
        };
      })
    );

    return rows;
  }

  /** Svi eventId-ovi na koje je korisnik prijavljen (za profil) */
  async listEventIdsForUser(uid: string): Promise<string[]> {
    if (!uid) return [];
    const qy = query(
      this.colRef(),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')   // zahtijeva indeks: uid ASC, createdAt DESC/ASC
    );
    const snap = await getDocs(qy);
    console.log('[regs:listEventIdsForUser] uid=', uid, 'docs=', snap.size);
    return snap.docs.map(d => (d.data() as any).eventId);
  }

  /** Debug helper */
  async debugDumpAll() {
    const snap = await getDocs(this.colRef());
    console.log('[debug] all docs in eventRegistrations:', snap.size);
    snap.forEach(d => console.log(d.id, d.data()));
  }
}
