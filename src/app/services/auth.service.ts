import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  UserCredential,
  onAuthStateChanged,
} from '@angular/fire/auth';

import { BehaviorSubject } from 'rxjs';

interface AppUser {
  uid: string;
  email: string | null;
  fullName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
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
      } else {
        this.currentUserSubject.next(null);
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
}
