import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/* Auth komponenta (prijava/registracija + reset lozinke). */
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  isRegisterMode = false;
  isPasswordVisible = false;
  isSubmitting = false;          // spriječi dvostruke submit-e

  // Form model
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  confirmPassword = '';
  membership = '';
  phone = '';

  // Poruke
  successMessage = '';
  errorMessage = '';

  /**
   * Regex za e-mail:
   * - dopušta točku, plus, crticu u lokalnom dijelu
   * - zahtijeva barem jednu točku u domeni i min 2 slova TLD
   */
  emailPattern = '^[a-zA-Z0-9._%+\\-]+@(?:[A-Za-z0-9-]+\\.)+[A-Za-z]{2,}$';

  // Reset lozinke
  showResetSection = false;
  resetEmail = '';
  sendingReset = false;

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  /** Prebaci između Prijave i Registracije. */
  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.resetForm();
    this.showResetSection = false;
    this.resetEmail = '';
    this.isPasswordVisible = false;
  }

  /** Očisti polja i poruke. */
  resetForm(): void {
    this.email = '';
    this.password = '';
    this.firstName = '';
    this.lastName = '';
    this.confirmPassword = '';
    this.membership = '';
    this.phone = '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  /** Prikaži/sakrij lozinku. */
  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  /** Otvori/zatvori "zaboravljena lozinka" blok. */
  toggleResetSection(): void {
    this.showResetSection = !this.showResetSection;

    if (this.showResetSection) {
      this.successMessage = '';
      this.errorMessage = '';
      if (!this.resetEmail && this.email) this.resetEmail = this.email;
    }
  }

  /** Pošalji e-mail za reset lozinke (poruka je neutralna radi privatnosti). */
  async sendPasswordReset(): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';

    const email = this.normalizeEmail(this.resetEmail);
    if (!email) {
      this.errorMessage = 'Upišite e-mail adresu.';
      return;
    }

    this.sendingReset = true;
    try {
      await this.authService.resetPassword(email);
      this.successMessage = 'Ako račun postoji, primit ćeš e-mail s uputama za reset lozinke.';
      this.showResetSection = false;
      this.resetEmail = '';
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/invalid-email') {
        this.errorMessage = 'Unesite valjanu e-mail adresu.';
      } else if (code === 'auth/too-many-requests') {
        this.errorMessage = 'Previše pokušaja. Pokušaj kasnije.';
      } else {
        this.errorMessage = 'Nije uspjelo slanje e-maila za reset. Pokušaj kasnije.';
      }
    } finally {
      this.sendingReset = false;
    }
  }

  /** Submit za prijavu/registraciju. */
  async onSubmit(): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const email = this.normalizeEmail(this.email);

    try {
      if (this.isRegisterMode) {
        // --- REGISTRACIJA ---
        if (this.password !== this.confirmPassword) {
          this.errorMessage = 'Lozinke se ne podudaraju!';
          return;
        }

        const userCred = await this.authService.register(email, this.password);
        const uid = userCred.user.uid;

        const userData = {
          firstName: this.firstName.trim(),
          lastName: this.lastName.trim(),
          email,
          membership: this.membership,
          phone: this.phone ? this.phone.trim() : null,
          createdAt: new Date(),
        };

        await this.authService.saveUserData(uid, userData);
        await this.authService.logout();

        this.successMessage = 'Registracija uspješna! Sada se možete prijaviti.';
        setTimeout(() => {
          this.toggleMode();
          this.successMessage = '';
        }, 1500);
      } else {
        // --- PRIJAVA ---
        await this.authService.login(email, this.password);
        this.router.navigate(['/']);
      }
    } catch (err: any) {
      const code = err?.code;
      if (this.isRegisterMode) {
        if (code === 'auth/email-already-in-use') this.errorMessage = 'Već postoji račun s tom e-mail adresom.';
        else if (code === 'auth/invalid-email') this.errorMessage = 'Unesite valjanu e-mail adresu.';
        else if (code === 'auth/weak-password') this.errorMessage = 'Lozinka mora imati najmanje 6 znakova.';
        else if (code === 'auth/too-many-requests') this.errorMessage = 'Previše pokušaja. Pokušaj kasnije.';
        else this.errorMessage = 'Greška pri registraciji.';
      } else {
        if (
          code === 'auth/wrong-password' ||
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-email' ||
          code === 'auth/invalid-credential'
        ) {
          this.errorMessage = 'Krivi email ili lozinka.';
        } else if (code === 'auth/too-many-requests') {
          this.errorMessage = 'Previše pokušaja. Pokušaj kasnije.';
        } else {
          this.errorMessage = 'Greška pri prijavi.';
        }
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  /** Trim + lowercase e-mail (sprječava duplikate tipa "Ime@Domena.com"). */
  private normalizeEmail(value: string): string {
    return (value || '').trim().toLowerCase();
  }
}
