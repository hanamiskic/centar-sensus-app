import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';
import { Subscription } from 'rxjs';

interface EventFormData {
  naslov: string;
  ciljnaPopulacija: string;
  opis: string;
  datumVrijeme: string; // ISO iz <input type="datetime-local">
  mjesto: string;
  maxSudionika: number;
}

@Component({
  selector: 'app-dogadaji',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './dogadaji.component.html',
  styleUrls: ['./dogadaji.component.css']
})
export class DogadajiComponent implements OnInit, OnDestroy {
  private authSub?: Subscription;

  isAdmin = false;
  events: any[] = [];

  readonly MAX_LIMIT = 500; // 500 = ∞

  // forma
  showForm = false;
  formData: EventFormData = this.getEmptyForm();
  selectedImage: File | null = null;

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

  // ===== Utili =====
  private getEmptyForm(): EventFormData {
    return {
      naslov: '',
      ciljnaPopulacija: '',
      opis: '',
      datumVrijeme: '',
      mjesto: '',
      maxSudionika: 0
    };
  }

  // Prikaz ∞ ako je 500
  displayMax(value: number): string | number {
    return value === this.MAX_LIMIT ? '∞' : value;
  }

  // Blokiraj nenumeričke tipke u inputu (poveži u templatu na (keydown))
  blockNonNumericKey(ev: KeyboardEvent) {
    const blocked = ['e', 'E', '+', '-', '.', ',', ' '];
    if (blocked.includes(ev.key)) ev.preventDefault();
  }

  // Klampanje i normalizacija vrijednosti (poveži u templatu na (input) ili (change))
  normalizeMaxSudionika() {
    let v = Number(this.formData.maxSudionika);

    if (Number.isNaN(v)) v = 0;

    // samo cijeli brojevi
    v = Math.floor(v);

    // minimalno 1 ako je popunjeno
    if (v > 0 && v < 1) v = 1;

    // maksimalno 500
    if (v > this.MAX_LIMIT) v = this.MAX_LIMIT;

    this.formData.maxSudionika = v;
  }

  // Je li forma spremna za spremanje
  isFormValid(): boolean {
    const f = this.formData;
    const filled =
      f.naslov?.trim().length > 0 &&
      f.ciljnaPopulacija?.trim().length > 0 &&
      f.opis?.trim().length > 0 &&
      f.datumVrijeme?.toString().length > 0 &&
      f.mjesto?.trim().length > 0;

    const maxOk = typeof f.maxSudionika === 'number' && f.maxSudionika >= 1 && f.maxSudionika <= this.MAX_LIMIT;

    // Ako je slika obavezna
    const imageOk = !!this.selectedImage;

    return filled && maxOk && imageOk;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (this.showForm) {
      // resetiraj formu pri otvaranju
      this.formData = this.getEmptyForm();
      this.selectedImage = null;
    }
  }

  // ===== Data =====
  async loadEvents() {
    this.events = await this.eventsService.listEvents();
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.selectedImage = input.files && input.files.length ? input.files[0] : null;
  }

  async addEvent() {
    // finalno klampanje prije slanja
    this.normalizeMaxSudionika();

    if (!this.isFormValid()) {
      alert('Molimo ispunite sva obavezna polja (uključujući sliku) i provjerite broj sudionika.');
      return;
    }

    // Ako želiš striktno postaviti 500 kad je veće od 500,
    // normalizeMaxSudionika već to radi.

    await this.eventsService.addEvent(this.formData, this.selectedImage!);

    this.showForm = false;
    this.formData = this.getEmptyForm();
    this.selectedImage = null;

    await this.loadEvents();
  }
}
