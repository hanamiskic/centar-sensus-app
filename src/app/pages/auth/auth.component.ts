import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // prilagodi path ako treba

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  isRegisterMode = false;
  isPasswordVisible: boolean = false;

  email: string = '';
  password: string = '';
  firstName: string = '';
  lastName: string = '';
  confirmPassword: string = '';
  membership: string = '';
  phone: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  // ✅ Konstruktor s AuthService-om
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

        this.successMessage = 'Registracija uspješna! Možete se prijaviti.';

        // Prebaci na login mod nakon kraće pauze
        setTimeout(() => {
          this.toggleMode();
          this.successMessage = '';
        }, 2000);
      } catch (err) {
        this.errorMessage = (err as any).message || 'Greška pri registraciji';
      }
    } else {
      try {
        const userCred = await this.authService.login(
          this.email,
          this.password
        );
        console.log('✅ Prijava uspješna:', userCred.user);

        // Prebaci na početnu
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
