import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  customerProfile: any = null;
  error: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const kunnr = localStorage.getItem('customerId');
    if (kunnr) {
      this.loadCustomerProfile(kunnr);
    } else {
      this.error = 'Customer ID not found. Please log in.';
    }
  }

  loadCustomerProfile(kunnr: string): void {
    this.isLoading = true;
    this.error = '';
    
    this.http.post<any>('http://localhost:3000/profile', { KUNNR: kunnr }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.status === 'S' && response.profile) {
          const profile = response.profile;
          
          this.customerProfile = {
            id: profile.KUNNR,
            name: profile.NAME1,
            address: this.buildAddress(profile.STRAS, profile.ORT01, profile.PSTLZ, profile.LAND1),
            phone: profile.TELF1 || 'Not provided',
            salesOrg: profile.VKORG || 'N/A',
            distChannel: profile.VTWEG || 'N/A',
            division: profile.SPART || 'N/A',
            salesDistrict: profile.BZIRK || 'N/A',
            partnerFunction: profile.PARVW || 'N/A',
            partnerCounter: profile.PARZA || 'N/A',
            status: 'Active' // Default status
          };
        } else {
          this.error = response.message || 'Failed to load profile data';
          this.customerProfile = null;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Unable to load customer profile. Please try again later.';
        this.customerProfile = null;
        console.error('Profile load error:', err);
      }
    });
  }

  buildAddress(street: string, city: string, postal: string, country: string): string {
    const parts = [street, city, postal, country].filter(Boolean);
    return parts.join(', ');
  }
}