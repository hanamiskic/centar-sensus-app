import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';  
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';
import { EventRegistrationsService } from '../../services/event-registrations.service';

// Reusable kartica
import { EventCardComponent } from '../../components/event-card/event-card.component';

interface EventItem {
  id?: string;
  naslov: string;
  ciljnaPopulacija: string;
  opis?: string;
  datumVrijeme: Date | null;
  mjesto: string;
  maxSudionika: number;
  imageUrl?: string;
  extraCount?: number;   // ručno dodani sudionici (admin)
}

interface EventFormData {
  naslov: string;
  ciljnaPopulacija: string;
  opis: string;
  datumVrijeme: string;
  mjesto: string;
  maxSudionika: number;
}

@Component({
  selector: 'app-dogadaji',
  standalone: true,
  imports: [CommonModule, FormsModule, EventCardComponent],
  templateUrl: './dogadaji.component.html',
  styleUrls: ['./dogadaji.component.css']
})
export class DogadajiComponent implements OnInit, OnDestroy {
  private authSub?: Subscription;

  // prava i data
  isAdmin = false;
  events: EventItem[] = [];

  // sentinel za “neograničeno”
  readonly MAX_LIMIT = 500;

  // Dodavanje
  showForm = false;
  formData: EventFormData = this.getEmptyForm();
  selectedImage: File | null = null;

  // Uređivanje
  editingId: string | null = null;
  editData: EventFormData = this.getEmptyForm();
  editSelectedImage: File | null = null;
  editingOriginalImageUrl = '';

  // Filteri
  populationOptions: string[] = [
    'SVI','DJECA','DJECA I MLADI','ŽENE','ODRASLI','ODGAJATELJI','RODITELJI I BUDUĆI RODITELJI'
  ];
  months = [
    { value: '01', label: 'Siječanj' }, { value: '02', label: 'Veljača' },
    { value: '03', label: 'Ožujak' },   { value: '04', label: 'Travanj' },
    { value: '05', label: 'Svibanj' },  { value: '06', label: 'Lipanj' },
    { value: '07', label: 'Srpanj' },   { value: '08', label: 'Kolovoz' },
    { value: '09', label: 'Rujan' },    { value: '10', label: 'Listopad' },
    { value: '11', label: 'Studeni' },  { value: '12', label: 'Prosinac' }
  ];
  filters: { month: string; populacija: string; status: '' | 'free' | 'full' } = {
    month: '',
    populacija: '',
    status: ''
  };

  // broj stvarnih prijava po eventu (za filter statusa)
  regCount: Record<string, number> = {};
  countsReady = false;

  constructor(
    private authService: AuthService,
    private eventsService: EventsService,
    private regs: EventRegistrationsService
  ) {}

  ngOnInit(): void {
    // status admina (za prikaz formi/gumbova)
    this.authSub = this.authService.isAdmin$.subscribe(v => (this.isAdmin = v));
    // početni load
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  // Datum helpers

  private coerceDate(d: any): Date | null {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
    if (d?.toDate) {
      const dt = d.toDate();
      return dt instanceof Date && !isNaN(dt.getTime()) ? dt : null;
    }
    if (typeof d === 'string' || typeof d === 'number') {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : dt;
    }
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  private toMs(d: Date | null): number { return d ? d.getTime() : 0; }

  private getMonthStr(d: Date | null): string {
    if (!d) return '';
    const m = d.getMonth() + 1;
    return m.toString().padStart(2, '0');
  }

  private formatForInput(date: Date | null): string {
    if (!date) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // Filtrirano + sortirano

  get filteredEvents(): EventItem[] {
    const { month, populacija: pop, status } = this.filters;

    return (this.events || []).filter(e => {
      const monthOk = !month || this.getMonthStr(e.datumVrijeme) === month;
      const popOk   = !pop   || e.ciljnaPopulacija === pop;

      // status: free (nije pun) ili full (pun) – čekamo countsReady
      const statusOk = !status || !this.countsReady
        ? true
        : (status === 'free' ? !this.isFull(e) : this.isFull(e));

      return monthOk && popOk && statusOk;
    });
  }

  get activeEvents(): EventItem[] {
    const now = Date.now();
    return this.filteredEvents
      .filter(e => this.toMs(e.datumVrijeme) > now)
      .sort((a, b) => this.toMs(a.datumVrijeme) - this.toMs(b.datumVrijeme));
  }

  get finishedEvents(): EventItem[] {
    const now = Date.now();
    return this.filteredEvents
      .filter(e => this.toMs(e.datumVrijeme) <= now)
      .sort((a, b) => this.toMs(b.datumVrijeme) - this.toMs(a.datumVrijeme));
  }

  resetFilters(): void {
    this.filters = { month: '', populacija: '', status: '' };
  }


  private getEmptyForm(): EventFormData {
    return { naslov:'', ciljnaPopulacija:'', opis:'', datumVrijeme:'', mjesto:'', maxSudionika:0 };
  }

  displayMax(value: number): string | number {
    return value === this.MAX_LIMIT ? '∞' : value;
  }

  blockNonNumericKey(ev: KeyboardEvent): void {
    const blocked = ['e','E','+','-','.',',',' '];
    if (blocked.includes(ev.key)) ev.preventDefault();
  }

  normalizeMaxSudionika(): void {
    let v = Number(this.formData.maxSudionika);
    if (Number.isNaN(v)) v = 0;
    v = Math.floor(v);
    if (v > 0 && v < 1) v = 1;
    if (v > this.MAX_LIMIT) v = this.MAX_LIMIT;
    this.formData.maxSudionika = v;
  }

  isFormValid(): boolean {
    const f = this.formData;
    const filled =
      f.naslov.trim().length > 0 &&
      f.ciljnaPopulacija.trim().length > 0 &&
      f.opis.trim().length > 0 &&
      f.datumVrijeme.trim().length > 0 &&
      f.mjesto.trim().length > 0;

    const maxOk =
      typeof f.maxSudionika === 'number' &&
      f.maxSudionika >= 1 &&
      f.maxSudionika <= this.MAX_LIMIT;

    const imageOk = !!this.selectedImage;
    return filled && maxOk && imageOk;
  }

  isEditValid(): boolean {
    const f = this.editData;
    const filled =
      f.naslov.trim().length > 0 &&
      f.ciljnaPopulacija.trim().length > 0 &&
      f.opis.trim().length > 0 &&
      f.datumVrijeme.trim().length > 0 &&
      f.mjesto.trim().length > 0;

    const maxOk =
      typeof f.maxSudionika === 'number' &&
      f.maxSudionika >= 1 &&
      f.maxSudionika <= this.MAX_LIMIT;

    return filled && maxOk;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.formData = this.getEmptyForm();
      this.selectedImage = null;
    }
  }

  // Data

  async loadEvents(): Promise<void> {
    const raw = await this.eventsService.listEvents();

    // normaliziraj datum i povuci ručno dodane
    this.events = (raw as any[]).map(e => ({
      ...e,
      datumVrijeme: this.coerceDate(e?.datumVrijeme),
      extraCount: Number(e?.extraCount ?? 0),
    })) as EventItem[];

    await this.loadRegistrationCounts();
  }

  private async loadRegistrationCounts(): Promise<void> {
    this.countsReady = false;

    const ids = (this.events || []).map(e => e.id!).filter(Boolean);
    const results = await Promise.all(
      ids.map(async id => ({ id, count: await this.regs.countForEvent(id) }))
    );

    const map: Record<string, number> = {};
    for (const r of results) map[r.id] = r.count;

    this.regCount = map;
    this.countsReady = true;
  }

  // status popunjenosti
  private getCount(e: EventItem): number {
    return e.id ? (this.regCount[e.id] ?? 0) : 0;
  }

  private getTotalCount(e: EventItem): number {
    return this.getCount(e) + Number(e.extraCount ?? 0);
  }

  private isUnlimited(e: EventItem): boolean {
    return Number(e.maxSudionika ?? 0) === this.MAX_LIMIT;
  }

  private isFull(e: EventItem): boolean {
    if (this.isUnlimited(e)) return false;
    const cap = Number(e.maxSudionika || 0);
    if (cap <= 0) return false;
    return this.getTotalCount(e) >= cap;
  }

  // Handleri

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.selectedImage = input.files && input.files.length ? input.files[0] : null;
  }

  async addEvent(): Promise<void> {
    this.normalizeMaxSudionika();
    if (!this.isFormValid()) {
      alert('Molimo ispunite sva polja i dodajte sliku.');
      return;
    }
    await this.eventsService.addEvent(this.formData, this.selectedImage!);
    this.showForm = false;
    this.formData = this.getEmptyForm();
    this.selectedImage = null;
    await this.loadEvents();
  }

  startEdit(e: EventItem): void {
    if (!e.id) return;
    this.editingId = e.id;
    this.editSelectedImage = null;
    this.editingOriginalImageUrl = e.imageUrl || '';
    this.editData = {
      naslov: e.naslov,
      ciljnaPopulacija: e.ciljnaPopulacija,
      opis: e.opis || '',
      datumVrijeme: this.formatForInput(e.datumVrijeme),
      mjesto: e.mjesto,
      maxSudionika: e.maxSudionika ?? 0
    };
    this.showForm = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onEditFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.editSelectedImage = input.files && input.files.length ? input.files[0] : null;
  }

  async saveEdit(): Promise<void> {
    if (!this.editingId) return;
    if (!this.isEditValid()) {
      alert('Molimo provjerite polja.');
      return;
    }
    await this.eventsService.updateEvent(
      this.editingId, this.editData, this.editSelectedImage, this.editingOriginalImageUrl
    );
    this.cancelEdit();
    await this.loadEvents();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editData = this.getEmptyForm();
    this.editSelectedImage = null;
    this.editingOriginalImageUrl = '';
  }

  async deleteEvent(e: EventItem): Promise<void> {
    if (!e.id) return;
    const ok = confirm(`Obrisati događaj "${e.naslov}"?`);
    if (!ok) return;
    await this.eventsService.deleteEvent(e.id, e.imageUrl);
    await this.loadEvents();
  }
}
