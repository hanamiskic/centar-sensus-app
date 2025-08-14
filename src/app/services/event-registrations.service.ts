import { Injectable, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  doc, setDoc, deleteDoc, getDoc,
  collection, orderBy, query, where, getDocs,
  serverTimestamp, DocumentReference, CollectionReference
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class EventRegistrationsService {
  private static readonly COLL = 'eventRegistrations';

  constructor(private db: Firestore, private env: EnvironmentInjector) {}

  /** Sve Firebase read pozive vrtimo unutar Angular injection konteksta */
  private inCtx<T>(cb: () => Promise<T>) {
    return runInInjectionContext(this.env, cb);
  }

  private colRef(): CollectionReference {
    return collection(this.db, EventRegistrationsService.COLL);
  }

  private regDocId(eventId: string, uid: string): string {
    return `${eventId}_${uid}`;
  }

  private regDocRef(eventId: string, uid: string): DocumentReference {
    return doc(this.db, EventRegistrationsService.COLL, this.regDocId(eventId, uid));
  }

  async isRegistered(eventId: string, uid: string): Promise<boolean> {
    const snap = await this.inCtx(() => getDoc(this.regDocRef(eventId, uid)));
    return snap.exists();
    //                      ^^^ ovo je sad sigurno u kontekstu
  }

  async countForEvent(eventId: string): Promise<number> {
    const qy = query(this.colRef(), where('eventId', '==', eventId));
    const snap = await this.inCtx(() => getDocs(qy));
    return snap.size;
  }

  async register(eventId: string, uid: string): Promise<void> {
    await setDoc(this.regDocRef(eventId, uid), {
      eventId, uid, createdAt: serverTimestamp(),
    });
  }

  async unregister(eventId: string, uid: string): Promise<void> {
    await deleteDoc(this.regDocRef(eventId, uid));
  }

  async listWithUsers(eventId: string): Promise<Array<{
    uid: string; createdAt: Date | null; fullName: string; email: string | null;
  }>> {
    const qy = query(
      this.colRef(),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'asc')
    );

    const snap = await this.inCtx(() => getDocs(qy));

    const rows = await Promise.all(
      snap.docs.map(async d => {
        const data: any = d.data();
        const uid = data?.uid as string;

        const createdAtRaw = data?.createdAt;
        const createdAt = createdAtRaw?.toDate
          ? createdAtRaw.toDate()
          : createdAtRaw ? new Date(createdAtRaw) : null;

        // ⬇️ i dohvat user-profila vrti u injection kontekstu
        let fullName = '';
        let email: string | null = null;
        try {
          const userRef = doc(this.db, 'users', uid);
          const usnap = await this.inCtx(() => getDoc(userRef));
          const u = (usnap.data() as any) || {};
          const first = (u?.firstName || '').trim();
          const last  = (u?.lastName  || '').trim();
          fullName = (first + ' ' + last).trim();
          email = u?.email || null;
        } catch { /* ignore */ }

        return { uid, createdAt, fullName: fullName || '(bez imena)', email };
      })
    );

    return rows;
  }

  async listEventIdsForUser(uid: string): Promise<string[]> {
    if (!uid) return [];
    const qy = query(
      this.colRef(),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await this.inCtx(() => getDocs(qy));
    return snap.docs.map(d => (d.data() as any).eventId);
  }
}
