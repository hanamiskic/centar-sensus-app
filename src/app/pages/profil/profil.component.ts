import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

interface AppUser {
  uid: string;
  email: string | null;
  fullName: string;
}

@Component({
  selector: 'app-profil',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent {
    user$: Observable<AppUser | null>;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.currentUser$;
  }

}


