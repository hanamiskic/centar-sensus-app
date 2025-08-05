import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-galerija',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galerija.component.html',
  styleUrl: './galerija.component.css'
})
export class GalerijaComponent {
  images: string[] = [];
  selectedIndex: number | null = null;
  touchStartX: number = 0;
  touchEndX: number = 0;

  constructor() {
    for (let i = 1; i <= 20; i++) {
      this.images.push(`/galerija/sensus-${i}.jpg`);
    }
  }

  openModal(index: number) {
    this.selectedIndex = index;
  }

  closeModal() {
    this.selectedIndex = null;
  }

  nextImage() {
    if (this.selectedIndex !== null) {
      this.selectedIndex = (this.selectedIndex + 1) % this.images.length;
    }
  }

  prevImage() {
    if (this.selectedIndex !== null) {
      this.selectedIndex = (this.selectedIndex - 1 + this.images.length) % this.images.length;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (this.selectedIndex === null) return;

    switch (event.key) {
      case 'ArrowRight':
        this.nextImage();
        break;
      case 'ArrowLeft':
        this.prevImage();
        break;
      case 'Escape':
        this.closeModal();
        break;
    }
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe() {
    const delta = this.touchEndX - this.touchStartX;
    if (Math.abs(delta) > 50) {
      if (delta < 0) {
        this.nextImage();
      } else {
        this.prevImage();
      }
    }
  }
}
