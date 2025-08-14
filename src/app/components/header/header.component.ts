import {
  Component,
  Renderer2,
  HostListener,
  ElementRef,
  Inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

interface AppUser {
  uid: string;
  email: string | null;
  fullName: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnDestroy {
  menuOpen = false;
  dropdownOpen = false;
  user$: Observable<AppUser | null>;

  constructor(
    private renderer: Renderer2,
    public authService: AuthService,
    private elementRef: ElementRef,
    private router: Router,
    @Inject(DOCUMENT) private doc: Document
  ) {
    this.user$ = this.authService.currentUser$;
  }

  // Otvori/zatvori mobilni meni
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.renderer.addClass(this.doc.body, 'menu-open');
    } else {
      this.renderer.removeClass(this.doc.body, 'menu-open');
    }
  }

  // Zatvori mobilni meni
  closeMenu() {
    if (this.menuOpen) this.menuOpen = false;
    this.renderer.removeClass(this.doc.body, 'menu-open');
    this.closeDropdown();
  }

  // Otvori/zatvori dropdown iznad profila
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Zatvori dropdown
  closeDropdown() {
    this.dropdownOpen = false;
  }

  // Ako klik izvan dropdowna – zatvori ga
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.dropdownOpen && !this.elementRef.nativeElement.contains(target)) {
      this.dropdownOpen = false;
    }
  }

  // Po resize-u (desktop breakpoint) zatvori meni i očisti body klasu
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth >= 768 && this.menuOpen) {
      this.menuOpen = false;
      this.renderer.removeClass(this.doc.body, 'menu-open');
    }
  }

  // Odjava i redirekcija na početnu
  async logout() {
    await this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    // osiguraj se da ne ostane klasa na body-ju
    this.renderer.removeClass(this.doc.body, 'menu-open');
  }
}
