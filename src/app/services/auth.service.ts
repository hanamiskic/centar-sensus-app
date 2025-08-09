import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  onAuthStateChanged,
} from '@angular/fire/auth';
// ⬇️ novo: uzmi getIdTokenResult iz Firebase Auth SDK-a
import { getIdTokenResult } from 'firebase/auth';

import { BehaviorSubject } from 'rxjs';

interface AppUser {
  uid: string;
  email: string | null;
  fullName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // ⬇️ NOVO: admin observable
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$ = this.isAdminSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        // fetch ime/prezime iz Firestorea (tvoj postojeći dio)
        const userRef = doc(this.firestore, 'users', user.uid);
        const snap = await getDoc(userRef);
        const data = snap.data();
        const firstName = data?.['firstName'] ?? '';
        const lastName = data?.['lastName'] ?? '';
        const fullName =
          (firstName + ' ' + lastName).trim() || user.email || '';

        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          fullName,
        };
        this.currentUserSubject.next(appUser);

        // ⬇️ NOVO: učitaj i spremi admin claim
        const token = await getIdTokenResult(user, true); // force refresh na ulazu
        this.isAdminSubject.next(!!token.claims['admin']);
      } else {
        this.currentUserSubject.next(null);
        this.isAdminSubject.next(false);
      }
    });
  }

  register(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  saveUserData(uid: string, data: any): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    return setDoc(userRef, data);
  }

  logout(): Promise<void> {
    return this.auth.signOut();
  }

  // ⬇️ NOVO: ručno osvježi claimove (pozovi nakon promocije/democije)
  async refreshClaims(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      this.isAdminSubject.next(false);
      return;
    }
    const token = await getIdTokenResult(user, true);
    this.isAdminSubject.next(!!token.claims['admin']);
  }

  // ⬇️ (Opcionalno) dohvati sve claimove ako ti trebaju za debug
  async getCurrentClaims(): Promise<Record<string, unknown> | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    const token = await getIdTokenResult(user, true);
    return token.claims ?? {};
  }
}
