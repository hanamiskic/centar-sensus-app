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

  // forma
  title = '';
  content = '';
  selectedImage: File | null = null;

  // edit stanje
  editingId: string | null = null;
  originalImageUrl: string | null = null;

  posts: BlogPost[] = [];

  constructor(
    private auth: AuthService,
    private blog: BlogService
  ) {}

  ngOnInit(): void {
    this.sub = this.auth.isAdmin$.subscribe(v => this.isAdmin = v);
    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ===== helpers =====
  toggleNewPost() {
    // ako smo u edit modu – resetiraj
    if (this.showForm && this.editingId) {
      this.resetForm();
      this.editingId = null;
      this.originalImageUrl = null;
    }
    this.showForm = !this.showForm;
  }

  isFormValid(): boolean {
    return (
      this.title.trim().length > 0 &&
      this.content.trim().length > 0 &&
      !!this.selectedImage
    );
  }

  canSaveEdit(): boolean {
    // kod uređivanja slika nije obavezna
    return this.title.trim().length > 0 && this.content.trim().length > 0;
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.selectedImage = input.files && input.files.length ? input.files[0] : null;
  }

  resetForm() {
    this.title = '';
    this.content = '';
    this.selectedImage = null;
  }

  formatDate(d: Date | null): string {
    if (!d) return '';
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}. ${mm}. ${yyyy}.`;
  }

  // ===== data =====
  async loadPosts() {
    this.posts = await this.blog.listPosts();
  }

  async addPost() {
    if (!this.isFormValid() || !this.selectedImage) {
      alert('Naslov, tekst i slika su obavezni.');
      return;
    }
    await this.blog.addPost({ title: this.title, content: this.content }, this.selectedImage);
    this.showForm = false;
    this.resetForm();
    await this.loadPosts();
  }

  // ===== edit =====
  startEdit(p: BlogPost) {
    this.editingId = p.id;
    this.originalImageUrl = p.imageUrl;
    this.title = p.title;
    this.content = p.content;
    this.selectedImage = null; // slika nije obavezna pri uređivanju
    this.showForm = true;
    // skrolaj do forme po želji
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async saveEdit() {
    if (!this.editingId) return;

    await this.blog.updatePost(
      this.editingId,
      { title: this.title, content: this.content },
      this.selectedImage || undefined,
      this.originalImageUrl || undefined
    );

    this.editingId = null;
    this.originalImageUrl = null;
    this.showForm = false;
    this.resetForm();
    await this.loadPosts();
  }

  cancelEditOrClose() {
    this.showForm = false;
    this.editingId = null;
    this.originalImageUrl = null;
    this.resetForm();
  }

  // ===== delete =====
  async deletePost(p: BlogPost) {
    const ok = confirm(`Obrisati post: "${p.title}"?`);
    if (!ok) return;
    await this.blog.deletePost(p.id, p.imageUrl);
    await this.loadPosts();
  }
}
