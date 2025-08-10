import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

/** Stavka iz baze / za listanje (date je pravi Date ili null) */
interface EventItem {
  id?: string;
  naslov: string;
  ciljnaPopulacija: string;
  opis?: string;
  datumVrijeme: Date | null;
  mjesto: string;
  maxSudionika: number;
  imageUrl?: string;
}

/** Podaci iz forme (datetime-local = string) */
interface EventFormData {
  naslov: string;
  ciljnaPopulacija: string;
  opis: string;
  datumVrijeme: string; // <-- string iz <input type="datetime-local">
  mjesto: string;
  maxSudionika: number;
}

@Component({
  selector: 'app-dogadaji',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIf, NgFor],
  templateUrl: './dogadaji.component.html',
  styleUrls: ['./dogadaji.component.css']
})
export class DogadajiComponent implements OnInit, OnDestroy {
  private authSub?: Subscription;

  isAdmin = false;
  events: EventItem[] = [];

  readonly MAX_LIMIT = 500;

  // Dodavanje
  showForm = false;
  formData: EventFormData = this.getEmptyForm();
  selectedImage: File | null = null;

  // Uređivanje
  editingId: string | null = null;
  editData: EventFormData = this.getEmptyForm();      // koristi string datume
  editSelectedImage: File | null = null;
  editingOriginalImageUrl = '';

  // Filteri
  populationOptions: string[] = [
    'SVI','DJECA','DJECA I MLADI','ŽENE','ODRASLI','ODGAJATELJI','RODITELJI I BUDUĆI RODITELJI'
  ];
  months = [
    { value: '',   label: 'Svi mjeseci' },
    { value: '01', label: 'Siječanj' }, { value: '02', label: 'Veljača' },
    { value: '03', label: 'Ožujak' },   { value: '04', label: 'Travanj' },
    { value: '05', label: 'Svibanj' },  { value: '06', label: 'Lipanj' },
    { value: '07', label: 'Srpanj' },   { value: '08', label: 'Kolovoz' },
    { value: '09', label: 'Rujan' },    { value: '10', label: 'Listopad' },
    { value: '11', label: 'Studeni' },  { value: '12', label: 'Prosinac' }
  ];
  filters = { month: '', populacija: '' };

  constructor(
    private authService: AuthService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.authSub = this.authService.isAdmin$.subscribe(v => (this.isAdmin = v));
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  // ===== Helpers za datum =====
  private coerceDate(d: any): Date | null {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
    if (typeof d === 'string' || typeof d === 'number') {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : dt;
    }
    if (d?.toDate) {
      const dt = d.toDate();
      return dt instanceof Date && !isNaN(dt.getTime()) ? dt : null;
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

  /** Pretvori Date -> 'YYYY-MM-DDTHH:mm' za <input type="datetime-local"> */
  private formatForInput(date: Date | null): string {
    if (!date) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // ===== Filtrirano + sortirano =====
  get filteredEvents(): EventItem[] {
    const month = this.filters.month;
    const pop = this.filters.populacija;
    return (this.events || []).filter(e => {
      const monthOk = !month || this.getMonthStr(e.datumVrijeme) === month;
      const popOk = !pop || e.ciljnaPopulacija === pop;
      return monthOk && popOk;
    });
  }

  get activeEvents(): EventItem[] {
    const now = Date.now();
    return this.filteredEvents
      .filter(e => this.toMs(e.datumVrijeme) > now)
      .sort((a, b) => this.toMs(b.datumVrijeme) - this.toMs(a.datumVrijeme));
  }

  get finishedEvents(): EventItem[] {
    const now = Date.now();
    return this.filteredEvents
      .filter(e => this.toMs(e.datumVrijeme) <= now)
      .sort((a, b) => this.toMs(b.datumVrijeme) - this.toMs(a.datumVrijeme));
  }

  resetFilters() { this.filters = { month: '', populacija: '' }; }

  // ===== Utili =====
  private getEmptyForm(): EventFormData {
    return { naslov:'', ciljnaPopulacija:'', opis:'', datumVrijeme:'', mjesto:'', maxSudionika:0 };
  }

  displayMax(value: number): string | number { return value === this.MAX_LIMIT ? '∞' : value; }

  blockNonNumericKey(ev: KeyboardEvent) {
    const blocked = ['e','E','+','-','.',',',' '];
    if (blocked.includes(ev.key)) ev.preventDefault();
  }

  normalizeMaxSudionika() {
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

    const imageOk = !!this.selectedImage; // slika obavezna kod dodavanja
    return filled && maxOk && imageOk;
  }

  // === EDIT validacija (slika nije obavezna) ===
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

  toggleForm() {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.formData = this.getEmptyForm();
      this.selectedImage = null;
    }
  }

  // ===== Data =====
  async loadEvents() {
    const raw = await this.eventsService.listEvents();
    this.events = (raw as any[]).map(e => ({
      ...e,
      datumVrijeme: this.coerceDate(e?.datumVrijeme)
    })) as EventItem[];
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.selectedImage = input.files && input.files.length ? input.files[0] : null;
  }

  async addEvent() {
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

  // ====== UREĐIVANJE / BRISANJE ======
  startEdit(e: EventItem) {
    if (!e.id) return;
    this.editingId = e.id;
    this.editSelectedImage = null;
    this.editingOriginalImageUrl = e.imageUrl || '';

    this.editData = {
      naslov: e.naslov,
      ciljnaPopulacija: e.ciljnaPopulacija,
      opis: e.opis || '',
      datumVrijeme: this.formatForInput(e.datumVrijeme), // string za input
      mjesto: e.mjesto,
      maxSudionika: e.maxSudionika ?? 0
    };

    this.showForm = false; // zatvori dodavanje
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onEditFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.editSelectedImage = input.files && input.files.length ? input.files[0] : null;
  }

  async saveEdit() {
    if (!this.editingId) return;
    if (!this.isEditValid()) {
      alert('Molimo provjerite polja.');
      return;
    }
    await this.eventsService.updateEvent(
      this.editingId,
      this.editData,                 // ima string datumVrijeme
      this.editSelectedImage,
      this.editingOriginalImageUrl
    );
    this.cancelEdit();
    await this.loadEvents();
  }

  cancelEdit() {
    this.editingId = null;
    this.editData = this.getEmptyForm();
    this.editSelectedImage = null;
    this.editingOriginalImageUrl = '';
  }

  async deleteEvent(e: EventItem) {
    if (!e.id) return;
    const ok = confirm(`Obrisati događaj "${e.naslov}"?`);
    if (!ok) return;
    await this.eventsService.deleteEvent(e.id, e.imageUrl);
    await this.loadEvents();
  }
}
