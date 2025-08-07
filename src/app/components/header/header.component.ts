import {
  Component,
  Renderer2,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  menuOpen = false;
  dropdownOpen = false;
  user$: Observable<AppUser | null>;

  constructor(
    private renderer: Renderer2,
    public authService: AuthService,
    private elementRef: ElementRef,
    private router: Router
  ) {
    this.user$ = this.authService.currentUser$;
  }

  // Otvori/zatvori mobilni meni
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.renderer.setProperty(
      document.body.classList,
      this.menuOpen ? 'add' : 'remove',
      'menu-open'
    );
  }

  // Zatvori mobilni meni
  closeMenu() {
    this.menuOpen = false;
    this.renderer.removeClass(document.body, 'menu-open');
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
    if (
      this.dropdownOpen &&
      !this.elementRef.nativeElement.contains(target)
    ) {
      this.dropdownOpen = false;
    }
  }

  // Odjava i redirekcija na početnu
  logout() {
    this.authService.logout().then(() => {
      this.closeMenu();
      this.closeDropdown();
      this.router.navigate(['/']);
    });
  }
}
