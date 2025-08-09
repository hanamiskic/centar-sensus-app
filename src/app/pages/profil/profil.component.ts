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
  createdAt: string | null; // ISO string koji vraća funkcija; može biti i null
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
    } catch (e) {
      console.error('deleteUser error:', e);
    }
  }
}
