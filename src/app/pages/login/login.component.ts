import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient,HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports:[FormsModule,CommonModule,RouterModule,HttpClientModule]
})
export class LoginComponent {
  custno = '';
  password = '';
  errorMessage: string = '';
  rememberMe = false;

   constructor(private http: HttpClient, private router: Router) {}
  login() {
    console.log(this.custno);
  this.http.post<any>('http://localhost:3000/api', {
    custno: this.custno,
    password: this.password
   
  }).subscribe({
    next: (response) => {
      if (response.status === 'S') {
          localStorage.setItem('customerId',this.custno);
        this.router.navigate(['/home']);
        alert("login successful");
      } else {
        this.errorMessage = response.message;
      }
    },
    error: () => {
      this.errorMessage = 'Login failed. Please try again.';
    }
  });

}
  customerno(arg0: string, customerno: any) {
    throw new Error('Method not implemented.');
  }
}