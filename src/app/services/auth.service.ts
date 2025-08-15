import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  onAuthStateChanged,
} from '@angular/fire/auth';
import { sendPasswordResetEmail } from '@angular/fire/auth';
import { getIdTokenResult, Unsubscribe } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

interface AppUser {
  uid: string;
  email: string | null;
  fullName: string;
}

// minimalni oblik user dokumenta u Firestoreu
type UserDoc = {
  firstName?: string;
  lastName?: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$ = this.isAdminSubject.asObservable();

  private authUnsub: Unsubscribe | null = null;

  constructor(private auth: Auth, private firestore: Firestore) {
    // reagiraj na promjene autentikacije
    this.authUnsub = onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.currentUserSubject.next(null);
        this.isAdminSubject.next(false);
        return;
      }

      try {
        // ime/prezime iz Firestorea (ako postoji dokument)
        const userRef = doc(this.firestore, 'users', user.uid);
        const snap = await getDoc(userRef);
        const data = (snap.data() as UserDoc | undefined) ?? {};

        const firstName = data.firstName ?? '';
        const lastName = data.lastName ?? '';
        const fullName = (firstName + ' ' + lastName).trim() || user.email || '';

        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          fullName,
        };
        this.currentUserSubject.next(appUser);

        // učitaj admin claim (force refresh na ulazu)
        const token = await getIdTokenResult(user, true);
        this.isAdminSubject.next(!!token.claims['admin']);
      } catch (err) {
        console.error('onAuthStateChanged handler error:', err);
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          fullName: user.email || '',
        };
        this.currentUserSubject.next(appUser);
        this.isAdminSubject.next(false);
      }
    });
  }

  ngOnDestroy(): void {
    // sigurnosno odjavi listener ako se servis uništi (npr. u testovima)
    if (this.authUnsub) {
      this.authUnsub();
      this.authUnsub = null;
    }
  }

  // registracija/login/logout
  register(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout(): Promise<void> {
    return this.auth.signOut();
  }

  // spremi/kreiraj dokument korisnika u Firestoreu
  saveUserData(uid: string, data: Record<string, unknown>): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    return setDoc(userRef, data);
  }

  // reset lozinke
  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  // ručno osvježi custom claimove (npr. nakon promjene uloga)
  async refreshClaims(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      this.isAdminSubject.next(false);
      return;
    }
    try {
      const token = await getIdTokenResult(user, true);
      this.isAdminSubject.next(!!token.claims['admin']);
    } catch (err) {
      console.error('refreshClaims error:', err);
      this.isAdminSubject.next(false);
    }
  }

  // pomoćno: dohvat svih claimova 
  async getCurrentClaims(): Promise<Record<string, unknown> | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    try {
      const token = await getIdTokenResult(user, true);
      return token.claims ?? {};
    } catch (err) {
      console.error('getCurrentClaims error:', err);
      return null;
    }
  }

  get currentUserSnapshot(): AppUser | null {
    return this.currentUserSubject.value;
  }

  get isAdminSnapshot(): boolean {
    return this.isAdminSubject.value;
  }
}
