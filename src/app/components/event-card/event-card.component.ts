import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/* Dogadjaj prikazan u kartici. */
export interface EventItem {
  id?: string;
  naslov: string;
  ciljnaPopulacija: string;
  opis?: string;
  datumVrijeme: Date | null;
  mjesto: string;
  /* Napomena: vrijednost 500 u sustavu označava "bez ograničenja". */
  maxSudionika: number;
  imageUrl?: string;
}

/** Vrijednost kojom backend označava "beskonačno" (bez limita). */
const INFINITY_SENTINEL = 500;

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.css'],
  // OnPush: rerender samo kad se promijene @Input reference → brži grid s puno kartica.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardComponent {
  /** Podaci o događaju. Obavezno polje. */
  @Input({ required: true }) event!: EventItem;

  /** Prikaz administratorskih akcija (uredi/obriši). */
  @Input() isAdmin = false;

  /**
   * Iz kojeg konteksta je otvorena kartica.
   * Koristi se za state i query parametar kako bi se mogao napraviti "Back".
   */
  @Input() from?: string;

  /** Emiteri akcija (ne mijenjamo reference, pa su readonly). */
  @Output() readonly edit = new EventEmitter<EventItem>();
  @Output() readonly remove = new EventEmitter<EventItem>();

  /** True ako sistemska sentinel-vrijednost označava "bez ograničenja". */
  get isInfinity(): boolean {
    return this.event?.maxSudionika === INFINITY_SENTINEL;
  }

  /** Zajednički helper za state/query parametre. */
  private get fromParams(): Record<string, unknown> | undefined {
    return this.from ? { from: this.from } : undefined;
  }

  /** Router state payload (koristi se u [state]). */
  get linkState(): Record<string, unknown> | undefined {
    return this.fromParams;
  }

  /** Query parametri (koristi se u [queryParams]). */
  get linkQuery(): Record<string, unknown> | undefined {
    return this.fromParams;
  }

  /**
   * Sprječavamo default ponašanje <a> i bubbling, jer su tipke u linku.
   * Emitiramo domenski event prema parent komponenti.
   */
  onEdit(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.edit.emit(this.event);
  }

  onRemove(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.remove.emit(this.event);
  }
}
