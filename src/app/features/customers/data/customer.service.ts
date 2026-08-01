import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { Customer, CustomerCreateRequest, CustomerUpdateRequest } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/customers';

  list(page: number, size: number): Observable<ApiResponse<Page<Customer>>> {
    return this.http.get<ApiResponse<Page<Customer>>>(this.baseUrl, {
      params: { page, size },
    });
  }

  create(request: CustomerCreateRequest): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.baseUrl, request);
  }

  update(id: number, request: CustomerUpdateRequest): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.baseUrl}/${id}`, request);
  }

  updateStatus(id: number, active: boolean): Observable<ApiResponse<Customer>> {
    return this.http.patch<ApiResponse<Customer>>(`${this.baseUrl}/${id}/status`, { active });
  }
}
