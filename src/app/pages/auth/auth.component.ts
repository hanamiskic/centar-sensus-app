import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  email = '';
  password = '';
  firstName = '';
  lastName = '';
  confirmPassword = '';
  membership = '';
  phone = '';
  successMessage = '';
  errorMessage = '';
  emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';


  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.resetForm();
  }

  resetForm() {
    this.email = '';
    this.password = '';
    this.firstName = '';
    this.lastName = '';
    this.confirmPassword = '';
    this.membership = '';
    this.phone = '';
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  async onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.isRegisterMode) {
      // --- REGISTRACIJA ---
      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Lozinke se ne podudaraju!';
        return;
      }
      try {
        const userCred = await this.authService.register(
          this.email,
          this.password
        );
        const uid = userCred.user.uid;

        const userData = {
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          membership: this.membership,
          phone: this.phone || null,
          createdAt: new Date(),
        };

        await this.authService.saveUserData(uid, userData);

        // odmah logout nakon registracije
        await this.authService.logout();

        this.successMessage = 'Registracija uspješna! Sada se možete prijaviti.';
        setTimeout(() => {
          this.toggleMode();
          this.successMessage = '';
        }, 1500);
      } catch (err: any) {
        const code = err?.code;

        if (code === 'auth/email-already-in-use') {
          this.errorMessage = 'Već postoji račun s tom e-mail adresom.';
        } else if (code === 'auth/invalid-email') {
          this.errorMessage = 'Unesite valjanu e-mail adresu.';
        } else if (code === 'auth/weak-password') {
          this.errorMessage = 'Lozinka mora imati najmanje 6 znakova.';
        } else {
          this.errorMessage = 'Greška pri registraciji.';
        }
      }
    } else {
      // --- PRIJAVA ---
      try {
        const userCred = await this.authService.login(
          this.email,
          this.password
        );
        console.log('✅ Prijava uspješna:', userCred.user);

        // provjeri i ispiši claimove
        const claims = await this.authService.getCurrentClaims();
        console.log('Admin claim?', claims?.['admin'] === true, claims);

        this.router.navigate(['/']);
      } catch (err: any) {
        console.error('Greška pri prijavi:', err);
        const errorCode = err?.code;

        if (
          errorCode === 'auth/wrong-password' ||
          errorCode === 'auth/user-not-found' ||
          errorCode === 'auth/invalid-email' ||
          errorCode === 'auth/invalid-credential'
        ) {
          this.errorMessage = 'Krivi email ili lozinka.';
        } else {
          this.errorMessage = 'Greška pri prijavi.';
        }
      }
    }
  }
}
