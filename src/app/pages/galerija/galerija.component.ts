import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryService } from '../../services/gallery.service';
import { AuthService } from '../../services/auth.service';

type ImgItem = string | { thumb?: string; full?: string };

@Component({
  selector: 'app-galerija',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galerija.component.html',
  styleUrl: './galerija.component.css',
})
export class GalerijaComponent implements OnInit {
  images: ImgItem[] = [];
  selectedIndex: number | null = null;
  touchStartX = 0;
  touchEndX = 0;

  // upload
  selectedFile: File | null = null;
  uploading = false;
  isAdmin = false;

  constructor(
    private galleryService: GalleryService,
    public authService: AuthService
  ) {}

  async ngOnInit() {
    // admin status (bez pristupa privatnim poljima)
    this.authService.isAdmin$.subscribe((v) => (this.isAdmin = v));

    // učitaj slike (trenutno vraća URL stringove)
    this.images = await this.galleryService.listGallery();
  }

  // ==== helpers za template (da ne koristimo "as any" u HTML-u) ====
  getThumb(img: ImgItem): string {
    return typeof img === 'string' ? img : img.thumb || img.full || '';
  }
  getFull(img: ImgItem): string {
    return typeof img === 'string' ? img : img.full || img.thumb || '';
  }

  // modal
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
      this.selectedIndex =
        (this.selectedIndex - 1 + this.images.length) % this.images.length;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (this.selectedIndex === null) return;
    if (event.key === 'ArrowRight') this.nextImage();
    if (event.key === 'ArrowLeft') this.prevImage();
    if (event.key === 'Escape') this.closeModal();
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
      delta < 0 ? this.nextImage() : this.prevImage();
    }
  }

  // upload
  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.selectedFile =
      input.files && input.files.length ? input.files[0] : null;
  }

  async uploadImage() {
    if (!this.selectedFile || this.uploading) return;
    this.uploading = true;
    try {
      const url = await this.galleryService.uploadToGallery(this.selectedFile);
      this.images.push(url); // i dalje string URL (ok)
      this.selectedFile = null;
    } finally {
      this.uploading = false;
    }
  }

  async deleteImage(img: ImgItem) {
    if (!confirm('Jesi siguran/na da želiš obrisati ovu sliku?')) return;
    try {
      const url = this.getFull(img);
      await this.galleryService.deleteImageByUrl(url);
      this.images = this.images.filter((u) => this.getFull(u) !== url);
    } catch (e) {
      console.error('Greška pri brisanju slike:', e);
    }
  }
}
