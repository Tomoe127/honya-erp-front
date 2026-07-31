import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { Purchase, PurchaseCreateRequest } from './purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/purchases';

  list(page: number, size: number): Observable<ApiResponse<Page<Purchase>>> {
    return this.http.get<ApiResponse<Page<Purchase>>>(this.baseUrl, {
      params: { page, size, sort: 'id,desc' },
    });
  }

  create(request: PurchaseCreateRequest): Observable<ApiResponse<Purchase>> {
    return this.http.post<ApiResponse<Purchase>>(this.baseUrl, request);
  }

  cancel(id: number): Observable<ApiResponse<Purchase>> {
    return this.http.patch<ApiResponse<Purchase>>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
