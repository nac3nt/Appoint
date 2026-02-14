import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email = '';
  password = '';
  name = '';
  role = '';
  error = '';
  loading = false;

  roles = [
    { value: 'Patient', label: 'Patient' },
    { value: 'Doctor', label: 'Doctor' },
    { value: 'Admin', label: 'Admin' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register(): void {
    if (!this.email || !this.password || !this.name || !this.role) {
      this.error = 'Please fill all fields';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.error = '';

    const request: RegisterRequest = {
      email: this.email,
      password: this.password,
      name: this.name,
      role: this.role
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed. Email may already exist.';
        console.error('Registration error:', err);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}