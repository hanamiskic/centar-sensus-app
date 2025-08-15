import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AdminUsersService } from '../../services/admin-users.service';
import { EventRegistrationsService } from '../../services/event-registrations.service';
import { EventsService } from '../../services/events.service';
import { EventCardComponent } from '../../components/event-card/event-card.component';

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
  membership: string;
  phone: string;
  createdAt: string | null;
};

// Minimalni tip za karticu događaja
type EventItem = {
  id: string;
  naslov: string;
  ciljnaPopulacija: string;
  opis?: string;
  datumVrijeme: Date | null;
  mjesto: string;
  maxSudionika: number;
  imageUrl?: string;
  extraCount?: number;
};

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, EventCardComponent], // koristimo istu karticu
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css'],
})
export class ProfilComponent implements OnInit, OnDestroy {
  // Autentikacija i uloga
  user$: Observable<AppUser | null>;
  isAdmin = false;
  currentUid: string | null = null;

  // Moji događaji
  loadingMyEvents = true;
  myEvents: EventItem[] = [];

  // Admin: korisnici
  users: AdminUserRow[] = [];
  loadingUsers = false;

  // Paginacija (admin)
  pageIndex = 0;
  pageSize = 20;

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

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private adminUsers: AdminUsersService,
    private regs: EventRegistrationsService,
    private events: EventsService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Admin dio: pri promjeni uloge dohvatiti korisnike
    this.authService.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAdmin => {
        this.isAdmin = isAdmin;
        if (isAdmin) this.loadUsers();
      });

    // Moje prijave: pri promjeni korisnika osvježi listu
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => {
        this.currentUid = u?.uid ?? null;
        if (u?.uid) {
          this.loadMyEvents(u.uid);
        } else {
          this.myEvents = [];
          this.loadingMyEvents = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Moji događaji

  // Sigurno čitanje vremena (null -> 0)
  private ms(d: Date | null): number {
    return d ? d.getTime() : 0;
  }

  private sortByDateDesc = (a: EventItem, b: EventItem) =>
    this.ms(b.datumVrijeme) - this.ms(a.datumVrijeme);

  get activeMyEvents(): EventItem[] {
    const now = Date.now();
    return this.myEvents
      .filter(e => this.ms(e.datumVrijeme) > now)
      .sort(this.sortByDateDesc);
  }

  get finishedMyEvents(): EventItem[] {
    const now = Date.now();
    return this.myEvents
      .filter(e => this.ms(e.datumVrijeme) <= now)
      .sort(this.sortByDateDesc);
  }

  async loadMyEvents(uid: string): Promise<void> {
    this.loadingMyEvents = true;
    try {
      // ID-evi događaja na koje je korisnik prijavljen
      const rows = await this.regs.listEventIdsForUser(uid); // string[]

      // uniq + bez praznih vrijednosti
      const ids = Array.from(new Set(rows.filter((id): id is string => !!id)));

      // dohvat događaja
      const list = await Promise.all(ids.map(id => this.events.getEventById(id)));

      // filtriraj null/undefined i osiguraj datumVrijeme
      this.myEvents = (list.filter(Boolean) as EventItem[]).map(e => ({
        ...e,
        datumVrijeme: e.datumVrijeme ?? null,
      }));
    } catch (e) {
      console.error('loadMyEvents error', e);
      this.myEvents = [];
    } finally {
      this.loadingMyEvents = false;
    }
  }

  trackByEventId = (_: number, e: EventItem) => e.id;

  // Admin korisnici

  async loadUsers(): Promise<void> {
    this.loadingUsers = true;
    try {
      const rows = await this.adminUsers.listUsers();
      this.users = (rows as AdminUserRow[]).map(u => ({
        uid: u.uid,
        email: u.email ?? '',
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        membership: u.membership ?? '',
        phone: u.phone ?? '',
        createdAt: u.createdAt ?? null,
      }));
      this.pageIndex = 0; // reset na prvu stranicu nakon novog dohvata
    } catch (e) {
      console.error('listUsers error:', e);
    } finally {
      this.loadingUsers = false;
    }
  }

  formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
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

  async removeUser(uid: string): Promise<void> {
    // Zaštita: ne možeš obrisati vlastiti račun
    if (uid === this.currentUid) {
      alert('Ne možeš obrisati vlastiti račun.');
      return;
    }
    if (!confirm('Obrisati korisnika?')) return;

    try {
      await this.adminUsers.deleteUser(uid);
      // Lokalno izbaci korisnika i ispravi paginaciju
      this.users = this.users.filter(u => u.uid !== uid);
      const lastPageIndex = Math.max(0, Math.ceil(this.users.length / this.pageSize) - 1);
      if (this.pageIndex > lastPageIndex) this.pageIndex = lastPageIndex;
    } catch (e) {
      console.error('deleteUser error:', e);
    }
  }

  changePageSize(value: number | string): void {
    const v = Number(value);
    this.pageSize = !isNaN(v) && v > 0 ? v : 10;
    this.pageIndex = 0;
  }

  private goToPage(index: number): void {
    if (index < 0 || index > this.pageCount - 1) return;
    this.pageIndex = index;
  }

  prevPage(): void {
    this.goToPage(this.pageIndex - 1);
  }

  nextPage(): void {
    this.goToPage(this.pageIndex + 1);
  }

  trackByUid = (_: number, u: AdminUserRow) => u.uid;
}
