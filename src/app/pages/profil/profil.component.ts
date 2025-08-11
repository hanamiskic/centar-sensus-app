import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AdminUsersService } from '../../services/admin-users.service';

interface AppUser {
  uid: string;
  email: string | null;
  fullName: string;
}

type AdminUserRow = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  membership: string;     // "DA-redovni" | "DA-podupirući" | "NE" | ""
  phone: string;
  createdAt: string | null; // ISO string; može biti i null
};

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css'],
})
export class ProfilComponent implements OnInit, OnDestroy {
  user$: Observable<AppUser | null>;
  isAdmin = false;

  users: AdminUserRow[] = [];
  loadingUsers = false;

  // --- Paginacija (klijentska) ---
  pageIndex = 0;   // 0-based
  pageSize = 20;   // zadani broj redaka po stranici

  get pageCount(): number {
    const n = Math.ceil(this.users.length / this.pageSize);
    return n > 0 ? n : 1;
  }

  get pagedUsers(): AdminUserRow[] {
    const start = this.pageIndex * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  get showingFrom(): number {
    if (!this.users.length) return 0;
    return this.pageIndex * this.pageSize + 1;
  }

  get showingTo(): number {
    if (!this.users.length) return 0;
    return Math.min((this.pageIndex + 1) * this.pageSize, this.users.length);
  }
  // -------------------------------

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private adminUsers: AdminUsersService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit() {
    this.authService.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAdmin) => {
        this.isAdmin = isAdmin;
        if (isAdmin) this.loadUsers();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadUsers() {
    this.loadingUsers = true;
    try {
      const rows = await this.adminUsers.listUsers();

      console.log('rows from CF:', rows);
      // osiguraj da svi ključevi postoje (UI ne voli undefined)
      this.users = (rows as AdminUserRow[]).map((u) => ({
        uid: u.uid,
        email: u.email ?? '',
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        membership: u.membership ?? '',
        phone: u.phone ?? '',
        createdAt: u.createdAt ?? null,
      }));

      // reset na prvu stranicu nakon dohvata
      this.pageIndex = 0;
    } catch (e) {
      console.error('listUsers error:', e);
    } finally {
      this.loadingUsers = false;
    }
  }

  formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    // npr. 09.08.2025. 15:40
    return d
      .toLocaleString('hr-HR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', '');
  }

  async removeUser(uid: string) {
    if (!confirm('Obrisati korisnika?')) return;
    try {
      await this.adminUsers.deleteUser(uid);
      this.users = this.users.filter((u) => u.uid !== uid);

      // ako smo obrisali zadnji red na stranici, pomakni se nazad ako treba
      const lastPageIndex = Math.max(0, Math.ceil(this.users.length / this.pageSize) - 1);
      if (this.pageIndex > lastPageIndex) {
        this.pageIndex = lastPageIndex;
      }
    } catch (e) {
      console.error('deleteUser error:', e);
    }
  }

  // --- Kontrole paginacije (poziva ih template) ---
  changePageSize(value: number | string) {
    const v = Number(value);
    this.pageSize = !isNaN(v) && v > 0 ? v : 10;
    this.pageIndex = 0;
  }

  goToPage(index: number) {
    if (index < 0 || index > this.pageCount - 1) return;
    this.pageIndex = index;
  }

  prevPage() {
    this.goToPage(this.pageIndex - 1);
  }

  nextPage() {
    this.goToPage(this.pageIndex + 1);
  }
  // -------------------------------------------------

  // (opcionalno) za *ngFor trackBy
  trackByUid(index: number, u: AdminUserRow) {
    return u.uid;
  }
}
