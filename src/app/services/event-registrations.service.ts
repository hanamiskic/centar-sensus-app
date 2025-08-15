import { Injectable, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  doc, setDoc, deleteDoc, getDoc,
  collection, orderBy, query, where, getDocs,
  serverTimestamp, DocumentReference, CollectionReference
} from '@angular/fire/firestore';

type UserProfile = { fullName: string; email: string | null };

@Injectable({ providedIn: 'root' })
export class EventRegistrationsService {
  private static readonly COLL = 'eventRegistrations';

  constructor(private db: Firestore, private env: EnvironmentInjector) {}

  // Sve Firestore pozive vrtimo u injection kontekstu
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

  private parseDate(raw: any): Date | null {
    if (!raw) return null;
    if (raw?.toDate) return raw.toDate();
    const d = raw instanceof Date ? raw : new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  private async getUserProfile(uid: string): Promise<UserProfile> {
    try {
      const userRef = doc(this.db, 'users', uid);
      const usnap = await this.inCtx(() => getDoc(userRef));
      const u = (usnap.data() as any) ?? {};
      const first = (u.firstName || '').trim();
      const last = (u.lastName || '').trim();
      const fullName = (first + ' ' + last).trim() || '(bez imena)';
      const email = u.email ?? null;
      return { fullName, email };
    } catch {
      return { fullName: '(bez imena)', email: null };
    }
  }

  async isRegistered(eventId: string, uid: string): Promise<boolean> {
    const snap = await this.inCtx(() => getDoc(this.regDocRef(eventId, uid)));
    return snap.exists();
  }

  async countForEvent(eventId: string): Promise<number> {
    const qy = query(this.colRef(), where('eventId', '==', eventId));
    const snap = await this.inCtx(() => getDocs(qy));
    return snap.size;
  }

  async register(eventId: string, uid: string): Promise<void> {
    return this.inCtx(async () => {
      await setDoc(this.regDocRef(eventId, uid), {
        eventId,
        uid,
        createdAt: serverTimestamp(),
      });
    });
  }

  async unregister(eventId: string, uid: string): Promise<void> {
    return this.inCtx(async () => {
      await deleteDoc(this.regDocRef(eventId, uid));
    });
  }

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

    const snap = await this.inCtx(() => getDocs(qy));

    const rows = await Promise.all(
      snap.docs.map(async d => {
        const data: any = d.data();
        const uid = data?.uid as string;
        const createdAt = this.parseDate(data?.createdAt);
        const profile = await this.getUserProfile(uid);
        return { uid, createdAt, ...profile };
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
    return snap.docs.map(d => (d.data() as any).eventId).filter(Boolean);
  }
}
