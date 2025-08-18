import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryService } from '../../services/gallery.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

type ImgItem = string | { thumb?: string; full?: string };

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit, OnDestroy {
  private adminSub?: Subscription;

  images: ImgItem[] = [];
  selectedIndex: number | null = null;

  // touch swipe
  private touchStartX = 0;
  private touchEndX = 0;

  // upload
  selectedFile: File | null = null;
  uploading = false;
  isAdmin = false;

  constructor(
    private galleryService: GalleryService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    // admin status (za prikaz upload/brisanje)
    this.adminSub = this.authService.isAdmin$.subscribe(v => (this.isAdmin = v));

    // učitaj listu (zadnje dodane prve — uplaod ima timestamp prefiks)
    try {
      const list = await this.galleryService.listGallery();
      this.images = [...list].reverse();
    } catch {
      this.images = [];
    }
  }

  ngOnDestroy(): void {
    this.adminSub?.unsubscribe();
  }

  // helpers za template
  getThumb(img: ImgItem): string {
    return typeof img === 'string' ? img : img.thumb || img.full || '';
  }
  getFull(img: ImgItem): string {
    return typeof img === 'string' ? img : img.full || img.thumb || '';
  }

  // modal
  openModal(index: number): void {
    if (!this.images.length) return;
    this.selectedIndex = index;
    this.prefetchNeighbors(index); // UX: pripremi susjedne slike
  }

  closeModal(): void {
    this.selectedIndex = null;
  }

  nextImage(): void {
    if (this.selectedIndex === null || this.images.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.images.length;
    this.prefetchNeighbors(this.selectedIndex);
  }

  prevImage(): void {
    if (this.selectedIndex === null || this.images.length === 0) return;
    this.selectedIndex = (this.selectedIndex - 1 + this.images.length) % this.images.length;
    this.prefetchNeighbors(this.selectedIndex);
  }

  // navigacija u modalu
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (this.selectedIndex === null) return;
    if (event.key === 'ArrowRight') this.nextImage();
    if (event.key === 'ArrowLeft') this.prevImage();
    if (event.key === 'Escape') this.closeModal();
  }

  // touch swipe u modalu
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }
  private handleSwipe(): void {
    const delta = this.touchEndX - this.touchStartX;
    if (Math.abs(delta) > 50) {
      delta < 0 ? this.nextImage() : this.prevImage();
    }
  }

  // blagi prefetch susjednih slika
  private prefetchNeighbors(i: number): void {
    const preload = (url: string) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    };
    const prev = this.images[(i - 1 + this.images.length) % this.images.length];
    const next = this.images[(i + 1) % this.images.length];
    if (prev) preload(this.getFull(prev));
    if (next) preload(this.getFull(next));
  }

  // upload
  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length ? input.files[0] : null;
  }

  async uploadImage(): Promise<void> {
    if (!this.selectedFile || this.uploading) return;
    this.uploading = true;
    try {
      const url = await this.galleryService.uploadToGallery(this.selectedFile);
      // novu sliku stavi na početak
      this.images.unshift(url);
      this.selectedFile = null;
    } finally {
      this.uploading = false;
    }
  }

  // brisanje 
  async deleteImage(img: ImgItem): Promise<void> {
    if (!confirm('Jesi siguran/na da želiš obrisati ovu sliku?')) return;
    const url = this.getFull(img);
    try {
      await this.galleryService.deleteImageByUrl(url);
      this.images = this.images.filter(u => this.getFull(u) !== url);
    } catch {
      // bez konzolnih logova
    }
  }
}
