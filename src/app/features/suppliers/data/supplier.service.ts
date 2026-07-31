import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { Supplier, SupplierCreateRequest, SupplierUpdateRequest } from './supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/suppliers';

  list(page: number, size: number): Observable<ApiResponse<Page<Supplier>>> {
    return this.http.get<ApiResponse<Page<Supplier>>>(this.baseUrl, {
      params: { page, size },
    });
  }

  create(request: SupplierCreateRequest): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(this.baseUrl, request);
  }

  update(id: number, request: SupplierUpdateRequest): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${this.baseUrl}/${id}`, request);
  }

  updateStatus(id: number, active: boolean): Observable<ApiResponse<Supplier>> {
    return this.http.patch<ApiResponse<Supplier>>(`${this.baseUrl}/${id}/status`, { active });
  }
}
