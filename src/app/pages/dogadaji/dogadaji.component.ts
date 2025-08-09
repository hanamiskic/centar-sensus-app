import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-dogadaji',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './dogadaji.component.html',
  styleUrls: ['./dogadaji.component.css']
})
export class DogadajiComponent implements OnInit {
  isAdmin = false;
  events: any[] = [];

  // forma
  showForm = false;
  formData = {
    naslov: '',
    ciljnaPopulacija: '',
    opis: '',
    datumVrijeme: '',
    mjesto: '',
    maxSudionika: 0
  };
  selectedImage: File | null = null;

  constructor(private authService: AuthService, private eventsService: EventsService) {}

  ngOnInit() {
    this.authService.isAdmin$.subscribe(v => this.isAdmin = v);
    this.loadEvents();
  }

  async loadEvents() {
    this.events = await this.eventsService.listEvents();
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.selectedImage = input.files && input.files.length ? input.files[0] : null;
  }

  async addEvent() {
    if (!this.selectedImage) {
      alert('Odaberite sliku!');
      return;
    }
    await this.eventsService.addEvent(this.formData, this.selectedImage);
    this.showForm = false;
    this.formData = {
      naslov: '',
      ciljnaPopulacija: '',
      opis: '',
      datumVrijeme: '',
      mjesto: '',
      maxSudionika: 0
    };
    this.selectedImage = null;
    await this.loadEvents();
  }
}
