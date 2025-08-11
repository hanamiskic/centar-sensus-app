import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventsService } from '../../services/events.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EventRegistrationsService } from '../../services/event-registrations.service';

type RegItem = { uid: string; fullName: string; email: string | null; createdAt: Date | null };

@Component({
  selector: 'app-detaljidogadaja',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detaljidogadaja.component.html',
  styleUrls: ['./detaljidogadaja.component.css']
})
export class DetaljiDogadajaComponent implements OnDestroy {
  private sub?: Subscription;
  private authSub?: Subscription;
  private adminSub?: Subscription;

  event: any | null = null;
  notFound = false;

  currentUser: { uid: string; email: string | null; fullName: string } | null = null;
  isRegistered = false;
  regLoading = false;

  // stvarne prijave
  registrationsCount = 0;

  // ADMIN
  isAdmin = false;
  showRegModal = false;
  regsLoading = false;
  registrations: RegItem[] = [];

  // ručno dodani (samo broj)
  extraCount = 0;       // spremljeno u bazi
  extraDraft = 0;       // trenutno uređivano u modalu
  extraBusy = false;

  constructor(
    private route: ActivatedRoute,
    private events: EventsService,
    private auth: AuthService,
    private regs: EventRegistrationsService
  ) {
    // učitaj event
    this.sub = this.route.paramMap.subscribe(async p => {
      const id = p.get('id');
      if (!id) return;

      this.notFound = false;
      this.event = await this.events.getEventById(id);
      if (!this.event) { this.notFound = true; return; }

      // pokupi ručno dodane (dolaze iz eventa)
      this.extraCount = Number(this.event?.extraCount ?? 0);
      this.extraDraft = this.extraCount;

      // broj prijava + status korisnika
      this.refreshCountersAndStatus();
    });

    // login stanje
    this.authSub = this.auth.currentUser$.subscribe(u => {
      this.currentUser = u as any;
      this.refreshCountersAndStatus();
    });

    // admin flag
    this.adminSub = this.auth.isAdmin$.subscribe(v => this.isAdmin = !!v);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.authSub?.unsubscribe();
    this.adminSub?.unsubscribe();
  }

  // ====== prikaz/kapacitet ======
  get isLoggedIn(): boolean { return !!this.currentUser?.uid; }

  get isActive(): boolean {
    if (!this.event?.datumVrijeme) return false;
    return new Date(this.event.datumVrijeme).getTime() >= Date.now();
  }

  get isUnlimited(): boolean {
    return Number(this.event?.maxSudionika ?? 0) === 500;
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

  // koliko admin smije podesiti u modalu (granica po kapacitetu)
  get maxExtra(): number {
    if (this.isUnlimited) return Number.MAX_SAFE_INTEGER;
    return Math.max(0, this.capacity - this.registrationsCount);
  }
  get remainingAfterDraft(): number {
    if (this.isUnlimited) return Infinity;
    return Math.max(0, this.capacity - this.registrationsCount - this.extraDraft);
  }

  // ===== data sync =====
  private async refreshCountersAndStatus(): Promise<void> {
    if (!this.event?.id) return;

    try {
      this.registrationsCount = await this.regs.countForEvent(this.event.id);
    } catch { this.registrationsCount = 0; }

    if (this.currentUser?.uid) {
      try {
        this.isRegistered = await this.regs.isRegistered(this.event.id, this.currentUser.uid);
      } catch { this.isRegistered = false; }
    } else {
      this.isRegistered = false;
    }
  }

  // ===== prijava/odjava =====
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

  // ===== ADMIN: modal/lista =====
  async openRegistrationsModal(): Promise<void> {
    if (!this.isAdmin || !this.event?.id) return;
    this.showRegModal = true;
    this.extraDraft = this.extraCount;   // pripremi editor
    this.regsLoading = true;
    try {
      this.registrations = await this.regs.listWithUsers(this.event.id);
    } finally {
      this.regsLoading = false;
    }
  }
  closeRegistrationsModal(): void { this.showRegModal = false; }

  // ===== ADMIN: ručno dodani =====
  incExtra(){ if (this.extraDraft < this.maxExtra) this.extraDraft++; }
  decExtra(){ if (this.extraDraft > 0) this.extraDraft--; }
  onExtraInput(ev: Event){
    const v = Math.floor(Number((ev.target as HTMLInputElement).value));
    if (!Number.isFinite(v)) return;
    this.extraDraft = Math.min(this.maxExtra, Math.max(0, v));
  }

  async saveExtra(): Promise<void> {
    if (!this.event?.id) return;
    this.extraBusy = true;
    try {
      await this.events.setExtraCount(this.event.id, this.extraDraft);
      this.extraCount = this.extraDraft;   // primijeni lokalno
    } finally {
      this.extraBusy = false;
    }
  }
}
