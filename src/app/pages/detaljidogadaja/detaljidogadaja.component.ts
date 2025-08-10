import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventsService } from '../../services/events.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-detaljidogadaja',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detaljidogadaja.component.html',
  styleUrls: ['./detaljidogadaja.component.css']
})
export class DetaljiDogadajaComponent implements OnDestroy {
  private sub?: Subscription;
  event: any | null = null;
  notFound = false;

  constructor(private route: ActivatedRoute, private events: EventsService) {
    this.sub = this.route.paramMap.subscribe(async p => {
      const id = p.get('id');
      if (!id) return;
      this.notFound = false;
      this.event = await this.events.getEventById(id);
      if (!this.event) this.notFound = true;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  displayMax(v: number): string {
    return v === 500 ? '∞' : String(v ?? '');
  }
}
