import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface EventItem {
  id?: string;
  naslov: string;
  ciljnaPopulacija: string;
  opis?: string;
  datumVrijeme: Date | null;
  mjesto: string;
  maxSudionika: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.css']
})
export class EventCardComponent {
  @Input() event!: EventItem;
  @Input() isAdmin = false;

  // optional source marker: "profil", "dogadaji", ...
  @Input() from?: string;

  @Output() edit = new EventEmitter<EventItem>();
  @Output() remove = new EventEmitter<EventItem>();

  get isInfinity(): boolean { return Number(this.event?.maxSudionika) === 500; }

  // ✅ RouterLink types want undefined (not null)
  get linkState(): { [k: string]: any } | undefined {
    return this.from ? { from: this.from } : undefined;
  }
  get linkQuery(): { [k: string]: any } | undefined {
    return this.from ? { from: this.from } : undefined;
  }

  onEdit(e: MouseEvent){ e.preventDefault(); e.stopPropagation(); this.edit.emit(this.event); }
  onRemove(e: MouseEvent){ e.preventDefault(); e.stopPropagation(); this.remove.emit(this.event); }
}
