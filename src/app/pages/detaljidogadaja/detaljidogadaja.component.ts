import { Component, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';
import { EventRegistrationsService } from '../../services/event-registrations.service';

interface EventItem {
  id: string;
  naslov: string;
  opis?: string | null;
  datumVrijeme?: Date | any | null;
  mjesto?: string | null;
  ciljnaPopulacija?: string | null;
  maxSudionika?: number | null;
  imageUrl?: string | null;
  extraCount?: number | null;         // “ručno dodani”
}

/** Red u modalnoj listi prijava */
type RegItem = {
  uid: string;
  fullName: string;
  email: string | null;
  createdAt: Date | null;
};

@Component({
  selector: 'app-detaljidogadaja',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detaljidogadaja.component.html',
  styleUrls: ['./detaljidogadaja.component.css'],
})
export class DetaljiDogadajaComponent implements OnDestroy {
  private sub?: Subscription;
  private authSub?: Subscription;
  private adminSub?: Subscription;

  /** “∞” sentinel — mora biti isti kao u ostatku app-a */
  private static readonly INFINITY_SENTINEL = 500;

  // ====== State ======
  event: EventItem | null = null;
  notFound = false;

  currentUser: { uid: string; email: string | null; fullName: string } | null = null;
  isRegistered = false;
  regLoading = false;

  // stvarne prijave iz kolekcije registracija
  registrationsCount = 0;

  // ADMIN
  isAdmin = false;
  showRegModal = false;
  regsLoading = false;
  registrations: RegItem[] = [];

  // ručno dodani (samo broj)
  extraCount = 0;   // spremljeno u bazi
  extraDraft = 0;   // trenutno uređivano u modalu
  extraBusy = false;

  // kamo se vratiti ako nema browser history
  private backFallback: '/dogadaji' | '/profil' = '/dogadaji';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly events: EventsService,
    private readonly auth: AuthService,
    private readonly regs: EventRegistrationsService
  ) {
    // odredi fallback destinaciju (profil ili događaji)
    const fromState = (history.state as any)?.from ?? null; // kad navigiraš sa [state]
    const fromQuery = this.route.snapshot.queryParamMap.get('from'); // kad koristiš ?from=profil
    const from = (fromState || fromQuery || '').toString().toLowerCase();
    this.backFallback = from === 'profil' ? '/profil' : '/dogadaji';

    // učitaj event na promjenu :id
    this.sub = this.route.paramMap.subscribe(async (p) => {
      const id = p.get('id');
      if (!id) return;

      this.notFound = false;

      try {
        const ev = (await this.events.getEventById(id)) as EventItem | null;
        this.event = ev;
        if (!ev) {
          this.notFound = true;
          return;
        }

        // ručno dodani (iz dokumenta eventa)
        this.extraCount = Number(ev.extraCount ?? 0);
        this.extraDraft = this.extraCount;

        // broj prijava + status korisnika
        await this.refreshCountersAndStatus();
      } catch {
        this.notFound = true;
      }
    });

    // login stanje
    this.authSub = this.auth.currentUser$.subscribe((u) => {
      this.currentUser = u as any;
      this.refreshCountersAndStatus();
    });

    // admin flag
    this.adminSub = this.auth.isAdmin$.subscribe((v) => (this.isAdmin = !!v));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.authSub?.unsubscribe();
    this.adminSub?.unsubscribe();
  }

  // back ponašanje
  goBack(ev?: Event): void {
    ev?.preventDefault();
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate([this.backFallback]);
    }
  }

  // prikaz/kapacitet
  get isLoggedIn(): boolean {
    return !!this.currentUser?.uid;
  }

  get isActive(): boolean {
    if (!this.event?.datumVrijeme) return false;
    return this.toDate(this.event.datumVrijeme).getTime() >= Date.now();
  }

  get isUnlimited(): boolean {
    return Number(this.event?.maxSudionika ?? 0) === DetaljiDogadajaComponent.INFINITY_SENTINEL;
  }

  get capacity(): number {
    return Number(this.event?.maxSudionika ?? 0);
  }

  /** ukupno = stvarne prijave + ručno dodani */
  get totalCount(): number {
    return this.registrationsCount + this.extraCount;
  }

  get isFull(): boolean {
    if (!this.event || this.isUnlimited) return false;
    const cap = this.capacity;
    if (!cap || cap <= 0) return false;
    return this.totalCount >= cap;
  }

  /** koliko admin smije podesiti u modalu (granica po kapacitetu) */
  get maxExtra(): number {
    if (this.isUnlimited) return Number.MAX_SAFE_INTEGER;
    return Math.max(0, this.capacity - this.registrationsCount);
  }

  get remainingAfterDraft(): number {
    if (this.isUnlimited) return Infinity;
    return Math.max(0, this.capacity - this.registrationsCount - this.extraDraft);
  }

  // helper: siguran Date iz JS Date ili Firestore Timestamp
  private toDate(val: any): Date {
    return typeof val?.toDate === 'function' ? val.toDate() : (val as Date);
  }

  // data sync
  private async refreshCountersAndStatus(): Promise<void> {
    if (!this.event?.id) return;

    try {
      this.registrationsCount = await this.regs.countForEvent(this.event.id);
    } catch {
      this.registrationsCount = 0;
    }

    if (this.currentUser?.uid) {
      try {
        this.isRegistered = await this.regs.isRegistered(this.event.id, this.currentUser.uid);
      } catch {
        this.isRegistered = false;
      }
    } else {
      this.isRegistered = false;
    }
  }

  // prijava/odjava s eventa
  async onToggleRegistration(): Promise<void> {
    if (!this.event?.id || !this.currentUser?.uid) return;

    this.regLoading = true;
    try {
      if (this.isRegistered) {
        await this.regs.unregister(this.event.id, this.currentUser.uid);
        this.isRegistered = false;
        this.registrationsCount = Math.max(0, this.registrationsCount - 1);
      } else {
        if (this.isFull) return;
        await this.regs.register(this.event.id, this.currentUser.uid);
        this.isRegistered = true;
        this.registrationsCount += 1;
      }
    } finally {
      this.regLoading = false;
    }
  }

  // ADMIN: modal/lista
  async openRegistrationsModal(): Promise<void> {
    if (!this.isAdmin || !this.event?.id) return;
    this.showRegModal = true;
    this.extraDraft = this.extraCount; // pripremi editor
    this.regsLoading = true;
    try {
      this.registrations = await this.regs.listWithUsers(this.event.id);
    } finally {
      this.regsLoading = false;
    }
  }

  closeRegistrationsModal(): void {
    this.showRegModal = false;
  }

  // ADMIN: ručno dodani
  incExtra(): void {
    if (this.extraDraft < this.maxExtra) this.extraDraft++;
  }

  decExtra(): void {
    if (this.extraDraft > 0) this.extraDraft--;
  }

  onExtraInput(ev: Event): void {
    const v = Math.floor(Number((ev.target as HTMLInputElement).value));
    if (!Number.isFinite(v)) return;
    this.extraDraft = Math.min(this.maxExtra, Math.max(0, v));
  }

  async saveExtra(): Promise<void> {
    if (!this.event?.id) return;
    this.extraBusy = true;
    try {
      await this.events.setExtraCount(this.event.id, this.extraDraft);
      this.extraCount = this.extraDraft; // primijeni lokalno
    } finally {
      this.extraBusy = false;
    }
  }
}
