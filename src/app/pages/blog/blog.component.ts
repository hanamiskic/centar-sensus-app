import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BlogService, BlogPost } from '../../services/blog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
})
export class BlogComponent implements OnInit, OnDestroy {
  private sub?: Subscription;

  isAdmin = false;
  showForm = false;
  isSubmitting = false;     // sprječava dvostruke klikove
  isLoading = false;        // spinner/placeholder za listu

  // forma (create/edit)
  title = '';
  content = '';
  selectedImage: File | null = null;

  // edit stanje
  editingId: string | null = null;
  originalImageUrl: string | null = null;

  // podaci
  posts: BlogPost[] = [];

  constructor(
    private auth: AuthService,
    private blog: BlogService
  ) {}

  ngOnInit(): void {
    // tko je admin (za prikaz gumba) — 1 subscription je ok
    this.sub = this.auth.isAdmin$.subscribe(v => (this.isAdmin = v));

    // učitaj postove
    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** Otvori/zatvori formu. Ako je bio edit, resetiraj stanje. */
  toggleNewPost(): void {
    if (this.showForm && this.editingId) {
      this.resetForm();
      this.editingId = null;
      this.originalImageUrl = null;
    }
    this.showForm = !this.showForm;
  }

  /** Create validacija: naslov + tekst + slika su obavezni. */
  isFormValid(): boolean {
    return (
      this.title.trim().length > 0 &&
      this.content.trim().length > 0 &&
      !!this.selectedImage
    );
  }

  /** Edit validacija: slika nije obavezna. */
  canSaveEdit(): boolean {
    return this.title.trim().length > 0 && this.content.trim().length > 0;
  }

  /** Odabir slike iz file inputa. */
  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.selectedImage = input.files && input.files.length ? input.files[0] : null;
  }

  /** Očisti polja forme. */
  resetForm(): void {
    this.title = '';
    this.content = '';
    this.selectedImage = null;
  }

  /** Sigurno formatiraj datum (radi i s Firestore Timestamp-om). */
  formatDate(d: Date | any | null): string {
    if (!d) return '';
    // Firestore Timestamp ima metodu toDate()
    const date: Date = typeof d?.toDate === 'function' ? d.toDate() : d;
    const dd = date.getDate().toString().padStart(2, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}. ${mm}. ${yyyy}.`;
  }

  /** trackBy smanjuje re-render liste (brže kod puno elemenata). */
  trackPost = (_: number, p: BlogPost) => p.id;

  // Data (CRUD)

  /** Učitaj sve postove. */
  async loadPosts(): Promise<void> {
    this.isLoading = true;
    try {
      const list = await this.blog.listPosts();
      this.posts = list;
    } finally {
      this.isLoading = false;
    }
  }

  /** Kreiraj novi post (slika je obavezna po tvojoj logici). */
  async addPost(): Promise<void> {
    if (!this.isFormValid() || !this.selectedImage) {
      alert('Naslov, tekst i slika su obavezni.');
      return;
    }
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    try {
      await this.blog.addPost(
        { title: this.title.trim(), content: this.content.trim() },
        this.selectedImage
      );

      // Zatvori formu i očisti
      this.showForm = false;
      this.resetForm();

      // Re-fetch
      await this.loadPosts();
    } finally {
      this.isSubmitting = false;
    }
  }

  /** Uđi u edit mod za odabrani post. */
  startEdit(p: BlogPost): void {
    this.editingId = p.id;
    this.originalImageUrl = p.imageUrl;
    this.title = p.title;
    this.content = p.content;
    this.selectedImage = null; // slika opcionalna pri uređivanju
    this.showForm = true;
  }

  /** Spremi izmjene. */
  async saveEdit(): Promise<void> {
    if (!this.editingId || this.isSubmitting) return;

    this.isSubmitting = true;
    try {
      await this.blog.updatePost(
        this.editingId,
        { title: this.title.trim(), content: this.content.trim() },
        this.selectedImage || undefined,
        this.originalImageUrl || undefined
      );

      // Reset stanja
      this.editingId = null;
      this.originalImageUrl = null;
      this.showForm = false;
      this.resetForm();

      await this.loadPosts();
    } finally {
      this.isSubmitting = false;
    }
  }

  /** Zatvori formu / odustani od uređivanja. */
  cancelEditOrClose(): void {
    this.showForm = false;
    this.editingId = null;
    this.originalImageUrl = null;
    this.resetForm();
  }

  /** Obriši post (uz potvrdu). */
  async deletePost(p: BlogPost): Promise<void> {
    const ok = confirm(`Obrisati post: "${p.title}"?`);
    if (!ok) return;

    await this.blog.deletePost(p.id, p.imageUrl);
    await this.loadPosts();
  }
}
